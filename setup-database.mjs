import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...\n');

  // Test connection first
  console.log('Testing connection to Supabase...');
  const { data: testData, error: testError } = await supabase
    .from('phone_numbers')
    .select('count')
    .limit(1);

  if (testError) {
    console.log('⚠️  Tables may not exist yet. Will attempt to check...');
  } else {
    console.log('✅ phone_numbers table already exists!');
  }

  const { data: testLogs, error: testLogsError } = await supabase
    .from('message_logs')
    .select('count')
    .limit(1);

  if (testLogsError) {
    console.log('⚠️  message_logs table may not exist yet.');
  } else {
    console.log('✅ message_logs table already exists!');
  }

  console.log('\n📋 Instructions:');
  console.log('─'.repeat(60));
  console.log('\nTo complete setup, please run the SQL in lib/supabase-schema.sql');
  console.log('in your Supabase dashboard:\n');
  console.log(`1. Visit: ${supabaseUrl.replace('//', '//').replace('.supabase.co', '.supabase.co/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql/new')}`);
  console.log('2. Copy the contents of lib/supabase-schema.sql');
  console.log('3. Paste and run it in the SQL editor\n');
  console.log('OR use the Supabase CLI:');
  console.log('  npx supabase db push\n');
  console.log('─'.repeat(60));
}

setupDatabase().catch(console.error);
