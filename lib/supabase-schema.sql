-- Create phone_numbers table
CREATE TABLE IF NOT EXISTS phone_numbers (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('android', 'apple')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create message_logs table
CREATE TABLE IF NOT EXISTS message_logs (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL,
  marketing_channel VARCHAR(10) NOT NULL,
  link TEXT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'expired', 'invalid')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_phone ON message_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_message_logs_campaign ON message_logs(campaign_id);

-- Enable Row Level Security (RLS)
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - you can restrict this later)
CREATE POLICY "Enable read access for all users" ON phone_numbers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON phone_numbers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON phone_numbers
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON message_logs
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON message_logs
  FOR INSERT WITH CHECK (true);
