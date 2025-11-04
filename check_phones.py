#!/usr/bin/env python3
"""
Check Phone Numbers - View all subscribed phone numbers
"""

import requests
import os
from datetime import datetime

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3001')


def anonymize_phone(phone: str) -> str:
    """Anonymize phone number showing only last 4 digits"""
    cleaned = ''.join(filter(str.isdigit, phone))
    if len(cleaned) >= 4:
        last4 = cleaned[-4:]
        return f"(***) ***-{last4}"
    return "****"


def check_phones(anonymize=False):
    """Fetch and display all subscribed phone numbers"""
    try:
        print(f"\n📱 Fetching phone numbers from {API_BASE_URL}...\n")

        response = requests.get(f"{API_BASE_URL}/api/phone", timeout=10)

        if not response.ok:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return

        data = response.json()
        phones = data.get('phones', [])

        if not phones:
            print("📭 No phone numbers subscribed yet.\n")
            return

        # Count by platform
        android_count = sum(1 for p in phones if p['platform'] == 'android')
        apple_count = sum(1 for p in phones if p['platform'] == 'apple')

        print(f"{'='*70}")
        print(f"📊 Phone Subscriber Summary")
        print(f"{'='*70}")
        print(f"Total Subscribers: {len(phones)}")
        print(f"  🤖 Android: {android_count}")
        print(f"  🍎 Apple: {apple_count}")
        print(f"{'='*70}\n")

        # Display each phone
        print(f"{'#':<4} {'Phone':<18} {'Platform':<10} {'Subscribed':<20}")
        print(f"{'-'*70}")

        for i, phone in enumerate(phones, 1):
            phone_num = phone.get('phone', '')
            platform = phone.get('platform', 'unknown')
            created = phone.get('created_at', '')

            # Format date
            try:
                date_obj = datetime.fromisoformat(created.replace('Z', '+00:00'))
                date_str = date_obj.strftime('%Y-%m-%d %H:%M')
            except:
                date_str = created[:16] if created else 'Unknown'

            # Platform emoji
            platform_emoji = "🤖" if platform == "android" else "🍎"

            # Show full number or anonymized
            display_phone = anonymize_phone(phone_num) if anonymize else phone_num

            print(f"{i:<4} {display_phone:<18} {platform_emoji} {platform:<8} {date_str:<20}")

        print(f"{'-'*70}\n")

    except requests.exceptions.ConnectionError:
        print(f"❌ Error: Could not connect to {API_BASE_URL}")
        print("   Make sure the development server is running.\n")
    except Exception as e:
        print(f"❌ Error: {e}\n")


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Check all subscribed phone numbers'
    )
    parser.add_argument(
        '--api-url',
        default='http://localhost:3001',
        help='Base URL for the API (default: http://localhost:3001)'
    )
    parser.add_argument(
        '--anonymize',
        action='store_true',
        help='Show only last 4 digits of phone numbers'
    )

    args = parser.parse_args()

    # Set API URL from argument
    os.environ['API_BASE_URL'] = args.api_url

    check_phones(anonymize=args.anonymize)


if __name__ == '__main__':
    main()
