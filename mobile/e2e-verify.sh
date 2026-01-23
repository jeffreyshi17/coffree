#!/bin/bash
# E2E Verification Script for FreeCoffee Mobile Application
# This script verifies backend and database state during E2E testing

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (override with environment variables)
API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:3000}"
SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY}"
TEST_PHONE="${TEST_PHONE:-5551234567}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}FreeCoffee E2E Verification Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if [ -z "$SUPABASE_URL" ]; then
  echo -e "${RED}❌ EXPO_PUBLIC_SUPABASE_URL not set${NC}"
  exit 1
fi

if [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}❌ EXPO_PUBLIC_SUPABASE_ANON_KEY not set${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Environment variables configured${NC}"
echo ""

# Function to make Supabase REST API request
supabase_query() {
  local table=$1
  local select=${2:-"*"}
  local filter=${3:-""}

  local url="${SUPABASE_URL}/rest/v1/${table}?select=${select}"
  if [ -n "$filter" ]; then
    url="${url}&${filter}"
  fi

  curl -s -X GET "$url" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json"
}

# Function to count records
count_records() {
  local table=$1
  local filter=${2:-""}

  local url="${SUPABASE_URL}/rest/v1/${table}?select=count"
  if [ -n "$filter" ]; then
    url="${url}&${filter}"
  fi

  curl -s -X GET "$url" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: count=exact"
}

# Test 1: Check backend is running
echo -e "${YELLOW}Test 1: Backend Health Check${NC}"
if curl -s -o /dev/null -w "%{http_code}" "${API_URL}/" | grep -q "200\|404"; then
  echo -e "${GREEN}✓ Backend is reachable at ${API_URL}${NC}"
else
  echo -e "${RED}❌ Backend is not reachable at ${API_URL}${NC}"
  exit 1
fi
echo ""

# Test 2: Check Supabase connectivity
echo -e "${YELLOW}Test 2: Supabase Connection${NC}"
SUPABASE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/phone_numbers?select=count&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

if [ "$SUPABASE_RESPONSE" = "200" ]; then
  echo -e "${GREEN}✓ Supabase is accessible${NC}"
else
  echo -e "${RED}❌ Supabase connection failed (HTTP ${SUPABASE_RESPONSE})${NC}"
  exit 1
fi
echo ""

# Test 3: Verify test phone exists
echo -e "${YELLOW}Test 3: Verify Test Phone Subscription${NC}"
PHONE_DATA=$(supabase_query "phone_numbers" "*" "phone=eq.${TEST_PHONE}")
PHONE_COUNT=$(echo "$PHONE_DATA" | jq -r 'length')

if [ "$PHONE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Test phone ${TEST_PHONE} found in database${NC}"

  # Extract details
  PLATFORM=$(echo "$PHONE_DATA" | jq -r '.[0].platform')
  PUSH_TOKEN=$(echo "$PHONE_DATA" | jq -r '.[0].push_token')
  CREATED_AT=$(echo "$PHONE_DATA" | jq -r '.[0].created_at')

  echo -e "  Platform: ${PLATFORM}"
  echo -e "  Push Token: ${PUSH_TOKEN}"
  echo -e "  Created: ${CREATED_AT}"

  # Check push token
  if [ "$PUSH_TOKEN" != "null" ] && [ -n "$PUSH_TOKEN" ]; then
    echo -e "${GREEN}  ✓ Push token is set${NC}"
  else
    echo -e "${RED}  ❌ Push token is missing (notifications won't work)${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Test phone ${TEST_PHONE} not found in database${NC}"
  echo -e "  Run Phase 2 of E2E test to add phone number"
fi
echo ""

# Test 4: Check campaign count
echo -e "${YELLOW}Test 4: Campaign Count${NC}"
VALID_CAMPAIGNS=$(supabase_query "campaigns" "count" "is_valid=eq.true&is_expired=eq.false")
CAMPAIGN_COUNT=$(echo "$VALID_CAMPAIGNS" | jq -r '.[0].count // 0')

echo -e "  Valid campaigns: ${CAMPAIGN_COUNT}"

if [ "$CAMPAIGN_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Campaigns exist for testing${NC}"

  # Get latest campaign
  LATEST_CAMPAIGN=$(supabase_query "campaigns" "campaign_id,marketing_channel,created_at" "is_valid=eq.true&order=created_at.desc&limit=1")
  LATEST_ID=$(echo "$LATEST_CAMPAIGN" | jq -r '.[0].campaign_id')
  LATEST_MC=$(echo "$LATEST_CAMPAIGN" | jq -r '.[0].marketing_channel')
  LATEST_TIME=$(echo "$LATEST_CAMPAIGN" | jq -r '.[0].created_at')

  echo -e "  Latest campaign: ID=${LATEST_ID}, MC=${LATEST_MC}"
  echo -e "  Created: ${LATEST_TIME}"
else
  echo -e "${YELLOW}⚠ No campaigns exist yet${NC}"
  echo -e "  Submit a campaign via web admin to test notifications"
fi
echo ""

# Test 5: Check message logs
echo -e "${YELLOW}Test 5: Message Delivery Logs${NC}"
if [ "$PHONE_COUNT" -gt 0 ]; then
  MESSAGE_LOGS=$(supabase_query "message_logs" "*" "phone_number=eq.${TEST_PHONE}&order=created_at.desc&limit=5")
  LOG_COUNT=$(echo "$MESSAGE_LOGS" | jq -r 'length')

  echo -e "  Total messages sent to ${TEST_PHONE}: ${LOG_COUNT}"

  if [ "$LOG_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Message logs found${NC}"

    # Count successes and failures
    SUCCESS_COUNT=$(echo "$MESSAGE_LOGS" | jq -r '[.[] | select(.status == "success")] | length')
    FAILURE_COUNT=$(echo "$MESSAGE_LOGS" | jq -r '[.[] | select(.status == "failed")] | length')

    echo -e "  Successful: ${SUCCESS_COUNT}"
    echo -e "  Failed: ${FAILURE_COUNT}"

    # Show latest message
    LATEST_STATUS=$(echo "$MESSAGE_LOGS" | jq -r '.[0].status')
    LATEST_CAMPAIGN=$(echo "$MESSAGE_LOGS" | jq -r '.[0].campaign_id')
    LATEST_ERROR=$(echo "$MESSAGE_LOGS" | jq -r '.[0].error_message')

    echo -e "  Latest: Campaign ${LATEST_CAMPAIGN} - Status: ${LATEST_STATUS}"
    if [ "$LATEST_ERROR" != "null" ]; then
      echo -e "  Error: ${LATEST_ERROR}"
    fi
  else
    echo -e "${YELLOW}⚠ No message logs found${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Skipped (test phone not in database)${NC}"
fi
echo ""

# Test 6: Check API endpoints
echo -e "${YELLOW}Test 6: API Endpoint Accessibility${NC}"

endpoints=(
  "/api/phone:GET"
  "/api/campaigns/count:GET"
  "/api/logs:GET"
)

for endpoint_method in "${endpoints[@]}"; do
  IFS=':' read -r endpoint method <<< "$endpoint_method"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "${API_URL}${endpoint}")

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ ${method} ${endpoint} (HTTP ${HTTP_CODE})${NC}"
  else
    echo -e "${RED}❌ ${method} ${endpoint} (HTTP ${HTTP_CODE})${NC}"
  fi
done
echo ""

# Test 7: Database statistics
echo -e "${YELLOW}Test 7: Database Statistics${NC}"

TOTAL_PHONES=$(supabase_query "phone_numbers" "count" "")
TOTAL_PHONES_COUNT=$(echo "$TOTAL_PHONES" | jq -r '.[0].count // 0')

TOTAL_CAMPAIGNS=$(supabase_query "campaigns" "count" "")
TOTAL_CAMPAIGNS_COUNT=$(echo "$TOTAL_CAMPAIGNS" | jq -r '.[0].count // 0')

TOTAL_MESSAGES=$(supabase_query "message_logs" "count" "")
TOTAL_MESSAGES_COUNT=$(echo "$TOTAL_MESSAGES" | jq -r '.[0].count // 0')

echo -e "  Total phone numbers: ${TOTAL_PHONES_COUNT}"
echo -e "  Total campaigns: ${TOTAL_CAMPAIGNS_COUNT}"
echo -e "  Total messages sent: ${TOTAL_MESSAGES_COUNT}"

if [ "$TOTAL_PHONES_COUNT" -gt 0 ]; then
  # Platform breakdown
  ANDROID_COUNT=$(supabase_query "phone_numbers" "count" "platform=eq.android" | jq -r '.[0].count // 0')
  APPLE_COUNT=$(supabase_query "phone_numbers" "count" "platform=eq.apple" | jq -r '.[0].count // 0')

  echo -e "  Android devices: ${ANDROID_COUNT}"
  echo -e "  Apple devices: ${APPLE_COUNT}"

  # Push token coverage
  WITH_TOKEN=$(supabase_query "phone_numbers" "count" "push_token=not.is.null" | jq -r '.[0].count // 0')
  WITHOUT_TOKEN=$(supabase_query "phone_numbers" "count" "push_token=is.null" | jq -r '.[0].count // 0')

  echo -e "  With push tokens: ${WITH_TOKEN}"
  echo -e "  Without push tokens: ${WITHOUT_TOKEN}"

  if [ "$WITHOUT_TOKEN" -gt 0 ]; then
    echo -e "${YELLOW}  ⚠ ${WITHOUT_TOKEN} devices cannot receive push notifications${NC}"
  fi
fi

if [ "$TOTAL_MESSAGES_COUNT" -gt 0 ]; then
  SUCCESS_TOTAL=$(supabase_query "message_logs" "count" "status=eq.success" | jq -r '.[0].count // 0')
  FAILURE_TOTAL=$(supabase_query "message_logs" "count" "status=eq.failed" | jq -r '.[0].count // 0')

  echo -e "  Successful deliveries: ${SUCCESS_TOTAL}"
  echo -e "  Failed deliveries: ${FAILURE_TOTAL}"

  if [ "$TOTAL_MESSAGES_COUNT" -gt 0 ]; then
    SUCCESS_RATE=$(echo "scale=1; ${SUCCESS_TOTAL} * 100 / ${TOTAL_MESSAGES_COUNT}" | bc)
    echo -e "  Success rate: ${SUCCESS_RATE}%"
  fi
fi

echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "$PHONE_COUNT" -gt 0 ] && [ "$CAMPAIGN_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ System ready for E2E testing${NC}"
  echo -e "  - Test phone is subscribed"
  echo -e "  - Campaigns exist for testing"
  echo -e "  - Backend and database are accessible"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo -e "  1. Install mobile app on physical device"
  echo -e "  2. Grant notification permissions"
  echo -e "  3. Submit new campaign via web admin"
  echo -e "  4. Verify push notification arrives"
  echo -e "  5. Check campaign appears in app"
  echo -e "  6. Verify widget displays correct count"
elif [ "$PHONE_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}⚠ Test phone not yet subscribed${NC}"
  echo -e "  Run Phase 2 (Phone Number Subscription) of E2E test"
elif [ "$CAMPAIGN_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}⚠ No campaigns exist yet${NC}"
  echo -e "  Submit a campaign via web admin (Phase 3)"
else
  echo -e "${RED}❌ System not ready for testing${NC}"
  echo -e "  Check backend and database configuration"
fi

echo ""
echo -e "${BLUE}Test phone: ${TEST_PHONE}${NC}"
echo -e "${BLUE}API URL: ${API_URL}${NC}"
echo -e "${BLUE}Supabase URL: ${SUPABASE_URL}${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
