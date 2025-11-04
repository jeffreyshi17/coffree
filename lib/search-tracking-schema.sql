-- Create search_logs table to track when Reddit is checked
CREATE TABLE IF NOT EXISTS search_logs (
  id BIGSERIAL PRIMARY KEY,
  search_type VARCHAR(50) NOT NULL DEFAULT 'reddit', -- 'reddit', 'manual', etc.
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  campaigns_found INTEGER DEFAULT 0,
  new_campaigns INTEGER DEFAULT 0,
  subreddits_searched TEXT[], -- Array of subreddits checked
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- Create campaigns table to track all discovered campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) UNIQUE NOT NULL,
  marketing_channel VARCHAR(10) NOT NULL,
  full_link TEXT NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('auto', 'manual')), -- auto = found by script, manual = added by user
  reddit_post_url TEXT, -- URL to Reddit post if found via Reddit
  reddit_subreddit VARCHAR(50), -- Which subreddit it was found in
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  first_submitted_at TIMESTAMP WITH TIME ZONE, -- When first sent to subscribers
  is_valid BOOLEAN DEFAULT true, -- If campaign has been tested and works
  is_expired BOOLEAN DEFAULT false, -- If campaign is expired/invalid
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_search_logs_started_at ON search_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_first_seen ON campaigns(first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_source ON campaigns(source);
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_id ON campaigns(campaign_id);

-- Enable Row Level Security
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON search_logs
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON search_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON campaigns
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON campaigns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON campaigns
  FOR UPDATE USING (true);
