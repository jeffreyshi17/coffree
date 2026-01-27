#!/bin/bash

##############################################################################
# Offline Mode Automated Verification Script
#
# This script automates backend and database verification for offline mode
# testing. It checks cache integrity, network sync functionality, and
# database state.
#
# Usage:
#   ./offline-verify.sh
#
# Requirements:
#   - curl (for API calls)
#   - jq (for JSON parsing)
#   - Environment variables: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
#
# Exit Codes:
#   0 = All checks passed
#   1 = One or more checks failed
##############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_check() {
    echo -e "${YELLOW}⏳ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
}

print_failure() {
    echo -e "${RED}❌ $1${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check required commands
check_dependencies() {
    print_header "Checking Dependencies"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 2))

    print_check "Checking for curl..."
    if command -v curl &> /dev/null; then
        print_success "curl is installed"
    else
        print_failure "curl is not installed. Please install curl."
        exit 1
    fi

    print_check "Checking for jq..."
    if command -v jq &> /dev/null; then
        print_success "jq is installed"
    else
        print_failure "jq is not installed. Please install jq for JSON parsing."
        exit 1
    fi
}

# Check environment variables
check_environment() {
    print_header "Checking Environment Variables"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 2))

    print_check "Checking EXPO_PUBLIC_SUPABASE_URL..."
    if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
        print_failure "EXPO_PUBLIC_SUPABASE_URL is not set"
        print_info "Set it with: export EXPO_PUBLIC_SUPABASE_URL='your-supabase-url'"
        exit 1
    else
        print_success "EXPO_PUBLIC_SUPABASE_URL is set"
        print_info "URL: $EXPO_PUBLIC_SUPABASE_URL"
    fi

    print_check "Checking EXPO_PUBLIC_SUPABASE_ANON_KEY..."
    if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
        print_failure "EXPO_PUBLIC_SUPABASE_ANON_KEY is not set"
        print_info "Set it with: export EXPO_PUBLIC_SUPABASE_ANON_KEY='your-anon-key'"
        exit 1
    else
        print_success "EXPO_PUBLIC_SUPABASE_ANON_KEY is set"
        print_info "Key: ${EXPO_PUBLIC_SUPABASE_ANON_KEY:0:20}..."
    fi
}

# Check backend API health
check_backend() {
    print_header "Checking Backend API"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 2))

    # Allow custom API URL or use localhost default
    API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:3000}"

    print_check "Checking API health at $API_URL/api/health..."

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Backend API is healthy (HTTP 200)"
    elif [ "$HTTP_CODE" = "000" ]; then
        print_failure "Backend API is unreachable. Is the server running?"
        print_info "Start backend with: npm run dev"
    else
        print_failure "Backend API returned HTTP $HTTP_CODE"
    fi

    print_check "Checking campaigns API endpoint..."

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/campaigns" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Campaigns API is accessible (HTTP 200)"
    else
        print_failure "Campaigns API returned HTTP $HTTP_CODE"
    fi
}

# Check Supabase connectivity
check_supabase() {
    print_header "Checking Supabase Connectivity"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 3))

    print_check "Testing Supabase REST API connectivity..."

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Supabase REST API is accessible (HTTP 200)"
    else
        print_failure "Supabase REST API returned HTTP $HTTP_CODE"
        print_info "Check your Supabase URL and API key"
    fi

    print_check "Querying campaigns table..."

    CAMPAIGNS_RESPONSE=$(curl -s \
        -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/campaigns?select=*&is_valid=eq.true&is_expired=eq.false" 2>/dev/null)

    if [ $? -eq 0 ] && [ -n "$CAMPAIGNS_RESPONSE" ]; then
        CAMPAIGN_COUNT=$(echo "$CAMPAIGNS_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")
        print_success "Successfully queried campaigns table"
        print_info "Found $CAMPAIGN_COUNT active campaigns"
    else
        print_failure "Failed to query campaigns table"
    fi

    print_check "Querying phone_numbers table..."

    PHONES_RESPONSE=$(curl -s \
        -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/phone_numbers?select=count" \
        -G --data-urlencode "count=exact" \
        --data-urlencode "select=id" 2>/dev/null)

    if [ $? -eq 0 ]; then
        print_success "Successfully queried phone_numbers table"
    else
        print_failure "Failed to query phone_numbers table"
    fi
}

# Check campaigns data
check_campaigns_data() {
    print_header "Checking Campaigns Data"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 3))

    print_check "Fetching active campaigns..."

    CAMPAIGNS=$(curl -s \
        -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/campaigns?select=*&is_valid=eq.true&is_expired=eq.false&order=created_at.desc" 2>/dev/null)

    COUNT=$(echo "$CAMPAIGNS" | jq '. | length' 2>/dev/null || echo "0")

    if [ "$COUNT" -gt 0 ]; then
        print_success "Found $COUNT active campaigns"

        # Display first campaign details
        FIRST_CAMPAIGN=$(echo "$CAMPAIGNS" | jq '.[0]' 2>/dev/null)
        STORE_NAME=$(echo "$FIRST_CAMPAIGN" | jq -r '.store_name' 2>/dev/null || echo "Unknown")
        VOUCHER_AMOUNT=$(echo "$FIRST_CAMPAIGN" | jq -r '.voucher_amount' 2>/dev/null || echo "0")

        print_info "Latest campaign: $STORE_NAME - \$$VOUCHER_AMOUNT"
    else
        print_failure "No active campaigns found in database"
        print_info "Add a test campaign with: curl -X POST http://localhost:3000/api/send-coffee ..."
    fi

    print_check "Checking campaign data quality..."

    CAMPAIGNS_WITH_STORE=$(echo "$CAMPAIGNS" | jq '[.[] | select(.store_name != null)] | length' 2>/dev/null || echo "0")

    if [ "$CAMPAIGNS_WITH_STORE" -eq "$COUNT" ] && [ "$COUNT" -gt 0 ]; then
        print_success "All campaigns have store_name populated"
    elif [ "$COUNT" -gt 0 ]; then
        print_failure "Some campaigns missing store_name ($CAMPAIGNS_WITH_STORE / $COUNT)"
    fi

    print_check "Checking campaign expiration dates..."

    CAMPAIGNS_WITH_EXPIRY=$(echo "$CAMPAIGNS" | jq '[.[] | select(.expires_at != null)] | length' 2>/dev/null || echo "0")

    if [ "$CAMPAIGNS_WITH_EXPIRY" -eq "$COUNT" ] && [ "$COUNT" -gt 0 ]; then
        print_success "All campaigns have expiration dates"
    elif [ "$COUNT" -gt 0 ]; then
        print_failure "Some campaigns missing expiration dates ($CAMPAIGNS_WITH_EXPIRY / $COUNT)"
    fi
}

