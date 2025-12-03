import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parse as parseUrl } from 'url';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function parseCoffreeLink(link: string) {
  try {
    const url = new URL(link);
    const params = new URLSearchParams(url.search);
    const campaignId = params.get('cid');
    let marketingChannel = params.get('mc');

    // Sanitize marketing channel to only contain letters (removes trailing ) or other invalid chars)
    if (marketingChannel) {
      marketingChannel = marketingChannel.replace(/[^a-zA-Z]/g, '');
    }

    return { campaignId, marketingChannel: marketingChannel || null };
  } catch (error) {
    return { campaignId: null, marketingChannel: null };
  }
}

async function validateCampaign(
  campaignId: string,
  marketingChannel: string
): Promise<{ valid: boolean; error?: string }> {
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

// GET - Fetch campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const source = searchParams.get('source'); // 'auto' or 'manual'
    const isValid = searchParams.get('is_valid');
    const isExpired = searchParams.get('is_expired');
    const includePhones = searchParams.get('include_phones') === 'true';

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('campaigns')
      .select('*')
      .order('first_seen_at', { ascending: false })
      .limit(limit);

    if (source) {
      query = query.eq('source', source);
    }

    if (isValid !== null && isValid !== undefined) {
      query = query.eq('is_valid', isValid === 'true');
    }

    if (isExpired !== null && isExpired !== undefined) {
      query = query.eq('is_expired', isExpired === 'true');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch campaigns'
      }, { status: 500 });
    }

    // If includePhones is true, fetch successful phone numbers for each campaign
    let campaignsWithPhones = data || [];
    if (includePhones && data) {
      const campaignIds = data.map(c => c.campaign_id);

      // Fetch all successful message logs for these campaigns
      const { data: logs } = await supabase
        .from('message_logs')
        .select('campaign_id, phone_number')
        .in('campaign_id', campaignIds)
        .eq('status', 'success');

      // Function to censor phone number (show only last 4 digits)
      const censorPhone = (phone: string): string => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length >= 4) {
          const last4 = cleaned.slice(-4);
          return `***${last4}`;
        }
        return '****';
      };

      // Group phones by campaign_id and censor them
      const phonesByCampaign: Record<string, string[]> = {};
      logs?.forEach(log => {
        if (!phonesByCampaign[log.campaign_id]) {
          phonesByCampaign[log.campaign_id] = [];
        }
        phonesByCampaign[log.campaign_id].push(censorPhone(log.phone_number));
      });

      // Add censored phones to each campaign
      campaignsWithPhones = data.map(campaign => ({
        ...campaign,
        successful_phones: phonesByCampaign[campaign.campaign_id] || []
      }));
    }

    return NextResponse.json({
      campaigns: campaignsWithPhones,
      count: campaignsWithPhones.length || 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      full_link,
      source,
      reddit_post_url = null,
      reddit_subreddit = null,
      notes = null,
    } = body;

    if (!full_link || !source) {
      return NextResponse.json({
        error: 'full_link and source are required'
      }, { status: 400 });
    }

    if (!['auto', 'manual'].includes(source)) {
      return NextResponse.json({
        error: 'Source must be either "auto" or "manual"'
      }, { status: 400 });
    }

    // Parse the campaign ID and marketing channel from the link
    const { campaignId, marketingChannel } = parseCoffreeLink(full_link);

    if (!campaignId || !marketingChannel) {
      return NextResponse.json({
        error: 'Invalid coffree link - could not extract campaign ID or marketing channel'
      }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if campaign already exists
    const { data: existing } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (existing) {
      return NextResponse.json({
        error: 'Campaign already exists',
        campaign: existing
      }, { status: 400 });
    }

    // Validate the campaign with Capital One API before inserting
    const validation = await validateCampaign(campaignId, marketingChannel);
    if (!validation.valid) {
      return NextResponse.json({
        error: `Campaign validation failed: ${validation.error}`,
        type: validation.error === 'Campaign Expired' ? 'expired' : 'invalid'
      }, { status: 400 });
    }

    // Insert the new campaign
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        campaign_id: campaignId,
        marketing_channel: marketingChannel,
        full_link,
        source,
        reddit_post_url,
        reddit_subreddit,
        notes,
        is_valid: true,
        is_expired: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting campaign:', error);
      return NextResponse.json({
        error: 'Failed to add campaign',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      campaign: data,
      created: true,
      message: 'Campaign added successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/campaigns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update campaign status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaign_id,
      is_valid,
      is_expired,
      notes,
    } = body;

    if (!campaign_id) {
      return NextResponse.json({
        error: 'campaign_id is required'
      }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build the update object
    const updates: any = {};
    if (is_valid !== undefined) updates.is_valid = is_valid;
    if (is_expired !== undefined) updates.is_expired = is_expired;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        error: 'No fields to update'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('campaign_id', campaign_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating campaign:', error);
      return NextResponse.json({
        error: 'Failed to update campaign',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      campaign: data,
      message: 'Campaign updated successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /api/campaigns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaign_id = searchParams.get('campaign_id');

    if (!campaign_id) {
      return NextResponse.json({
        error: 'campaign_id is required'
      }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('campaign_id', campaign_id);

    if (error) {
      return NextResponse.json({
        error: 'Failed to delete campaign'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
