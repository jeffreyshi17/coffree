import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface CoffeeLink {
  cid: string;
  mc: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function parseCoffeeLink(url: string): CoffeeLink | null {
  try {
    const urlObj = new URL(url);

    // Validate the base URL
    if (!urlObj.hostname.includes('coffree.capitalone.com') || !urlObj.pathname.includes('/sms/')) {
      return null;
    }

    const cid = urlObj.searchParams.get('cid');
    let mc = urlObj.searchParams.get('mc');

    if (!cid || !mc) {
      return null;
    }

    // Sanitize marketing channel to only contain letters (removes trailing ) or other invalid chars)
    mc = mc.replace(/[^a-zA-Z]/g, '');

    if (!mc) {
      return null;
    }

    return { cid, mc };
  } catch (error) {
    return null;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function validateCampaign(
  campaignId: string,
  marketingChannel: string,
  maxRetries: number = 3,
  retryDelayMs: number = 2000
): Promise<{ valid: boolean; error?: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Test the campaign with a dummy phone number
      const response = await fetch('https://api.capitalone.com/protected/24565/retail/digital-offers/text-pass', {
        method: 'POST',
        headers: {
          'accept': 'application/json; v=1',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaignId,
          marketingChannel: marketingChannel,
          platform: 'android',
          phoneNumber: '0000000000', // Dummy number for validation
        }),
      });

      const data = await response.json();

      // Check for specific error responses that indicate campaign issues
      if (data.id === 107 || data.developerText?.toLowerCase().includes('invalid campaign')) {
        return { valid: false, error: 'Invalid Campaign Id' };
      }

      if (data.id === 108 || data.developerText?.toLowerCase().includes('expired')) {
        return { valid: false, error: 'Campaign Expired' };
      }

      // If we get a 200 status, campaign is valid
      if (response.ok || response.status === 200) {
        return { valid: true };
      }

      // If error mentions phone number specifically, it means campaign is valid but phone is bad
      if (data.developerText && (
        data.developerText.toLowerCase().includes('phone') ||
        data.developerText.toLowerCase().includes('number')
      )) {
        return { valid: true };
      }

      // For any other error, treat as potentially invalid campaign
      return { valid: false, error: data.developerText || 'Unknown error validating campaign' };
    } catch (error) {
      // Network error - retry with delay if we have attempts left
      if (attempt < maxRetries) {
        await sleep(retryDelayMs);
        continue;
      }
      return { valid: false, error: 'Failed to validate campaign' };
    }
  }

  return { valid: false, error: 'Failed to validate campaign' };
}

async function sendCoffeeToPhone(
  phone: string,
  platform: 'android' | 'apple',
  campaignId: string,
  marketingChannel: string,
  maxRetries: number = 3,
  retryDelayMs: number = 2000
): Promise<{ success: boolean; error?: string }> {
  const apiPlatform = platform === 'apple' ? 'iOS' : 'android';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.capitalone.com/protected/24565/retail/digital-offers/text-pass', {
        method: 'POST',
        headers: {
          'accept': 'application/json; v=1',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          marketingChannel,
          platform: apiPlatform,
          phoneNumber: phone,
        }),
      });

      const data = await response.json();

      if (response.status === 200 || response.ok) {
        return { success: true };
      }

      return { success: false, error: data.developerText || 'Failed to send' };
    } catch (error) {
      // Network error - retry with delay if we have attempts left
      if (attempt < maxRetries) {
        await sleep(retryDelayMs);
        continue;
      }
      return { success: false, error: 'Network error' };
    }
  }

  return { success: false, error: 'Network error' };
}

