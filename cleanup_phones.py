#!/usr/bin/env python3
"""
Cleanup Phone Numbers - Validate and remove phones that haven't successfully received codes
"""

import requests
import os
import time
from datetime import datetime

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3001')


def get_all_phones():
    """Get all phone numbers from the database"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/phone", timeout=10)
        if response.ok:
            return response.json().get('phones', [])
        return []
    except Exception as e:
        print(f"❌ Error fetching phones: {e}")
        return []


def get_message_logs():
    """Get all message logs"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/logs", timeout=10)
        if response.ok:
            return response.json().get('logs', [])
        return []
    except Exception as e:
        print(f"❌ Error fetching logs: {e}")
        return []


def test_phone_with_capital_one(phone, platform, campaign_id, marketing_channel):
    """Test a phone number with Capital One API"""
    try:
        response = requests.post(
            'https://api.capitalone.com/protected/24565/retail/digital-offers/text-pass',
            headers={
                'accept': 'application/json; v=1',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json',
            },
            json={
                'campaignId': campaign_id,
                'marketingChannel': marketing_channel,
                'platform': platform,
                'phoneNumber': phone,
            },
            timeout=10
        )

        data = response.json()

        if response.ok:
            return {'success': True, 'error': None}

        error_text = data.get('developerText', '') + data.get('userText', '')
        return {'success': False, 'error': error_text}

    except Exception as e:
        return {'success': False, 'error': str(e)}


def delete_phone(phone):
    """Delete a phone number"""
    try:
        response = requests.delete(
            f"{API_BASE_URL}/api/phone",
            params={'phone': phone},
            timeout=10
        )
        return response.ok
    except Exception as e:
        print(f"   ❌ Error deleting: {e}")
        return False


def cleanup_phones():
    """Main cleanup logic"""
    print(f"\n🧹 Phone Number Cleanup")
    print(f"{'='*70}")
    print(f"API: {API_BASE_URL}\n")

    # Get all phones and logs
    print("📱 Fetching phone numbers...")
    phones = get_all_phones()

    print("📋 Fetching message logs...")
    logs = get_message_logs()

    if not phones:
        print("❌ No phones found\n")
        return

    # Find phones that have never successfully received a message
    successful_phones = set()
    for log in logs:
        if log['status'] == 'success':
            successful_phones.add(log['phone_number'])

    phones_to_check = [p for p in phones if p['phone'] not in successful_phones]

    print(f"\n📊 Status:")
    print(f"   Total phones: {len(phones)}")
    print(f"   Phones with successful messages: {len(successful_phones)}")
    print(f"   Phones to validate: {len(phones_to_check)}\n")

    if not phones_to_check:
        print("✅ All phones have successfully received messages!\n")
        return

    # Find the most recent successful campaign to test with
    successful_logs = [l for l in logs if l['status'] == 'success']
    if not successful_logs:
        print("❌ No successful campaigns found - can't validate phones\n")
        return

    recent_campaign = successful_logs[0]
    campaign_id = recent_campaign['campaign_id']
    marketing_channel = recent_campaign['marketing_channel']

    print(f"🧪 Testing with campaign: {campaign_id}\n")
    print(f"{'='*70}\n")

    # Test each phone
    validated = 0
    invalid = 0
    deleted = 0
    errors = 0

    for i, phone_record in enumerate(phones_to_check, 1):
        phone = phone_record['phone']
        platform = phone_record['platform']

        print(f"[{i}/{len(phones_to_check)}] Testing {phone} ({platform})...")

        # Test with Capital One
        result = test_phone_with_capital_one(phone, platform, campaign_id, marketing_channel)

        # Rate limit - wait between requests
        if i < len(phones_to_check):
            time.sleep(1.5)

        if result['success']:
            print(f"   ✅ Valid - phone accepted by Capital One")
            validated += 1
        else:
            error_lower = (result['error'] or '').lower()

            # Check if it's a phone issue
            if 'phone' in error_lower and 'invalid' in error_lower:
                print(f"   ❌ Invalid phone number: {result['error']}")
                print(f"   🗑️  Deleting from database...")

                if delete_phone(phone):
                    print(f"   ✅ Deleted successfully")
                    deleted += 1
                else:
                    print(f"   ❌ Failed to delete")

                invalid += 1
            elif 'campaign' in error_lower or 'expired' in error_lower:
                print(f"   ⚠️  Campaign issue (can't validate): {result['error']}")
                print(f"   ℹ️  Keeping phone number")
                errors += 1
            else:
                print(f"   ⚠️  Unknown error: {result['error']}")
                print(f"   ℹ️  Keeping phone number (benefit of doubt)")
                errors += 1

        print()

    # Summary
    print(f"{'='*70}")
    print(f"Cleanup Summary")
    print(f"{'='*70}")
    print(f"✅ Validated (kept): {validated}")
    print(f"❌ Invalid (removed): {invalid}")
    print(f"⚠️  Errors/Unable to validate: {errors}")
    print(f"🗑️  Deleted: {deleted}")
    print(f"📊 Total checked: {len(phones_to_check)}")
    print()


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Validate and cleanup phone numbers that haven\'t received codes'
    )
    parser.add_argument(
        '--api-url',
        default='http://localhost:3001',
        help='Base URL for the API (default: http://localhost:3001)'
    )

    args = parser.parse_args()

    # Set API URL from argument
    os.environ['API_BASE_URL'] = args.api_url

    cleanup_phones()


if __name__ == '__main__':
    main()
