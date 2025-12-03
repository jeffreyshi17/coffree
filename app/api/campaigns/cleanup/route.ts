import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// POST - Analyze logs and mark campaigns that have all failed sends as invalid
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all campaigns that are currently marked as valid
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_valid', true)
      .eq('is_expired', false);

    if (campaignsError) {
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ message: 'No valid campaigns to check', updated: [] });
    }

    // Get all message logs
    const { data: logs, error: logsError } = await supabase
      .from('message_logs')
      .select('*');

    if (logsError) {
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    const updated: Array<{ campaign_id: string; reason: string }> = [];

    for (const campaign of campaigns) {
      // Get logs for this campaign
      const campaignLogs = logs?.filter(log => log.campaign_id === campaign.campaign_id) || [];

      if (campaignLogs.length === 0) {
        // No logs at all - skip (hasn't been tested yet)
        continue;
      }

      const successCount = campaignLogs.filter(log => log.status === 'success').length;
      const failedCount = campaignLogs.filter(log => log.status === 'failed').length;

      // If there are logs but zero successes and at least one failure
      // Check if marketing_channel is malformed (contains non-letters)
      const isMalformedChannel = /[^a-zA-Z]/.test(campaign.marketing_channel);
      if (isMalformedChannel) {
        const fixedChannel = campaign.marketing_channel.replace(/[^a-zA-Z]/g, '');
        await supabase
          .from('campaigns')
          .update({ marketing_channel: fixedChannel })
          .eq('campaign_id', campaign.campaign_id);

        updated.push({
          campaign_id: campaign.campaign_id,
          reason: `fixed marketing_channel from "${campaign.marketing_channel}" to "${fixedChannel}"`
        });
      }

      if (successCount === 0 && failedCount > 0) {
        // Check if errors indicate campaign issues
        const hasExpiredError = campaignLogs.some(log =>
          log.error_message?.toLowerCase().includes('expired')
        );
        const hasInvalidError = campaignLogs.some(log =>
          log.error_message?.toLowerCase().includes('invalid campaign') ||
          log.error_message?.toLowerCase().includes('marketingchannel is invalid')
        );

        if (hasExpiredError || hasInvalidError) {
          // Mark as invalid
          await supabase
            .from('campaigns')
            .update({
              is_valid: false,
              is_expired: hasExpiredError
            })
            .eq('campaign_id', campaign.campaign_id);

          updated.push({
            campaign_id: campaign.campaign_id,
            reason: hasExpiredError ? 'expired' : 'invalid'
          });
        }
      }
    }

    return NextResponse.json({
      message: `Cleanup complete. Marked ${updated.length} campaign(s) as invalid.`,
      updated,
      checked: campaigns.length
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Preview what would be cleaned up (dry run)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all campaigns that are currently marked as valid
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_valid', true)
      .eq('is_expired', false);

    if (campaignsError) {
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ message: 'No valid campaigns to check', wouldUpdate: [] });
    }

    // Get all message logs
    const { data: logs, error: logsError } = await supabase
      .from('message_logs')
      .select('*');

    if (logsError) {
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    const wouldUpdate: Array<{
      campaign_id: string;
      marketing_channel: string;
      reason: string;
      successCount: number;
      failedCount: number;
      sampleErrors: string[];
    }> = [];

    for (const campaign of campaigns) {
      // Get logs for this campaign
      const campaignLogs = logs?.filter(log => log.campaign_id === campaign.campaign_id) || [];

      if (campaignLogs.length === 0) {
        continue;
      }

      const successCount = campaignLogs.filter(log => log.status === 'success').length;
      const failedCount = campaignLogs.filter(log => log.status === 'failed').length;

      // Check if marketing_channel is malformed (contains non-letters)
      const isMalformedChannel = /[^a-zA-Z]/.test(campaign.marketing_channel);
      if (isMalformedChannel) {
        const fixedChannel = campaign.marketing_channel.replace(/[^a-zA-Z]/g, '');
        wouldUpdate.push({
          campaign_id: campaign.campaign_id,
          marketing_channel: campaign.marketing_channel,
          reason: `would fix channel to "${fixedChannel}"`,
          successCount,
          failedCount,
          sampleErrors: []
        });
      }

      if (successCount === 0 && failedCount > 0) {
        const hasExpiredError = campaignLogs.some(log =>
          log.error_message?.toLowerCase().includes('expired')
        );
        const hasInvalidError = campaignLogs.some(log =>
          log.error_message?.toLowerCase().includes('invalid campaign') ||
          log.error_message?.toLowerCase().includes('marketingchannel is invalid')
        );

        if (hasExpiredError || hasInvalidError) {
          const uniqueErrors = [...new Set(
            campaignLogs
              .filter(log => log.error_message)
              .map(log => log.error_message)
          )];

          wouldUpdate.push({
            campaign_id: campaign.campaign_id,
            marketing_channel: campaign.marketing_channel,
            reason: hasExpiredError ? 'expired' : 'invalid',
            successCount,
            failedCount,
            sampleErrors: uniqueErrors.slice(0, 3)
          });
        }
      }
    }

    return NextResponse.json({
      message: `Dry run: Would mark ${wouldUpdate.length} campaign(s) as invalid.`,
      wouldUpdate,
      totalChecked: campaigns.length
    });
  } catch (error) {
    console.error('Error in cleanup preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
