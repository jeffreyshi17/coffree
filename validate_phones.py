#!/usr/bin/env python3
"""
Validate Phone Numbers - Check all subscribed phone numbers using numverify API
"""

import requests
import os
import time
from datetime import datetime

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3001')
NUMVERIFY_API_KEY = os.getenv('NUMVERIFY_API_KEY', '51248de2d4762f2318f510be76dbe25f')


def validate_phone_with_api(phone: str) -> dict:
    """
    Validate a phone number using the numverify API

    Returns:
        dict with keys: valid, country_code, carrier, line_type, error
    """
    try:
        url = f"http://apilayer.net/api/validate?access_key={NUMVERIFY_API_KEY}&number={phone}"
        response = requests.get(url, timeout=10)
        data = response.json()

        if 'success' in data and data['success'] is False:
            # API error
            return {
                'valid': None,
                'error': data.get('error', {}).get('info', 'Unknown API error'),
                'api_error': True
            }

        return {
            'valid': data.get('valid', False),
            'country_code': data.get('country_code', ''),
            'country_name': data.get('country_name', ''),
            'carrier': data.get('carrier', ''),
            'line_type': data.get('line_type', ''),
            'number': data.get('number', ''),
            'international_format': data.get('international_format', ''),
            'error': None,
            'api_error': False
        }

    except Exception as e:
        return {
            'valid': None,
            'error': str(e),
            'api_error': True
        }


def delete_phone(phone: str) -> bool:
    """Delete a phone number from the database"""
    try:
        response = requests.delete(
            f"{API_BASE_URL}/api/phone",
            params={'phone': phone},
            timeout=10
        )
        return response.ok
    except Exception as e:
        print(f"   ❌ Error deleting phone: {e}")
        return False


def validate_all_phones(auto_delete=False):
    """Fetch and validate all phone numbers"""
    print(f"\n🔍 Validating Phone Numbers")
    print(f"{'='*70}")
    print(f"API: {API_BASE_URL}")
    print(f"Numverify API Key: {'*' * 20}{NUMVERIFY_API_KEY[-4:] if len(NUMVERIFY_API_KEY) > 4 else '****'}")
    print(f"Auto-delete invalid: {'YES' if auto_delete else 'NO'}")
    print(f"{'='*70}\n")

    # Fetch all phones
    try:
        response = requests.get(f"{API_BASE_URL}/api/phone", timeout=10)
        if not response.ok:
            print(f"❌ Error fetching phones: {response.status_code}")
            return

        data = response.json()
        phones = data.get('phones', [])

        if not phones:
            print("📭 No phone numbers to validate.\n")
            return

        print(f"Found {len(phones)} phone numbers to validate...\n")

    except Exception as e:
        print(f"❌ Error: {e}\n")
        return

    # Validate each phone
    valid_count = 0
    invalid_count = 0
    error_count = 0
    deleted_count = 0

    for i, phone_record in enumerate(phones, 1):
        phone = phone_record.get('phone', '')
        platform = phone_record.get('platform', 'unknown')
        created = phone_record.get('created_at', '')

        print(f"[{i}/{len(phones)}] Validating {phone} ({platform})...")

        # Validate with API
        result = validate_phone_with_api(phone)

        # Rate limit protection - wait between requests
        if i < len(phones):
            time.sleep(1)  # Wait 1 second between API calls

        if result.get('api_error'):
            print(f"   ⚠️  API Error: {result.get('error')}")
            error_count += 1
            continue

        if result['valid']:
            print(f"   ✅ Valid")
            print(f"      Country: {result.get('country_name')} ({result.get('country_code')})")
            print(f"      Carrier: {result.get('carrier', 'Unknown')}")
            print(f"      Type: {result.get('line_type', 'Unknown')}")
            print(f"      Format: {result.get('international_format', phone)}")
            valid_count += 1
        else:
            print(f"   ❌ Invalid phone number")
            invalid_count += 1

            if auto_delete:
                print(f"      Deleting from database...")
                if delete_phone(phone):
                    print(f"      ✅ Deleted successfully")
                    deleted_count += 1
                else:
                    print(f"      ❌ Failed to delete")

        print()

    # Summary
    print(f"\n{'='*70}")
    print(f"Validation Summary")
    print(f"{'='*70}")
    print(f"✅ Valid: {valid_count}")
    print(f"❌ Invalid: {invalid_count}")
    print(f"⚠️  API Errors: {error_count}")

    if auto_delete:
        print(f"🗑️  Deleted: {deleted_count}")

    print(f"📊 Total: {len(phones)}")
    print()


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Validate all subscribed phone numbers using numverify API'
    )
    parser.add_argument(
        '--api-url',
        default='http://localhost:3001',
        help='Base URL for the API (default: http://localhost:3001)'
    )
    parser.add_argument(
        '--api-key',
        help='Numverify API key (or set NUMVERIFY_API_KEY env var)'
    )
    parser.add_argument(
        '--delete-invalid',
        action='store_true',
        help='Automatically delete invalid phone numbers'
    )

    args = parser.parse_args()

    # Set API URL from argument
    os.environ['API_BASE_URL'] = args.api_url

    # Set API key if provided
    if args.api_key:
        os.environ['NUMVERIFY_API_KEY'] = args.api_key

    validate_all_phones(auto_delete=args.delete_invalid)


if __name__ == '__main__':
    main()
