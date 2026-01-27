import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type PhoneNumber = {
  id: number;
  phone: string;
  platform: 'android' | 'apple';
  created_at: string;
};

export type MessageLog = {
  id: number;
  campaign_id: string;
  marketing_channel: string;
  link: string;
  phone_number: string;
  status: 'success' | 'failed' | 'expired' | 'invalid';
  error_message?: string;
  created_at: string;
};