export async function POST(request: NextRequest) {
  try {
    const { link, phoneOverride } = await request.json();

    if (!link) {
      return NextResponse.json({ error: 'Link is required' }, { status: 400 });
    }

    // Parse the link
    const parsed = parseCoffeeLink(link);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid link format. Expected format: https://coffree.capitalone.com/sms/?cid=xxx&mc=yyy' }, { status: 400 });
    }

    // Validate the campaign
    const supabase = createClient(supabaseUrl, supabaseKey);
    const validation = await validateCampaign(parsed.cid, parsed.mc);
    if (!validation.valid) {
      // If the campaign is invalid or expired, update its status in the campaigns table
      await supabase
        .from('campaigns')
        .update({
          is_valid: false,
          is_expired: validation.error === 'Campaign Expired'
        })
        .eq('campaign_id', parsed.cid);

      return NextResponse.json({
        error: validation.error,
        type: validation.error === 'Invalid Campaign Id' ? 'invalid' : 'expired'
      }, { status: 400 });
    }

    // Record this campaign in the campaigns table if it doesn't exist
    const { data: existingCampaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', parsed.cid)
      .single();

    let isNewCampaign = false;
    if (!existingCampaign) {
      // This is a new manually-added campaign
      await supabase
        .from('campaigns')
        .insert({
          campaign_id: parsed.cid,
          marketing_channel: parsed.mc,
          full_link: link,
          source: 'manual',
          is_valid: true,
          is_expired: false,
        });
      isNewCampaign = true;
    } else if (!existingCampaign.first_submitted_at) {
      // Update the first submission timestamp
      await supabase
        .from('campaigns')
        .update({ first_submitted_at: new Date().toISOString() })
        .eq('campaign_id', parsed.cid);
    }

    // Send push notification for new campaigns
    if (isNewCampaign) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId: parsed.cid,
            marketingChannel: parsed.mc,
            title: '☕ New Free Coffee Available!',
            body: 'A new coffee campaign just arrived. Check the app to get your voucher!',
          }),
        });
      } catch (error) {
        // Don't fail the entire request if notification fails
      }
    }

    // Get phone numbers - either the override or all from Supabase
    let phones;
    if (phoneOverride) {
      // If phoneOverride is provided, find that specific phone in the database
      const { data: phoneData, error: fetchError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('phone', phoneOverride)
        .single();

      if (fetchError || !phoneData) {
        return NextResponse.json({ error: 'Phone number not found in database' }, { status: 400 });
      }

      phones = [phoneData];
    } else {
      // Get all phone numbers from Supabase
      const { data: allPhones, error: fetchError } = await supabase
        .from('phone_numbers')
        .select('*');

      if (fetchError) {
        return NextResponse.json({ error: 'Failed to fetch phone numbers' }, { status: 500 });
      }

      if (!allPhones || allPhones.length === 0) {
        return NextResponse.json({ error: 'No phone numbers subscribed' }, { status: 400 });
      }

      phones = allPhones;
    }

    // Check which phones have already received this campaign successfully
    const { data: existingLogs } = await supabase
      .from('message_logs')
      .select('phone_number')
      .eq('campaign_id', parsed.cid)
      .eq('status', 'success');

    const alreadyReceivedPhones = new Set(
      existingLogs?.map(log => log.phone_number) || []
    );

    // Send to phone numbers that haven't received this campaign yet
    const results = await Promise.all(
      phones.map(async (phoneRecord) => {
        // Skip if this phone already successfully received this campaign
        if (alreadyReceivedPhones.has(phoneRecord.phone)) {
          return {
            phone: phoneRecord.phone,
            success: true,
            skipped: true,
            error: 'Already received this campaign',
          };
        }

        const result = await sendCoffeeToPhone(
          phoneRecord.phone,
          phoneRecord.platform,
          parsed.cid,
          parsed.mc
        );

        // Log the result
        await supabase.from('message_logs').insert({
          campaign_id: parsed.cid,
          marketing_channel: parsed.mc,
          link: link,
          phone_number: phoneRecord.phone,
          status: result.success ? 'success' : 'failed',
          error_message: result.error,
        });

        return {
          phone: phoneRecord.phone,
          success: result.success,
          skipped: false,
          error: result.error,
        };
      })
    );

    const successCount = results.filter(r => r.success && !r.skipped).length;
    const skippedCount = results.filter(r => r.skipped).length;
    const failedCount = results.filter(r => !r.success && !r.skipped).length;
    const attemptedCount = successCount + failedCount; // excludes skipped

    // If all attempted sends failed, mark campaign as invalid
    if (attemptedCount > 0 && failedCount === attemptedCount) {
      // Check if any errors indicate campaign issues
      const failedResults = results.filter(r => !r.success && !r.skipped);
      const hasCampaignError = failedResults.some(r =>
        r.error?.toLowerCase().includes('invalid campaign') ||
        r.error?.toLowerCase().includes('expired')
      );

      if (hasCampaignError) {
        await supabase
          .from('campaigns')
          .update({
            is_valid: false,
            is_expired: failedResults.some(r => r.error?.toLowerCase().includes('expired'))
          })
          .eq('campaign_id', parsed.cid);
      }
    }

    const messageParts = [];
    if (successCount > 0) messageParts.push(`Sent to ${successCount} phone(s)`);
    if (skippedCount > 0) messageParts.push(`${skippedCount} skipped (already received)`);
    if (failedCount > 0) messageParts.push(`${failedCount} failed`);

    return NextResponse.json({
      success: true,
      message: messageParts.join(', '),
      results,
      campaignId: parsed.cid,
      marketingChannel: parsed.mc,
      stats: {
        sent: successCount,
        skipped: skippedCount,
        failed: failedCount,
        total: phones.length
      }
    });

  } catch (error) {
    console.error('Error in send-coffee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
