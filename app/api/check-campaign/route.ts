import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('cid');

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: logs, error } = await supabase
      .from('message_logs')
      .select('created_at')
      .eq('campaign_id', campaignId)
      .limit(1);

    if (error) {
      console.error('Error checking campaign:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const exists = logs && logs.length > 0;

    return NextResponse.json({
      exists,
      campaignId,
      submittedAt: exists ? logs[0].created_at : null
    });

  } catch (error) {
    console.error('Error in check-campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
