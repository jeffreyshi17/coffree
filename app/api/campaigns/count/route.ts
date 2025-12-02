import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET - Get count of valid campaigns and total distributed
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get valid campaign count
    const { count, error } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('is_valid', true)
      .eq('is_expired', false);

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch campaign count'
      }, { status: 500 });
    }

    // Get total coffees distributed (successful sends)
    const { count: distributedCount, error: distributedError } = await supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success');

    if (distributedError) {
      console.error('Error fetching distributed count:', distributedError);
    }

    return NextResponse.json({
      count: count || 0,
      distributed: distributedCount || 0
    });
  } catch (error) {
    console.error('Error fetching campaign count:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
