import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET - Analyze gaps (dry run)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all phones
    const { data: phones, error: phonesError } = await supabase
      .from('phone_numbers')
      .select('*');

    if (phonesError || !phones) {
      return NextResponse.json({ error: 'Failed to fetch phones' }, { status: 500 });
    }

    // Get all valid campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_valid', true)
      .eq('is_expired', false);

    if (campaignsError || !campaigns) {
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    // Get all successful logs
    const { data: successLogs, error: logsError } = await supabase
      .from('message_logs')
      .select('campaign_id, phone_number')
      .eq('status', 'success');

    if (logsError) {
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    // Build a set of "campaign_id:phone" for successful sends
    const successfulSends = new Set(
      successLogs?.map(log => `${log.campaign_id}:${log.phone_number}`) || []
    );

    // Find gaps for each campaign
    const gaps: Array<{
      campaign_id: string;
      marketing_channel: string;
      missing_phones: string[];
    }> = [];

    for (const campaign of campaigns) {
      const missingPhones = phones.filter(phone =>
        !successfulSends.has(`${campaign.campaign_id}:${phone.phone}`)
      ).map(p => p.phone);

      if (missingPhones.length > 0) {
        gaps.push({
          campaign_id: campaign.campaign_id,
          marketing_channel: campaign.marketing_channel,
          missing_phones: missingPhones
        });
      }
    }

    const totalMissing = gaps.reduce((sum, g) => sum + g.missing_phones.length, 0);

    return NextResponse.json({
      message: `Found ${totalMissing} missing sends across ${gaps.length} campaigns`,
      total_phones: phones.length,
      valid_campaigns: campaigns.length,
      gaps
    });
  } catch (error) {
    console.error('Error in fill-gaps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Actually fill the gaps
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all phones
    const { data: phones, error: phonesError } = await supabase
      .from('phone_numbers')
      .select('*');

    if (phonesError || !phones) {
      return NextResponse.json({ error: 'Failed to fetch phones' }, { status: 500 });
    }

    // Get all valid campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_valid', true)
      .eq('is_expired', false);

    if (campaignsError || !campaigns) {
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    // Get all successful logs
    const { data: successLogs, error: logsError } = await supabase
      .from('message_logs')
      .select('campaign_id, phone_number')
      .eq('status', 'success');

    if (logsError) {
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    const successfulSends = new Set(
      successLogs?.map(log => `${log.campaign_id}:${log.phone_number}`) || []
    );

    const results: Array<{
      campaign_id: string;
      phone: string;
      success: boolean;
      error?: string;
    }> = [];

    // For each campaign, send to missing phones
    for (const campaign of campaigns) {
      const missingPhones = phones.filter(phone =>
        !successfulSends.has(`${campaign.campaign_id}:${phone.phone}`)
      );

      for (const phoneRecord of missingPhones) {
        try {
          // Send to Capital One API
          const response = await fetch('https://api.capitalone.com/protected/24565/retail/digital-offers/text-pass', {
            method: 'POST',
            headers: {
              'accept': 'application/json; v=1',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              campaignId: campaign.campaign_id,
              marketingChannel: campaign.marketing_channel,
              platform: phoneRecord.platform === 'apple' ? 'iOS' : 'android',
              phoneNumber: phoneRecord.phone,
            }),
          });

          const data = await response.json();
          const success = response.ok || response.status === 200;

          // Log the result
          await supabase.from('message_logs').insert({
            campaign_id: campaign.campaign_id,
            marketing_channel: campaign.marketing_channel,
            link: campaign.full_link,
            phone_number: phoneRecord.phone,
            status: success ? 'success' : 'failed',
            error_message: success ? null : (data.developerText || 'Failed to send'),
          });

          results.push({
            campaign_id: campaign.campaign_id,
            phone: phoneRecord.phone,
            success,
            error: success ? undefined : data.developerText
          });
        } catch (err) {
          results.push({
            campaign_id: campaign.campaign_id,
            phone: phoneRecord.phone,
            success: false,
            error: 'Network error'
          });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Sent ${successCount} successfully, ${failedCount} failed`,
      results
    });
  } catch (error) {
    console.error('Error in fill-gaps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
