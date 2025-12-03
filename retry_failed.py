#!/usr/bin/env python3
"""
Retry Failed Campaigns - Find campaigns that failed to send and retry them
"""

import requests
import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()
load_dotenv('.env.local')

# Supabase connection
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

# Capital One API
CAPITAL_ONE_API = 'https://api.capitalone.com/protected/24565/retail/digital-offers/text-pass'


def sanitize_marketing_channel(mc: str) -> str:
    """Remove non-letter characters from marketing channel"""
    import re
    return re.sub(r'[^a-zA-Z]', '', mc) if mc else ''


def send_coffee_to_phone(phone: str, platform: str, campaign_id: str, marketing_channel: str, max_retries: int = 3) -> dict:
    """Send a campaign to a phone number with retry logic"""
    api_platform = 'iOS' if platform == 'apple' else 'android'

    # Sanitize marketing channel
    marketing_channel = sanitize_marketing_channel(marketing_channel)

    for attempt in range(1, max_retries + 1):
        try:
            response = requests.post(
                CAPITAL_ONE_API,
                headers={
                    'accept': 'application/json; v=1',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
                json={
                    'campaignId': campaign_id,
                    'marketingChannel': marketing_channel,
                    'platform': api_platform,
                    'phoneNumber': phone,
                },
                timeout=30
            )

            data = response.json()

            if response.status_code == 200 or response.ok:
                return {'success': True}

            return {'success': False, 'error': data.get('developerText', 'Failed to send')}

        except requests.exceptions.RequestException as e:
            if attempt < max_retries:
                print(f"      Network error, retrying in 2s... (attempt {attempt}/{max_retries})")
                time.sleep(2)
                continue
            return {'success': False, 'error': 'Network error'}

    return {'success': False, 'error': 'Network error'}


def main():
    print("\n" + "="*70)
    print("🔄 Retry Failed Campaigns")
    print("="*70 + "\n")

    # Connect to Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Get all valid campaigns
    print("📋 Fetching valid campaigns...")
    campaigns_result = supabase.table('campaigns').select('*').eq('is_valid', True).eq('is_expired', False).execute()
    campaigns = campaigns_result.data
    print(f"   Found {len(campaigns)} valid campaigns\n")

    if not campaigns:
        print("❌ No valid campaigns found.")
        return

    # Get all phone numbers
    print("📱 Fetching phone numbers...")
    phones_result = supabase.table('phone_numbers').select('*').execute()
    phones = phones_result.data
    print(f"   Found {len(phones)} phone numbers\n")

    if not phones:
        print("❌ No phone numbers found.")
        return

    # Get all successful message logs to know what's already been sent
    print("📊 Fetching message logs...")
    logs_result = supabase.table('message_logs').select('campaign_id, phone_number, status, error_message').execute()
    all_logs = logs_result.data

    # Build sets for quick lookup
    successful_sends = set()
    failed_sends = {}  # (campaign_id, phone) -> error_message

    for log in all_logs:
        key = (log['campaign_id'], log['phone_number'])
        if log['status'] == 'success':
            successful_sends.add(key)
        elif log['status'] == 'failed':
            failed_sends[key] = log.get('error_message', 'Unknown error')

    print(f"   Successful sends: {len(successful_sends)}")
    print(f"   Failed sends: {len(failed_sends)}\n")

    # Find campaigns that need to be retried
    # These are: valid campaigns that either failed or were never sent to phones
    to_retry = []

    for campaign in campaigns:
        cid = campaign['campaign_id']
        mc = campaign['marketing_channel']
        link = campaign['full_link']

        for phone in phones:
            phone_num = phone['phone']
            platform = phone['platform']
            key = (cid, phone_num)

            # Skip if already successfully sent
            if key in successful_sends:
                continue

            # Check if it was a network error (should be retried)
            error = failed_sends.get(key, None)
            if error and 'network' in error.lower():
                to_retry.append({
                    'campaign_id': cid,
                    'marketing_channel': mc,
                    'full_link': link,
                    'phone': phone_num,
                    'platform': platform,
                    'reason': f'Previously failed: {error}'
                })
            elif key not in failed_sends:
                # Never attempted - should be sent
                to_retry.append({
                    'campaign_id': cid,
                    'marketing_channel': mc,
                    'full_link': link,
                    'phone': phone_num,
                    'platform': platform,
                    'reason': 'Never sent'
                })

    if not to_retry:
        print("✅ All campaigns have been successfully sent to all phones!")
        return

    print(f"🔄 Found {len(to_retry)} campaign/phone combinations to retry:\n")

    # Group by reason for display
    network_errors = [r for r in to_retry if 'network' in r['reason'].lower()]
    never_sent = [r for r in to_retry if r['reason'] == 'Never sent']

    if network_errors:
        print(f"   - {len(network_errors)} with previous network errors")
    if never_sent:
        print(f"   - {len(never_sent)} never sent")

    print()

    # Auto-proceed (for non-interactive mode)
    import sys
    if '--yes' in sys.argv or '-y' in sys.argv:
        pass  # Auto-proceed
    else:
        try:
            response = input("Do you want to retry these now? (y/n): ").strip().lower()
            if response != 'y':
                print("\n❌ Cancelled.")
                return
        except EOFError:
            # Non-interactive mode, proceed anyway
            pass

    print("\n" + "="*70)
    print("Starting retry process...")
    print("="*70 + "\n")

    success_count = 0
    fail_count = 0

    for i, item in enumerate(to_retry, 1):
        cid = item['campaign_id']
        mc = item['marketing_channel']
        phone = item['phone']
        platform = item['platform']
        reason = item['reason']

        # Mask phone for display
        masked_phone = f"***{phone[-4:]}" if len(phone) >= 4 else "****"

        print(f"[{i}/{len(to_retry)}] Campaign {cid} -> {masked_phone}")
        print(f"   Reason: {reason}")

        result = send_coffee_to_phone(phone, platform, cid, mc)

        if result['success']:
            print(f"   ✅ Success!")
            success_count += 1

            # Log the success
            supabase.table('message_logs').insert({
                'campaign_id': cid,
                'marketing_channel': sanitize_marketing_channel(mc),
                'link': item['full_link'],
                'phone_number': phone,
                'status': 'success',
                'error_message': None,
            }).execute()
        else:
            error = result.get('error', 'Unknown error')
            print(f"   ❌ Failed: {error}")
            fail_count += 1

            # Log the failure
            supabase.table('message_logs').insert({
                'campaign_id': cid,
                'marketing_channel': sanitize_marketing_channel(mc),
                'link': item['full_link'],
                'phone_number': phone,
                'status': 'failed',
                'error_message': error,
            }).execute()

        print()

        # Small delay between requests to be nice to the API
        time.sleep(0.5)

    print("="*70)
    print("Summary:")
    print("="*70)
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed: {fail_count}")
    print()


if __name__ == '__main__':
    main()
