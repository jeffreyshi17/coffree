#!/usr/bin/env python3
"""
Backfill Campaigns - Create campaign records from existing message logs
"""

import requests
import os
from typing import Set, Dict
from datetime import datetime

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3001')


def get_all_message_logs():
    """Fetch all message logs from the API"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/logs", timeout=10)
        if response.ok:
            data = response.json()
            return data.get('logs', [])
        return []
    except Exception as e:
        print(f"❌ Error fetching message logs: {e}")
        return []


def extract_unique_campaigns(logs):
    """Extract unique campaign_id + marketing_channel combinations"""
    campaigns = {}

    for log in logs:
        campaign_id = log.get('campaign_id')
        marketing_channel = log.get('marketing_channel')
        link = log.get('link')
        created_at = log.get('created_at')

        if not campaign_id or not marketing_channel:
            continue

        # Use campaign_id as key
        if campaign_id not in campaigns:
            campaigns[campaign_id] = {
                'campaign_id': campaign_id,
                'marketing_channel': marketing_channel,
                'link': link,
                'first_seen': created_at,
            }
        else:
            # Keep the earliest created_at
            if created_at < campaigns[campaign_id]['first_seen']:
                campaigns[campaign_id]['first_seen'] = created_at

    return list(campaigns.values())


def create_campaign(campaign_data):
    """Create a campaign record via the API"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/campaigns",
            json={
                'full_link': campaign_data['link'],
                'source': 'manual',
            },
            timeout=10
        )

        if response.ok:
            return {'success': True}

        data = response.json()
        error = data.get('error', 'Unknown error')

        # If campaign already exists, that's fine
        if 'already exists' in error.lower():
            return {'success': True, 'already_exists': True}

        return {'success': False, 'error': error}

    except Exception as e:
        return {'success': False, 'error': str(e)}


def backfill_campaigns():
    """Main backfill logic"""
    print(f"\n🔄 Campaign Backfill")
    print(f"{'='*70}")
    print(f"API: {API_BASE_URL}\n")

    # Fetch all message logs
    print("📋 Fetching message logs...")
    logs = get_all_message_logs()

    if not logs:
        print("❌ No message logs found\n")
        return

    print(f"   Found {len(logs)} message logs\n")

    # Extract unique campaigns
    print("🔍 Extracting unique campaigns...")
    campaigns = extract_unique_campaigns(logs)
    print(f"   Found {len(campaigns)} unique campaigns\n")

    if not campaigns:
        print("❌ No campaigns to backfill\n")
        return

    # Display campaigns
    print(f"\n{'='*70}")
    print("Campaigns to Backfill:")
    print(f"{'='*70}\n")

    for i, campaign in enumerate(campaigns, 1):
        print(f"Campaign {i}/{len(campaigns)}:")
        print(f"   ID: {campaign['campaign_id']}")
        print(f"   Channel: {campaign['marketing_channel']}")
        print(f"   Link: {campaign['link']}")
        print(f"   First seen: {campaign['first_seen']}")
        print()

    # Create campaign records
    print(f"\n{'='*70}")
    print("Creating Campaign Records:")
    print(f"{'='*70}\n")

    created_count = 0
    exists_count = 0
    failed_count = 0

    for i, campaign in enumerate(campaigns, 1):
        print(f"[{i}/{len(campaigns)}] Creating campaign {campaign['campaign_id']}...")

        result = create_campaign(campaign)

        if result['success']:
            if result.get('already_exists'):
                print(f"   ℹ️  Already exists")
                exists_count += 1
            else:
                print(f"   ✅ Created successfully")
                created_count += 1
        else:
            print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")
            failed_count += 1

        print()

    # Summary
    print(f"\n{'='*70}")
    print("Backfill Summary:")
    print(f"{'='*70}")
    print(f"✅ Created: {created_count}")
    print(f"ℹ️  Already existed: {exists_count}")
    print(f"❌ Failed: {failed_count}")
    print(f"📊 Total campaigns: {len(campaigns)}")
    print()


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Backfill campaigns table from existing message logs'
    )
    parser.add_argument(
        '--api-url',
        default='http://localhost:3001',
        help='Base URL for the API (default: http://localhost:3001)'
    )

    args = parser.parse_args()

    # Set API URL from argument
    os.environ['API_BASE_URL'] = args.api_url

    backfill_campaigns()


if __name__ == '__main__':
    main()
