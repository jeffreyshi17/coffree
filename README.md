# FreeCoffee - Capital One Coffee Redemption Automation

A beautiful Next.js application that automates the distribution of Capital One free coffee offers to multiple phone numbers. Built with modern web technologies and deployed on Vercel Edge Functions.

## Features

- **Automated Coffee Distribution**: Send Capital One coffee links to all subscribers with one click
- **Link Validation**: Automatically validates campaign links before sending to detect expired or invalid campaigns
- **Phone Number Management**: Easy-to-use interface to add/remove subscriber phone numbers
- **Platform Support**: Supports both Android and Apple platforms
- **Message Logging**: Complete audit trail of all sent messages with success/failure status
- **Beautiful UI**: Modern, responsive design with dark mode support
- **Edge Functions**: Lightning-fast serverless functions running on Vercel Edge

## Tech Stack

- **Frontend**: Next.js 15 with React 18 and TypeScript
- **Styling**: Tailwind CSS with custom gradients and animations
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel with Edge Functions
- **API**: Capital One Digital Offers API

## Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account and project
- A Vercel account (for deployment)

## Setup Instructions

### 1. Clone and Install

```bash
cd freecoffee-app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL script from `lib/supabase-schema.sql` to create the required tables:
   - `phone_numbers` - Stores subscriber phone numbers
   - `message_logs` - Stores message delivery logs

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   You can find these in your Supabase project settings under "API".

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Adding Subscribers

1. Navigate to the "Phone Subscribers" section
2. Enter a 10-digit US phone number
3. Select the platform (Android or Apple)
4. Click "Add" to subscribe the number

### Sending Coffee Links

1. Get a Capital One coffee link (format: `https://coffree.capitalone.com/sms/?cid=xxx&mc=yyy`)
2. Paste it into the "Send Coffee Link" form
3. Click "Send to All Subscribers"
4. The system will:
   - Validate the campaign link
   - Send SMS to all subscribers
   - Log all results
   - Display success/failure status

### Viewing Logs

The "Message Logs" section shows:
- All sent messages
- Phone numbers that received each message
- Campaign IDs and marketing channels
- Success/failure status
- Error messages for failed deliveries
- Timestamps

## Link Validation

The app automatically validates coffee links and will reject:

- **Invalid Links**: Links that don't match the expected format
- **Invalid Campaigns**: Campaign IDs that don't exist (returns error 107)
- **Expired Campaigns**: Campaigns that are no longer active

Example valid links:
```
https://coffree.capitalone.com/sms/?cid=otvs5w86sd&mc=EM
https://coffree.capitalone.com/sms/?cid=gfvw15i1n3&mc=EV
```

## Database Schema

### phone_numbers
```sql
- id: BIGSERIAL (Primary Key)
- phone: VARCHAR(20) UNIQUE
- platform: VARCHAR(10) ('android' | 'apple')
- created_at: TIMESTAMP
```

### message_logs
```sql
- id: BIGSERIAL (Primary Key)
- campaign_id: VARCHAR(50)
- marketing_channel: VARCHAR(10)
- link: TEXT
- phone_number: VARCHAR(20)
- status: VARCHAR(20) ('success' | 'failed' | 'expired' | 'invalid')
- error_message: TEXT
- created_at: TIMESTAMP
```

## API Endpoints

### POST /api/send-coffee
Validates a coffee link and sends it to all subscribers.

**Request:**
```json
{
  "link": "https://coffree.capitalone.com/sms/?cid=xxx&mc=yyy"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sent to 5 phone(s), 0 failed",
  "results": [...],
  "campaignId": "xxx",
  "marketingChannel": "yyy"
}
```

### GET /api/phone
Retrieve all subscriber phone numbers.

### POST /api/phone
Add a new subscriber.

**Request:**
```json
{
  "phone": "5551234567",
  "platform": "android"
}
```

### DELETE /api/phone?phone=5551234567
Remove a subscriber.

### GET /api/logs
Retrieve message logs (default limit: 50).

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

The Edge Functions will automatically be deployed and configured.

## Security Notes

- Row Level Security (RLS) is enabled on Supabase tables
- Consider adding authentication for production use
- The Supabase anon key is public but protected by RLS policies
- Phone numbers are stored in plain text - consider encryption for production

## Troubleshooting

**Issue**: "Failed to fetch phone numbers"
- Check your Supabase credentials in `.env.local`
- Verify the database tables are created correctly
- Check RLS policies are set up

**Issue**: "Invalid link format"
- Ensure the link follows the format: `https://coffree.capitalone.com/sms/?cid=xxx&mc=yyy`
- The link must include both `cid` and `mc` parameters

**Issue**: "Invalid Campaign Id"
- The campaign link may be invalid or malformed
- Try a different coffee link

**Issue**: "Campaign Expired"
- The campaign is no longer active
- Get a fresh coffee link from Capital One

## Contributing

This is a personal project, but feel free to fork and modify for your own use!

## License

MIT License - Use freely!

## Disclaimer

This tool is for personal use only. Make sure you have permission from phone number owners before adding them as subscribers. Respect Capital One's terms of service.
