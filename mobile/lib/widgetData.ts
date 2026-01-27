import { supabase } from './supabase';

/**
 * Widget data type matching widget requirements
 */
export interface WidgetData {
  count: number;
  distributed: number;
  timestamp: string;
}

/**
 * Fetch widget data from Supabase
 * Used by widgets to display campaign count and distributed vouchers
 */
export async function getWidgetData(): Promise<WidgetData> {
  try {
    // Get valid campaign count
    const { count, error } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('is_valid', true)
      .eq('is_expired', false);

    if (error) {
      throw new Error(`Failed to fetch campaign count: ${error.message}`);
    }

    // Get total coffees distributed (successful sends)
    const { count: distributedCount, error: distributedError } = await supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success');

    if (distributedError) {
      console.error('Error fetching distributed count:', distributedError);
    }

    return {
      count: count || 0,
      distributed: distributedCount || 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching widget data:', error);
    throw error;
  }
}

/**
 * Supabase REST API configuration
 * Used by native widgets (iOS/Android) to query Supabase directly
 */
export function getSupabaseConfig() {
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  };
}
