# Phone Number Validation Setup

## Overview

The system now includes phone number validation using the numverify API with rate limiting to prevent abuse.

## Features Implemented

✅ **Phone Number Validation** - Validates numbers using numverify API
✅ **Rate Limiting** - 10 requests per hour per IP address
✅ **Fallback Validation** - Basic 10-digit validation if API unavailable
✅ **Validation Script** - Check and cleanup existing phone numbers
✅ **Auto-deletion** - Optionally remove invalid numbers

---

## Getting a Numverify API Key

The API key you provided (`51248de2d4762f2318f510be76dbe25f`) doesn't appear to be working. Here's how to get a valid one:

### Option 1: Free Numverify Account (Recommended)

1. Go to https://numverify.com/
2. Click "Get Free API Key" or "Sign Up"
3. Create a free account
4. Copy your API key from the dashboard
5. Free tier includes: 100 requests/month

### Option 2: Use apilayer.com

1. Go to https://apilayer.com/
2. Sign up for a free account
3. Subscribe to the "Phone Number Validation" API
4. Copy your API key
5. Free tier: 100 requests/month

---

## Setup Instructions

### 1. Add API Key to Environment

Edit your `.env.local` file:

```bash
# Add this line with your actual API key
NUMVERIFY_API_KEY=your_actual_api_key_here
```

### 2. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

## Testing Phone Validation

### Test with the Validation Script

```bash
# Just check phones (no deletion)
python3 validate_phones.py

# Use a specific API key
python3 validate_phones.py --api-key YOUR_API_KEY

# Auto-delete invalid numbers
python3 validate_phones.py --delete-invalid

# Use custom API URL
python3 validate_phones.py --api-url https://your-domain.com
```

### Example Output (with valid API key):

```
🔍 Validating Phone Numbers
======================================================================
Found 11 phone numbers to validate...

[1/11] Validating 6469650337 (apple)...
   ✅ Valid
      Country: United States (US)
      Carrier: Verizon Wireless
      Type: mobile
      Format: +1 646-965-0337

[2/11] Validating 1111111111 (android)...
   ❌ Invalid phone number
```

---

## How Validation Works

### On Phone Number Add (POST /api/phone):

1. **Rate Limit Check**
   - Max 10 requests per hour per IP
   - Returns 429 if exceeded

2. **API Validation**
   - If valid numverify key: Uses numverify API
   - If no key or API error: Falls back to basic 10-digit check

3. **Response Includes**:
   ```json
   {
     "success": true,
     "phone": {...},
     "validation": {
       "country_code": "US",
       "carrier": "Verizon",
       "line_type": "mobile"
     }
   }
   ```

### Fallback Validation

If the API is unavailable or no key is configured:
- Validates phone has exactly 10 digits
- Assumes US phone number
- Still works, but less robust

---

## Rate Limiting

**Limits:**
- 10 requests per hour per IP address
- Applies to POST /api/phone (adding phones)
- Does not apply to GET or DELETE

**Headers Returned:**
- `X-RateLimit-Remaining`: Number of requests left
- `X-RateLimit-Reset`: When the limit resets (timestamp)

**Rate Limit Exceeded Response:**
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

---

## Checking Existing Phone Numbers

### Validate All Current Subscribers

```bash
# Check all phones without deleting
python3 validate_phones.py

# Check and automatically delete invalid ones
python3 validate_phones.py --delete-invalid
```

### Manual Check with API

You can also test individual numbers:

```bash
# Test if API key works
curl "http://apilayer.net/api/validate?access_key=YOUR_API_KEY&number=14158586273"
```

Expected response (with valid key):
```json
{
  "valid": true,
  "number": "14158586273",
  "country_code": "US",
  "country_name": "United States",
  "carrier": "AT&T",
  "line_type": "mobile"
}
```

---

## Current Phone Numbers

To view all current subscribers:

```bash
python3 check_phones.py
```

---

## Troubleshooting

### "Invalid API Key" Error

**Problem:** The numverify API returns "invalid_access_key"

**Solutions:**
1. Verify your API key is correct in `.env.local`
2. Make sure you signed up at numverify.com or apilayer.com
3. Check your account dashboard for the correct key
4. Ensure your free tier hasn't expired (100 requests/month)

### Rate Limit Issues

**Problem:** Getting 429 errors when adding phones

**Solutions:**
1. Wait 1 hour for the limit to reset
2. The limit is per IP address - try from a different network
3. For production, consider increasing the limit in the code

### API Timeout

**Problem:** Validation takes too long or times out

**Current Behavior:**
- API timeout: 5 seconds
- Automatically falls back to basic validation
- Phone will still be added

---

## Production Recommendations

1. **Get a paid API plan** if you expect >100 validations/month
2. **Increase rate limits** for legitimate traffic
3. **Monitor API usage** to avoid exceeding quotas
4. **Consider caching** validation results
5. **Add logging** for failed validations

---

## Example: Getting a Free API Key

1. Visit: https://numverify.com/product
2. Click "Get Free API Key"
3. Fill in your details (name, email)
4. Confirm your email
5. Log in to dashboard
6. Copy your API Access Key
7. Add to `.env.local`:
   ```
   NUMVERIFY_API_KEY=abcd1234your_actual_key_here
   ```
8. Restart your dev server

---

## Notes

- **Free tier limits:** 100 API calls per month
- **Supported countries:** 200+ countries worldwide
- **Response time:** Usually < 1 second
- **Accuracy:** Uses carrier databases and number formatting rules
- **Privacy:** numverify doesn't store phone numbers

---

## Alternative: Self-Hosted Validation

If you don't want to use numverify, the system will fall back to basic validation:
- Checks for exactly 10 digits
- Assumes US phone numbers
- No carrier or line type information
- Still functional, just less robust
