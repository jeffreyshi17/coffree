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
    const mc = urlObj.searchParams.get('mc');

    if (!cid || !mc) {
      return null;
    }

    return { cid, mc };
  } catch (error) {
    return null;
  }
}

async function validateCampaign(campaignId: string, marketingChannel: string): Promise<{ valid: boolean; error?: string }> {
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
    return { valid: false, error: 'Failed to validate campaign' };
  }
}

async function sendCoffeeToPhone(
  phone: string,
  platform: 'android' | 'apple',
  campaignId: string,
  marketingChannel: string
): Promise<{ success: boolean; error?: string }> {
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
        platform,
        phoneNumber: phone,
      }),
    });

    const data = await response.json();

    if (response.status === 200 || response.ok) {
      return { success: true };
    }

    return { success: false, error: data.developerText || 'Failed to send' };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { link } = await request.json();

    if (!link) {
      return NextResponse.json({ error: 'Link is required' }, { status: 400 });
    }

    // Parse the link
    const parsed = parseCoffeeLink(link);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid link format. Expected format: https://coffree.capitalone.com/sms/?cid=xxx&mc=yyy' }, { status: 400 });
    }

    // Check if this campaign has been submitted before
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: existingLogs, error: checkError } = await supabase
      .from('message_logs')
      .select('created_at, status')
      .eq('campaign_id', parsed.cid)
      .limit(1);

    if (checkError) {
      console.error('Error checking for duplicates:', checkError);
    } else if (existingLogs && existingLogs.length > 0) {
      const lastSubmission = new Date(existingLogs[0].created_at);
      const timeAgo = formatTimeAgo(lastSubmission);
      return NextResponse.json({
        error: `This coffee link has already been submitted ${timeAgo}`,
        type: 'duplicate',
        previousSubmission: lastSubmission.toISOString()
      }, { status: 400 });
    }

    // Validate the campaign
    const validation = await validateCampaign(parsed.cid, parsed.mc);
    if (!validation.valid) {
      return NextResponse.json({
        error: validation.error,
        type: validation.error === 'Invalid Campaign Id' ? 'invalid' : 'expired'
      }, { status: 400 });
    }

    // Get all phone numbers from Supabase
    const { data: phones, error: fetchError } = await supabase
      .from('phone_numbers')
      .select('*');

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch phone numbers' }, { status: 500 });
    }

    if (!phones || phones.length === 0) {
      return NextResponse.json({ error: 'No phone numbers subscribed' }, { status: 400 });
    }

    // Send to all phone numbers and log results
    const results = await Promise.all(
      phones.map(async (phoneRecord) => {
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
          error: result.error,
        };
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent to ${successCount} phone(s), ${failedCount} failed`,
      results,
      campaignId: parsed.cid,
      marketingChannel: parsed.mc,
    });

  } catch (error) {
    console.error('Error in send-coffee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
