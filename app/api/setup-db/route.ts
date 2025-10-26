import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test if tables exist by trying to query them
    const { error: phoneError } = await supabase
      .from('phone_numbers')
      .select('count')
      .limit(1);

    const { error: logError } = await supabase
      .from('message_logs')
      .select('count')
      .limit(1);

    if (!phoneError && !logError) {
      return NextResponse.json({
        success: true,
        message: '✅ Database is already set up! All tables exist.',
        tables: {
          phone_numbers: 'exists',
          message_logs: 'exists',
        },
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Tables need to be created. Please run the SQL script manually.',
      instructions: [
        `1. Go to: https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql/new`,
        '2. Copy the SQL from lib/supabase-schema.sql',
        '3. Paste and execute it',
      ],
      errors: {
        phone_numbers: phoneError?.message || 'OK',
        message_logs: logError?.message || 'OK',
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
