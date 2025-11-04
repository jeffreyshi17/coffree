# Search Tracking System

The FreeCoffee app now includes a comprehensive search tracking system to monitor Reddit searches and manage discovered campaigns.

## Features

- **Automated Search Logging**: Track when Reddit is searched, how many campaigns are found, and search results
- **Campaign Registry**: All campaigns (auto-discovered or manually added) are stored with metadata
- **Campaign Validity Tracking**: Automatically update campaign status when they expire or become invalid
- **Frontend Dashboard**: View search history and campaign status in the web interface

---

## Setup

### 1. Apply Database Schema

The search tracking system requires two new tables. Apply the schema to your Supabase database:

```bash
# Copy the SQL from lib/search-tracking-schema.sql
# Then go to your Supabase dashboard:
# 1. Open your project
# 2. Go to SQL Editor
# 3. Paste and run the SQL from lib/search-tracking-schema.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

### 2. Verify Tables

After applying the schema, you should have these tables:
- `search_logs` - Tracks each Reddit search execution
- `campaigns` - Registry of all discovered campaigns

---

## How It Works

### Campaign Tracking

**Auto-Discovered Campaigns (Reddit)**:
When `coffree_finder.py` runs, it:
1. Searches Reddit for coffee links
2. Records all found campaigns in the `campaigns` table with `source='auto'`
3. Logs the search activity in `search_logs`

**Manually-Added Campaigns**:
When you submit a link via the web interface:
1. The campaign is recorded in `campaigns` table with `source='manual'`
2. Campaign validity is checked before sending

### Campaign Validity

Campaigns have two status fields:
- `is_valid` - Whether the campaign is currently working
- `is_expired` - Whether the campaign has expired

**Automatic Status Updates**:
- When a campaign returns "Invalid Campaign Id" → marked as `is_valid=false`
- When a campaign returns "Campaign Expired" → marked as `is_expired=true`
- This happens during:
  - Phone number validation (when adding new phones)
  - Manual link submission

### Phone Validation

**When adding a new phone number**, the system now:
1. Fetches ALL valid campaigns (`is_valid=true`, `is_expired=false`)
2. Tests the phone with each campaign
3. Updates campaign status if any campaign is found to be expired/invalid
4. Adds the phone if at least one campaign succeeds OR no phone-specific errors occur

This ensures:
- Phone numbers are thoroughly validated
- Campaign status stays up-to-date
- Invalid campaigns are automatically marked

---

## Using the System

### Running Automated Reddit Search

```bash
# Search Reddit and log activity (don't submit)
python3 coffree_finder.py --timeframe month

# Search and auto-submit found links
python3 coffree_finder.py --timeframe month --auto-submit

# Use a different API URL
python3 coffree_finder.py --api-url https://your-domain.com --auto-submit
```

### Viewing Search Data

The web interface now includes a "Reddit Search Tracker" section showing:

**Overview Tab**:
- Last search time and status
- Campaigns found in last search
- Total campaigns, valid campaigns, expired campaigns
- Recent search history

**Campaigns Tab**:
- List of all campaigns with filters (All / Valid / Expired)
- Campaign source (Auto or Manual)
- Campaign status (Valid, Expired, Invalid)
- Reddit post links for auto-discovered campaigns
- First seen dates

---

## API Endpoints

### GET /api/search-logs
Fetch search history

**Query Parameters**:
- `limit` - Number of logs to return (default: 50)
- `status` - Filter by status: success, failed, running

**Example**:
```bash
curl "http://localhost:3001/api/search-logs?limit=10"
```

### POST /api/search-logs
Log a search activity (used by coffree_finder.py)

**Body**:
```json
{
  "search_type": "reddit",
  "status": "success",
  "campaigns_found": 5,
  "new_campaigns": 2,
  "subreddits_searched": ["AwesomeFreebies", "freebies"],
  "error_message": null
}
```

### GET /api/campaigns
Fetch campaigns

**Query Parameters**:
- `limit` - Number of campaigns to return (default: 100)
- `source` - Filter by source: auto, manual
- `is_valid` - Filter by validity: true, false
- `is_expired` - Filter by expiration: true, false

**Example**:
```bash
# Get all valid campaigns
curl "http://localhost:3001/api/campaigns?is_valid=true&is_expired=false"

# Get auto-discovered campaigns
curl "http://localhost:3001/api/campaigns?source=auto"
```

### POST /api/campaigns
Add a new campaign (used by coffree_finder.py)

**Body**:
```json
{
  "full_link": "https://coffree.capitalone.com/sms/?cid=xxx&mc=yyy",
  "source": "auto",
  "reddit_post_url": "https://reddit.com/r/freebies/...",
  "reddit_subreddit": "freebies"
}
```

### PATCH /api/campaigns
Update campaign status

**Body**:
```json
{
  "campaign_id": "iippxr7p0u",
  "is_valid": false,
  "is_expired": true
}
```

### DELETE /api/campaigns
Remove a campaign

**Query Parameters**:
- `campaign_id` - Campaign ID to delete

---

## GitHub Actions Integration

To run automated searches via GitHub Actions, create `.github/workflows/search-reddit.yml`:

```yaml
name: Search Reddit for Coffee Links

on:
  schedule:
    # Run every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  search:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: pip install requests

      - name: Search Reddit
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
        run: |
          python3 coffree_finder.py --timeframe month --auto-submit --api-url $API_BASE_URL
```

**Required Secrets**:
- `API_BASE_URL` - Your production API URL (e.g., https://your-app.vercel.app)

---

## Database Schema

### search_logs Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| search_type | VARCHAR(50) | Type of search (reddit, manual, etc.) |
| status | VARCHAR(20) | success, failed, running |
| campaigns_found | INTEGER | Number of campaigns found |
| new_campaigns | INTEGER | Number of new campaigns added |
| subreddits_searched | TEXT[] | Array of subreddits checked |
| error_message | TEXT | Error message if failed |
| started_at | TIMESTAMP | When search started |
| completed_at | TIMESTAMP | When search completed |
| duration_seconds | INTEGER | How long search took |

### campaigns Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| campaign_id | VARCHAR(50) | Unique campaign ID |
| marketing_channel | VARCHAR(10) | Marketing channel code |
| full_link | TEXT | Full coffree link |
| source | VARCHAR(20) | auto or manual |
| reddit_post_url | TEXT | Reddit post URL (if auto) |
| reddit_subreddit | VARCHAR(50) | Subreddit name (if auto) |
| first_seen_at | TIMESTAMP | When first discovered |
| first_submitted_at | TIMESTAMP | When first sent to subscribers |
| is_valid | BOOLEAN | If campaign is currently valid |
| is_expired | BOOLEAN | If campaign has expired |
| notes | TEXT | Optional notes |

---

## Troubleshooting

### "Table does not exist" Error

Make sure you've applied the database schema:
1. Open Supabase dashboard
2. Go to SQL Editor
3. Run the SQL from `lib/search-tracking-schema.sql`

### Search Logs Not Appearing

Check that:
1. `coffree_finder.py` is running successfully
2. API_BASE_URL is set correctly
3. The API endpoint `/api/search-logs` is accessible
4. Check the Python script output for errors

### Campaigns Not Being Recorded

Verify:
1. The `campaigns` table exists
2. The API endpoint `/api/campaigns` is working
3. Check browser console for errors on the frontend

---

## Future Enhancements

Possible improvements:
- Email notifications when new campaigns are found
- Webhook integration for campaign discoveries
- Campaign performance metrics (success rate, usage stats)
- Automatic campaign testing on a schedule
- Campaign sharing/export functionality
