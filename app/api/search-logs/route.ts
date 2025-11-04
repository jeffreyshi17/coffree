import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// POST - Log a search activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      search_type = 'reddit',
      status,
      campaigns_found = 0,
      new_campaigns = 0,
      subreddits_searched = [],
      error_message = null,
    } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    if (!['success', 'failed', 'running'].includes(status)) {
      return NextResponse.json({
        error: 'Status must be one of: success, failed, running'
      }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // For completed searches, set completed_at and calculate duration
    const now = new Date().toISOString();
    const logData: any = {
      search_type,
      status,
      campaigns_found,
      new_campaigns,
      subreddits_searched,
      error_message,
      started_at: now,
    };

    // If the status is success or failed (not running), it's completed
    if (status === 'success' || status === 'failed') {
      logData.completed_at = now;
      logData.duration_seconds = 0; // Will be updated if we track start time
    }

    const { data, error } = await supabase
      .from('search_logs')
      .insert(logData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting search log:', error);
      return NextResponse.json({
        error: 'Failed to log search activity',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      log: data,
      message: 'Search activity logged successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/search-logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch search logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('search_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch search logs'
      }, { status: 500 });
    }

    return NextResponse.json({
      logs: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
