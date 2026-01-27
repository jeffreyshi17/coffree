import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters and return just the digits
  return phone.replace(/\D/g, '');
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPhoneWithCapitalOne(
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

      // Check for invalid phone number error
      const errorText = data.developerText || data.userText || '';
      if (errorText.toLowerCase().includes('phonenumber is invalid') ||
          errorText.toLowerCase().includes('phone') && errorText.toLowerCase().includes('invalid')) {
        return { success: false, error: 'Invalid phone number' };
      }

      // For other errors (campaign issues, etc), we'll still consider the phone valid
      // Only return false if it's specifically a phone number problem
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

// GET - Fetch all phone numbers
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch phone numbers' }, { status: 500 });
    }

    return NextResponse.json({ phones: data || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a new phone number
export async function POST(request: NextRequest) {
  try {
    const { phone, platform, pushToken } = await request.json();

    if (!phone || !platform) {
      return NextResponse.json({ error: 'Phone and platform are required' }, { status: 400 });
    }

    if (platform !== 'android' && platform !== 'apple') {
      return NextResponse.json({ error: 'Platform must be either "android" or "apple"' }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    // Basic format check
    if (normalizedPhone.length !== 10) {
      return NextResponse.json({ error: 'Phone number must be 10 digits' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if phone already exists
    const { data: existing } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Phone number already subscribed' }, { status: 400 });
    }

    // Get all valid campaigns to test with
    const { data: validCampaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_valid', true)
      .eq('is_expired', false)
      .order('first_seen_at', { ascending: false });

    if (!validCampaigns || validCampaigns.length === 0) {
      // No campaigns yet, just add the number without testing
      const { data, error } = await supabase
        .from('phone_numbers')
        .insert({ phone: normalizedPhone, platform, push_token: pushToken || null })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to add phone number' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        phone: data,
        message: 'Phone added successfully (no campaigns to test with yet)'
      });
    }

    // Send all valid campaigns to the new phone
    console.log(`Sending ${validCampaigns.length} campaigns to new phone ${normalizedPhone}`);
    let phoneIsValid = false;
    let sentCampaigns: string[] = [];
    let failedCampaigns: string[] = [];

    for (const campaign of validCampaigns) {
      const testResult = await testPhoneWithCapitalOne(
        normalizedPhone,
        platform,
        campaign.campaign_id,
        campaign.marketing_channel
      );

      if (testResult.success) {
        phoneIsValid = true;
        sentCampaigns.push(campaign.campaign_id);
        // Log successful send
        await supabase.from('message_logs').insert({
          campaign_id: campaign.campaign_id,
          marketing_channel: campaign.marketing_channel,
          link: campaign.full_link,
          phone_number: normalizedPhone,
          status: 'success',
          error_message: null,
        });
      } else {
        const errorLower = (testResult.error || '').toLowerCase();

        // Check if campaign is expired/invalid
        if (errorLower.includes('invalid campaign') ||
            errorLower.includes('expired') ||
            errorLower.includes('campaign')) {
          // Mark this campaign as expired/invalid
          console.log(`Campaign ${campaign.campaign_id} is invalid/expired, updating status`);
          failedCampaigns.push(campaign.campaign_id);
          await supabase
            .from('campaigns')
            .update({
              is_valid: false,
              is_expired: errorLower.includes('expired')
            })
            .eq('campaign_id', campaign.campaign_id);
        } else if (errorLower.includes('phone')) {
          // Phone number issue - reject it
          return NextResponse.json({
            error: 'Invalid phone number - Capital One rejected it',
            details: testResult.error
          }, { status: 400 });
        } else {
          // Other error - log it but continue
          failedCampaigns.push(campaign.campaign_id);
          await supabase.from('message_logs').insert({
            campaign_id: campaign.campaign_id,
            marketing_channel: campaign.marketing_channel,
            link: campaign.full_link,
            phone_number: normalizedPhone,
            status: 'failed',
            error_message: testResult.error,
          });
        }
      }
    }

    // If phone wasn't validated by any campaign but no phone error was returned, add it anyway
    if (!phoneIsValid) {
      console.log(`Couldn't validate phone with any campaign, but no phone errors - adding anyway`);
    }

    // Add the phone to the database
    const { data, error } = await supabase
      .from('phone_numbers')
      .insert({ phone: normalizedPhone, platform, push_token: pushToken || null })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to add phone number' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      phone: data,
      message: phoneIsValid
        ? `Phone added successfully. Sent ${sentCampaigns.length} campaign(s)${failedCampaigns.length > 0 ? `, ${failedCampaigns.length} failed` : ''}`
        : `Phone added (couldn't send any campaigns)`,
      sent: sentCampaigns,
      failed: failedCampaigns
    });
  } catch (error) {
    console.error('Error in POST /api/phone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a phone number
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if phone number exists first
    const { data: existing, error: checkError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({
        error: 'Phone number not found. This number is not subscribed to the mailing list.'
      }, { status: 404 });
    }

    // Delete the phone number
    const { error } = await supabase
      .from('phone_numbers')
      .delete()
      .eq('phone', normalizedPhone);

    if (error) {
      return NextResponse.json({ error: 'Failed to remove phone number' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Phone number removed' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
