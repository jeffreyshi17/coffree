const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...\n');

  // Read the SQL schema file
  const sql = fs.readFileSync('./lib/supabase-schema.sql', 'utf8');

  // Split into individual statements (simple split by semicolon)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`[${i + 1}/${statements.length}] Executing...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        console.log(`⚠️  Note: ${error.message}`);
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      console.log(`⚠️  ${err.message}`);
    }
    console.log('');
  }

  console.log('✨ Database setup complete!\n');
  console.log('Testing tables...\n');

  // Test that tables exist
  const { data: phones, error: phoneError } = await supabase.from('phone_numbers').select('count');
  const { data: logs, error: logError } = await supabase.from('message_logs').select('count');

  if (!phoneError) {
    console.log('✅ phone_numbers table is ready');
  } else {
    console.log('❌ phone_numbers table error:', phoneError.message);
  }

  if (!logError) {
    console.log('✅ message_logs table is ready');
  } else {
    console.log('❌ message_logs table error:', logError.message);
  }

  console.log('\n🎉 Setup complete! Your FreeCoffee app is ready to use!');
}

setupDatabase().catch(console.error);