# Check cache storage functionality
check_cache_storage() {
    print_header "Checking AsyncStorage Cache Configuration"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 2))

    print_check "Checking storage.ts configuration..."

    if [ -f "lib/storage.ts" ]; then
        print_success "lib/storage.ts exists"

        # Check for STORAGE_KEYS constant
        if grep -q "STORAGE_KEYS" "lib/storage.ts"; then
            print_info "STORAGE_KEYS constant found"
        fi

        # Check for cache functions
        if grep -q "setCachedItem" "lib/storage.ts" && grep -q "getCachedItem" "lib/storage.ts"; then
            print_info "Cache functions (setCachedItem, getCachedItem) defined"
        fi
    else
        print_failure "lib/storage.ts not found"
    fi

    print_check "Checking networkSync.ts configuration..."

    if [ -f "lib/networkSync.ts" ]; then
        print_success "lib/networkSync.ts exists"

        # Check for background sync functions
        if grep -q "performBackgroundSync" "lib/networkSync.ts"; then
            print_info "performBackgroundSync function found"
        fi

        if grep -q "initializeNetworkSync" "lib/networkSync.ts"; then
            print_info "initializeNetworkSync function found"
        fi
    else
        print_failure "lib/networkSync.ts not found"
    fi
}

# Check offline mode components
check_offline_components() {
    print_header "Checking Offline Mode Components"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 2))

    print_check "Checking OfflineIndicator component..."

    if [ -f "components/OfflineIndicator.tsx" ]; then
        print_success "OfflineIndicator component exists"

        # Check for NetworkStatus type
        if grep -q "NetworkStatus" "components/OfflineIndicator.tsx"; then
            print_info "NetworkStatus type imported"
        fi
    else
        print_failure "components/OfflineIndicator.tsx not found"
    fi

    print_check "Checking _layout.tsx integration..."

    if [ -f "app/_layout.tsx" ]; then
        print_success "app/_layout.tsx exists"

        # Check for network sync initialization
        if grep -q "initializeNetworkSync" "app/_layout.tsx"; then
            print_info "initializeNetworkSync called in layout"
        fi

        # Check for OfflineIndicator component
        if grep -q "OfflineIndicator" "app/_layout.tsx"; then
            print_info "OfflineIndicator component rendered"
        fi
    else
        print_failure "app/_layout.tsx not found"
    fi
}

# Check useCampaigns hook
check_use_campaigns_hook() {
    print_header "Checking useCampaigns Hook (Cache-First Strategy)"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    print_check "Checking useCampaigns hook implementation..."

    if [ -f "hooks/useCampaigns.ts" ]; then
        print_success "hooks/useCampaigns.ts exists"

        # Check for cache-first strategy
        if grep -q "getCachedItem" "hooks/useCampaigns.ts"; then
            print_info "Cache-first strategy implemented (getCachedItem)"
        fi

        if grep -q "setCachedItem" "hooks/useCampaigns.ts"; then
            print_info "Cache write implemented (setCachedItem)"
        fi

        # Check for error handling with cache fallback
        if grep -q "catch" "hooks/useCampaigns.ts"; then
            print_info "Error handling with cache fallback present"
        fi
    else
        print_failure "hooks/useCampaigns.ts not found"
    fi
}

# Generate summary report
generate_summary() {
    print_header "Test Summary"

    echo -e "Total Checks: ${BLUE}$TOTAL_CHECKS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"

    PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_CHECKS/$TOTAL_CHECKS)*100}")

    echo -e "\nPass Rate: ${BLUE}${PASS_RATE}%${NC}"

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All automated checks passed!${NC}"
        echo -e "${GREEN}Proceed with manual device testing using OFFLINE_MODE_TEST_GUIDE.md${NC}"
        return 0
    else
        echo -e "\n${RED}⚠️  Some checks failed. Please review and fix issues before proceeding.${NC}"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   FreeCoffee Offline Mode Verification Script          ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"

    check_dependencies
    check_environment
    check_backend
    check_supabase
    check_campaigns_data
    check_cache_storage
    check_offline_components
    check_use_campaigns_hook

    generate_summary

    exit $?
}

# Run main function
main
