# Coffree Finder - Deployment & Scheduling Guide

## Overview

The `coffree_finder.py` script automatically searches Reddit for Capital One coffee links and submits them to your API. This guide covers how to deploy and schedule it for automatic execution.

**Monitored Subreddits** (based on past year's activity):
- r/AwesomeFreebies (most active - 14 posts in past year)
- r/freebies (active - 2 posts in past year)

The script has been optimized to only search subreddits with proven coffee link activity.

## Quick Start

### Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Search for links (without submitting)
python3 coffree_finder.py --timeframe week

# Search and auto-submit new links
python3 coffree_finder.py --timeframe day --auto-submit

# Use a custom API URL
python3 coffree_finder.py --auto-submit --api-url https://your-domain.com
```

### Command Line Options

- `--timeframe {hour,day,week,month,year,all}` - Time period to search (default: month)
- `--auto-submit` - Automatically submit found links to the API
- `--api-url URL` - Base URL for your API (default: http://localhost:3001)

## Free Hosting Options

### 1. GitHub Actions (Recommended - Free)

**Perfect for scheduled tasks, completely free for public repos**

Create `.github/workflows/coffree-finder.yml`:

```yaml
name: Coffree Finder

on:
  schedule:
    # Run every 6 hours
    - cron: '0 */6 * * *'
  # Allow manual trigger
  workflow_dispatch:

jobs:
  find-and-submit:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt

    - name: Run Coffree Finder
      env:
        API_BASE_URL: ${{ secrets.API_BASE_URL }}
      run: |
        python3 coffree_finder.py --timeframe day --auto-submit --api-url "$API_BASE_URL"
```

**Setup:**
1. Push your code to GitHub
2. Add your API URL as a secret (`Settings` → `Secrets and variables` → `Actions` → `New repository secret`)
   - Name: `API_BASE_URL`
   - Value: `https://your-domain.com`
3. The workflow will run every 6 hours automatically

**Pros:**
- Completely free
- Reliable
- Easy to monitor
- Can trigger manually
- No server management

**Cons:**
- Public repos required for unlimited minutes
- Limited to scheduled tasks (minimum 5 min intervals)

---

### 2. PythonAnywhere (Free Tier)

**Free tier includes scheduled tasks**

1. Sign up at [pythonanywhere.com](https://www.pythonanywhere.com)
2. Upload `coffree_finder.py` and `requirements.txt`
3. Install dependencies in bash console:
   ```bash
   pip3 install --user -r requirements.txt
   ```
4. Create a scheduled task:
   - Go to `Tasks` tab
   - Add: `python3 /home/yourusername/coffree_finder.py --auto-submit --api-url https://your-domain.com`
   - Schedule: Daily at specific time

**Pros:**
- Easy setup
- Persistent environment
- Good for beginners

**Cons:**
- Free tier limited to 1 scheduled task
- Can only run once per day on free tier

---

### 3. Railway.app (Free Trial)

**Good for cron jobs**

1. Sign up at [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add cron schedule in `railway.toml`:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "python3 coffree_finder.py --auto-submit --api-url $API_BASE_URL"

[[schedules]]
name = "coffree-finder"
cron = "0 */6 * * *"
```

4. Set `API_BASE_URL` environment variable in dashboard

**Pros:**
- Modern platform
- Easy deployment
- Good documentation

**Cons:**
- Free trial has limits
- May require credit card

---

### 4. Replit (Free with Hacker Plan)

**Online IDE with always-on option**

1. Create account at [replit.com](https://replit.com)
2. Create new Python repl
3. Upload files
4. Add to `.replit`:

```ini
run = "python3 coffree_finder.py --auto-submit"

[env]
API_BASE_URL = "https://your-domain.com"
```

5. Use UptimeRobot to ping your repl every 5 minutes to keep it alive

**Pros:**
- Easy to use
- Built-in IDE
- Can test instantly

**Cons:**
- Free tier has CPU/RAM limits
- May sleep without pinging

---

### 5. Google Cloud Functions (Free Tier)

**Serverless option**

Create `main.py`:

```python
import functions_framework
from coffree_finder import CoffreeFinder
import os

@functions_framework.http
def coffree_finder_http(request):
    api_url = os.environ.get('API_BASE_URL', 'http://localhost:3001')
    os.environ['API_BASE_URL'] = api_url

    finder = CoffreeFinder()
    finder.run(timeframe='day', auto_submit=True)

    return 'Success', 200
```

Deploy with Cloud Scheduler to trigger hourly.

**Pros:**
- Generous free tier (2M invocations/month)
- Scales automatically
- Professional solution

**Cons:**
- More complex setup
- Requires GCP account

---

### 6. Heroku Scheduler (Free Dyno Hours)

**Note: Heroku removed free tier but still useful to mention**

1. Create `Procfile`:
```
worker: python3 coffree_finder.py --auto-submit
```

2. Add Heroku Scheduler addon
3. Set schedule: `python3 coffree_finder.py --auto-submit --api-url $API_BASE_URL`

---

### 7. Your Own Computer (cron/Task Scheduler)

**Completely free if you have a computer that's always on**

#### Linux/Mac (cron):

```bash
# Edit crontab
crontab -e

# Add line (runs every 6 hours):
0 */6 * * * cd /path/to/freecoffee-app && /usr/bin/python3 coffree_finder.py --auto-submit --api-url https://your-domain.com >> /tmp/coffree.log 2>&1
```

#### Windows (Task Scheduler):

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at 9am)
4. Action: Start a program
   - Program: `python`
   - Arguments: `coffree_finder.py --auto-submit --api-url https://your-domain.com`
   - Start in: `C:\path\to\freecoffee-app`

**Pros:**
- Completely free
- Full control
- No external dependencies

**Cons:**
- Computer must be always on
- No automatic failover
- Manual maintenance

---

## Recommended Schedule

Based on Reddit post frequency:

- **Aggressive**: Every 2-4 hours
- **Balanced**: Every 6 hours (4x daily)
- **Conservative**: Once or twice daily

Most coffee offers are posted during US business hours (9am-5pm ET), so you could also schedule runs at:
- 9am, 12pm, 3pm, 6pm ET

## Environment Variables

The script uses these environment variables:

- `API_BASE_URL` - Your API endpoint (default: http://localhost:3001)

You can also pass via command line with `--api-url`

## Monitoring

To monitor the script's execution:

1. **Check logs** - The script outputs detailed information about found links
2. **View your app's logs page** - All submissions are logged
3. **Set up alerts** - Use services like Better Uptime to monitor your API

## Troubleshooting

### Reddit Rate Limiting

If you get 429 errors:
- Reduce frequency (run less often)
- The script already includes 2-second delays between subreddits

### No Links Found

This is normal! Coffee links aren't posted constantly:
- Try expanding the timeframe: `--timeframe week` or `--timeframe month`
- Check multiple subreddits are working
- Coffee promotions are seasonal

### API Connection Issues

- Verify your API is accessible from the hosting platform
- Check firewall/security group settings
- Ensure API_BASE_URL is set correctly

## Best Practices

1. **Start with manual runs** - Test without `--auto-submit` first
2. **Use day timeframe for scheduled runs** - Avoids reprocessing old posts
3. **Monitor initially** - Check logs for the first few days
4. **Set up notifications** - Get alerted when new links are found
5. **Respect Reddit** - Don't run more than once per hour

## Security Notes

- Keep your API URL private (use environment variables/secrets)
- The script only reads public Reddit data (no authentication needed)
- Consider adding API authentication if deploying publicly

---

## Quick Deploy with GitHub Actions (Easiest)

1. Create GitHub repo with your code
2. Add `.github/workflows/coffree-finder.yml` (see GitHub Actions section above)
3. Add `API_BASE_URL` as repository secret
4. Push to GitHub
5. Done! It will run automatically every 6 hours

This is the recommended approach for most users - it's free, reliable, and requires no server management.
