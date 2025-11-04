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
    const marketingChannel = params.get('mc');

    return { campaignId, marketingChannel };
  } catch (error) {
    return { campaignId: null, marketingChannel: null };
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

    return NextResponse.json({
      campaigns: data || [],
      count: data?.length || 0
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
