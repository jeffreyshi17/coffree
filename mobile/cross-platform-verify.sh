#!/bin/bash

################################################################################
# FreeCoffee Mobile - Cross-Platform Verification Script
#
# Automated verification script for testing cross-platform consistency
# between iOS and Android builds.
#
# Usage:
#   ./cross-platform-verify.sh
#
# Requirements:
#   - curl (for API testing)
#   - jq (for JSON parsing)
#   - Environment variables: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
#
# Exit Codes:
#   0 - All checks passed
#   1 - One or more checks failed
#
################################################################################

set -e

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
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_check() {
    echo -e "${YELLOW}→${NC} $1..."
}

print_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

print_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

print_info() {
    echo -e "  ${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "  ${YELLOW}⚠${NC} $1"
}

################################################################################
# Environment Checks
################################################################################

check_environment() {
    print_header "Environment Verification"

    # Check for required commands
    print_check "Checking for required commands"

    if command -v curl &> /dev/null; then
        print_pass "curl is installed"
    else
        print_fail "curl is not installed (required for API testing)"
        exit 1
    fi

    if command -v jq &> /dev/null; then
        print_pass "jq is installed"
    else
        print_fail "jq is not installed (required for JSON parsing)"
        exit 1
    fi

    # Check for environment variables
    print_check "Checking environment variables"

    if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
        print_fail "EXPO_PUBLIC_SUPABASE_URL is not set"
        print_info "Set in .env file or export in shell"
        exit 1
    else
        print_pass "EXPO_PUBLIC_SUPABASE_URL is set"
    fi

    if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
        print_fail "EXPO_PUBLIC_SUPABASE_ANON_KEY is not set"
        print_info "Set in .env file or export in shell"
        exit 1
    else
        print_pass "EXPO_PUBLIC_SUPABASE_ANON_KEY is set"
    fi

    # Optional: Check API URL
    if [ -z "$EXPO_PUBLIC_API_URL" ]; then
        print_warning "EXPO_PUBLIC_API_URL not set, using default (http://localhost:3000)"
        export EXPO_PUBLIC_API_URL="http://localhost:3000"
    else
        print_pass "EXPO_PUBLIC_API_URL is set: $EXPO_PUBLIC_API_URL"
    fi
}

################################################################################
# Backend Connectivity
################################################################################

check_backend() {
    print_header "Backend Connectivity"

    # Check Supabase connection
    print_check "Testing Supabase REST API"

    SUPABASE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/")

    if [ "$SUPABASE_RESPONSE" = "200" ] || [ "$SUPABASE_RESPONSE" = "404" ]; then
        print_pass "Supabase REST API is accessible (HTTP $SUPABASE_RESPONSE)"
    else
        print_fail "Supabase REST API returned HTTP $SUPABASE_RESPONSE"
    fi

    # Check campaigns table
    print_check "Querying campaigns table"

    CAMPAIGNS_RESPONSE=$(curl -s \
        -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/campaigns?select=count&is_valid=eq.true&is_expired=eq.false")

    if echo "$CAMPAIGNS_RESPONSE" | jq . &> /dev/null; then
        CAMPAIGN_COUNT=$(curl -s -I \
            -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
            "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/campaigns?select=count&is_valid=eq.true&is_expired=eq.false" \
            | grep -i "content-range" | sed 's/.*\///' | tr -d '\r\n ')

        print_pass "Campaigns table accessible (${CAMPAIGN_COUNT:-0} valid campaigns)"
    else
        print_fail "Failed to query campaigns table"
    fi

    # Check phone_numbers table
    print_check "Querying phone_numbers table"

    PHONES_RESPONSE=$(curl -s \
        -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/phone_numbers?select=count")

    if echo "$PHONES_RESPONSE" | jq . &> /dev/null; then
        PHONE_COUNT=$(curl -s -I \
            -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
            "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/phone_numbers?select=count" \
            | grep -i "content-range" | sed 's/.*\///' | tr -d '\r\n ')

        print_pass "Phone_numbers table accessible (${PHONE_COUNT:-0} subscriptions)"
    else
        print_fail "Failed to query phone_numbers table"
    fi

    # Check message_logs table
    print_check "Querying message_logs table"

    LOGS_RESPONSE=$(curl -s \
        -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/message_logs?select=count&status=eq.success")

    if echo "$LOGS_RESPONSE" | jq . &> /dev/null; then
        DISTRIBUTED_COUNT=$(curl -s -I \
            -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
            "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/message_logs?select=count&status=eq.success" \
            | grep -i "content-range" | sed 's/.*\///' | tr -d '\r\n ')

        print_pass "Message_logs table accessible (${DISTRIBUTED_COUNT:-0} distributed)"
    else
        print_fail "Failed to query message_logs table"
    fi
}

################################################################################
# API Endpoints
################################################################################

check_api_endpoints() {
    print_header "API Endpoint Verification"

    # Check /api/campaigns/count
    print_check "Testing /api/campaigns/count endpoint"

    COUNT_RESPONSE=$(curl -s -w "\n%{http_code}" "$EXPO_PUBLIC_API_URL/api/campaigns/count")
    COUNT_BODY=$(echo "$COUNT_RESPONSE" | head -n -1)
    COUNT_STATUS=$(echo "$COUNT_RESPONSE" | tail -n 1)

    if [ "$COUNT_STATUS" = "200" ]; then
        COUNT_JSON=$(echo "$COUNT_BODY" | jq -r '.count' 2>/dev/null)
        DISTRIBUTED_JSON=$(echo "$COUNT_BODY" | jq -r '.distributed' 2>/dev/null)

        if [ ! -z "$COUNT_JSON" ] && [ "$COUNT_JSON" != "null" ]; then
            print_pass "/api/campaigns/count returns valid JSON (count: $COUNT_JSON, distributed: $DISTRIBUTED_JSON)"
        else
            print_fail "/api/campaigns/count returned invalid JSON"
        fi
    else
        print_fail "/api/campaigns/count returned HTTP $COUNT_STATUS"
        print_info "This endpoint is required for widgets on both iOS and Android"
    fi

    # Check /api/phone endpoint (GET)
    print_check "Testing /api/phone endpoint (GET)"

    PHONE_GET_RESPONSE=$(curl -s -w "\n%{http_code}" "$EXPO_PUBLIC_API_URL/api/phone")
    PHONE_GET_STATUS=$(echo "$PHONE_GET_RESPONSE" | tail -n 1)

    if [ "$PHONE_GET_STATUS" = "200" ]; then
        print_pass "/api/phone (GET) is accessible"
    else
        print_fail "/api/phone (GET) returned HTTP $PHONE_GET_STATUS"
    fi

    # Check /api/notifications/send endpoint exists
    print_check "Testing /api/notifications/send endpoint"

    # Note: We can't actually POST without valid data, but we can check if endpoint exists
    NOTIF_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$EXPO_PUBLIC_API_URL/api/notifications/send")
    NOTIF_STATUS=$(echo "$NOTIF_RESPONSE" | tail -n 1)

    if [ "$NOTIF_STATUS" = "200" ] || [ "$NOTIF_STATUS" = "400" ] || [ "$NOTIF_STATUS" = "405" ]; then
        print_pass "/api/notifications/send endpoint exists (HTTP $NOTIF_STATUS)"
    else
        print_fail "/api/notifications/send returned unexpected HTTP $NOTIF_STATUS"
        print_info "This endpoint is required for push notifications on both platforms"
    fi
}

################################################################################
# Mobile App Build Status
################################################################################

check_mobile_builds() {
    print_header "Mobile App Build Status"

    # Check if mobile directory exists
    print_check "Checking mobile project structure"

    if [ -d "./mobile" ]; then
        print_pass "Mobile directory exists"
    else
        print_fail "Mobile directory not found"
        return
    fi

    # Check package.json
    if [ -f "./mobile/package.json" ]; then
        print_pass "package.json exists"

        # Check for key dependencies
        if grep -q "@supabase/supabase-js" "./mobile/package.json"; then
            print_pass "Supabase client dependency installed"
        else
            print_fail "Supabase client dependency missing"
        fi

        if grep -q "expo-notifications" "./mobile/package.json"; then
            print_pass "Expo notifications dependency installed"
        else
            print_fail "Expo notifications dependency missing"
        fi

        if grep -q "@react-native-async-storage/async-storage" "./mobile/package.json"; then
            print_pass "AsyncStorage dependency installed (offline mode)"
        else
            print_fail "AsyncStorage dependency missing (offline mode)"
        fi

        if grep -q "@react-native-community/netinfo" "./mobile/package.json"; then
            print_pass "NetInfo dependency installed (network detection)"
        else
            print_fail "NetInfo dependency missing (network detection)"
        fi
    else
        print_fail "package.json not found"
    fi

    # Check app.json
    if [ -f "./mobile/app.json" ]; then
        print_pass "app.json exists"

        # Check bundle IDs
        IOS_BUNDLE=$(grep -o '"bundleIdentifier": *"[^"]*"' "./mobile/app.json" | head -1 | cut -d'"' -f4)
        ANDROID_PACKAGE=$(grep -o '"package": *"[^"]*"' "./mobile/app.json" | head -1 | cut -d'"' -f4)

        if [ ! -z "$IOS_BUNDLE" ]; then
            print_pass "iOS bundle identifier: $IOS_BUNDLE"
        else
            print_fail "iOS bundle identifier not configured"
        fi

        if [ ! -z "$ANDROID_PACKAGE" ]; then
            print_pass "Android package name: $ANDROID_PACKAGE"
        else
            print_fail "Android package name not configured"
        fi

        if [ "$IOS_BUNDLE" = "$ANDROID_PACKAGE" ]; then
            print_pass "iOS and Android use matching identifiers (good for consistency)"
        else
            print_warning "iOS and Android use different identifiers (acceptable but may cause confusion)"
        fi
    else
        print_fail "app.json not found"
    fi

    # Check EAS configuration
    if [ -f "./mobile/eas.json" ]; then
        print_pass "eas.json exists (EAS Build configured)"

        if grep -q '"preview"' "./mobile/eas.json"; then
            print_pass "Preview profile configured (for TestFlight/Internal Testing)"
        else
            print_fail "Preview profile not configured in eas.json"
        fi

        if grep -q '"production"' "./mobile/eas.json"; then
            print_pass "Production profile configured (for App Store/Play Store)"
        else
            print_fail "Production profile not configured in eas.json"
        fi
    else
        print_fail "eas.json not found (EAS Build not configured)"
    fi
}

################################################################################
# Widget Implementation
################################################################################

check_widget_implementation() {
    print_header "Widget Implementation Status"

    # Check iOS widget
    print_check "Checking iOS widget implementation"

    if [ -f "./mobile/ios/widgets/CampaignWidget.swift" ]; then
        print_pass "iOS widget Swift file exists"

        # Check for API endpoint in widget code
        if grep -q "campaigns/count" "./mobile/ios/widgets/CampaignWidget.swift"; then
            print_pass "iOS widget uses /api/campaigns/count endpoint"
        else
            print_warning "iOS widget may not be using correct API endpoint"
        fi
    else
        print_warning "iOS widget Swift file not found (may require development build)"
    fi

    # Check Android widget
    print_check "Checking Android widget implementation"

    if [ -f "./mobile/android/app/src/main/java/com/freecoffee/app/widgets/CampaignWidget.kt" ]; then
        print_pass "Android widget Kotlin file exists"

        # Check for API endpoint in widget code
        if grep -q "campaigns/count" "./mobile/android/app/src/main/java/com/freecoffee/app/widgets/CampaignWidget.kt"; then
            print_pass "Android widget uses /api/campaigns/count endpoint"
        else
            print_warning "Android widget may not be using correct API endpoint"
        fi
    else
        print_warning "Android widget Kotlin file not found (may require development build)"
    fi

    # Check widget resource files
    if [ -f "./mobile/ios/widgets/Info.plist" ]; then
        print_pass "iOS widget Info.plist exists"
    else
        print_warning "iOS widget Info.plist not found"
    fi

    if [ -f "./mobile/android/app/src/main/res/xml/campaign_widget_info.xml" ]; then
        print_pass "Android widget XML metadata exists"
    else
        print_warning "Android widget XML metadata not found"
    fi
}

################################################################################
# Platform-Specific Components
################################################################################

check_platform_components() {
    print_header "Platform-Specific Components"

    # Check notification setup
    print_check "Checking notification implementation"

    if [ -f "./mobile/lib/notifications.ts" ]; then
        print_pass "Notifications library exists"

        if grep -q "registerForPushNotificationsAsync" "./mobile/lib/notifications.ts"; then
            print_pass "Push notification registration function exists"
        else
            print_fail "Push notification registration function missing"
        fi
    else
        print_fail "Notifications library not found"
    fi

    # Check offline mode implementation
    print_check "Checking offline mode implementation"

    if [ -f "./mobile/lib/storage.ts" ]; then
        print_pass "Storage library exists (AsyncStorage wrapper)"
    else
        print_fail "Storage library not found (offline caching)"
    fi

    if [ -f "./mobile/lib/networkSync.ts" ]; then
        print_pass "Network sync library exists"

        if grep -q "initializeNetworkSync" "./mobile/lib/networkSync.ts"; then
            print_pass "Network sync initialization function exists"
        else
            print_fail "Network sync initialization function missing"
        fi
    else
        print_fail "Network sync library not found (offline mode)"
    fi

    if [ -f "./mobile/components/OfflineIndicator.tsx" ]; then
        print_pass "Offline indicator component exists"
    else
        print_fail "Offline indicator component not found"
    fi

    # Check data hooks
    print_check "Checking data hooks"

    if [ -f "./mobile/hooks/useCampaigns.ts" ]; then
        print_pass "useCampaigns hook exists"

        if grep -q "AsyncStorage" "./mobile/hooks/useCampaigns.ts" || grep -q "cache" "./mobile/hooks/useCampaigns.ts"; then
            print_pass "useCampaigns hook includes offline caching"
        else
            print_warning "useCampaigns hook may not support offline mode"
        fi
    else
        print_fail "useCampaigns hook not found"
    fi

    if [ -f "./mobile/hooks/useSubscription.ts" ]; then
        print_pass "useSubscription hook exists"
    else
        print_fail "useSubscription hook not found"
    fi
}

################################################################################
# Cross-Platform Consistency Checks
################################################################################

check_cross_platform_consistency() {
    print_header "Cross-Platform Consistency Checks"

    # Check for platform-specific styling
    print_check "Checking for consistent styling across platforms"

    # Check theme colors in app.json
    if [ -f "./mobile/app.json" ]; then
        if grep -q "#8B4513" "./mobile/app.json"; then
            print_pass "Coffee brown theme color (#8B4513) found in app.json"
        else
            print_warning "Coffee brown theme color not found in app.json"
        fi
    fi

    # Check for consistent API usage
    print_check "Checking API service layer"

    if [ -f "./mobile/services/campaignService.ts" ]; then
        print_pass "Campaign service exists"
    else
        print_fail "Campaign service not found"
    fi

    if [ -f "./mobile/services/phoneService.ts" ]; then
        print_pass "Phone service exists"
    else
        print_fail "Phone service not found"
    fi

    # Check for tab navigation
    print_check "Checking navigation structure"

    if [ -f "./mobile/app/(tabs)/_layout.tsx" ]; then
        print_pass "Tab navigation layout exists"

        # Count tabs
        TAB_COUNT=$(grep -c "Tabs.Screen" "./mobile/app/(tabs)/_layout.tsx" || echo "0")
        if [ "$TAB_COUNT" = "3" ]; then
            print_pass "Three tabs configured (Home, Campaigns, Settings)"
        else
            print_warning "Unexpected number of tabs: $TAB_COUNT (expected 3)"
        fi
    else
        print_fail "Tab navigation layout not found"
    fi

    # Check for main screens
    print_check "Checking main screen components"

    if [ -f "./mobile/app/(tabs)/index.tsx" ]; then
        print_pass "Home screen exists"
    else
        print_fail "Home screen not found"
    fi

    if [ -f "./mobile/app/(tabs)/campaigns.tsx" ]; then
        print_pass "Campaigns screen exists"
    else
        print_fail "Campaigns screen not found"
    fi

    if [ -f "./mobile/app/(tabs)/settings.tsx" ]; then
        print_pass "Settings screen exists"
    else
        print_fail "Settings screen not found"
    fi
}

################################################################################
# Testing Documentation
################################################################################

check_testing_documentation() {
    print_header "Testing Documentation"

    print_check "Checking for test documentation"

    if [ -f "./mobile/CROSS_PLATFORM_TEST_GUIDE.md" ]; then
        print_pass "Cross-platform test guide exists"
    else
        print_fail "Cross-platform test guide not found"
    fi

    if [ -f "./mobile/CROSS_PLATFORM_QUICK_CHECKLIST.md" ]; then
        print_pass "Quick checklist exists"
    else
        print_fail "Quick checklist not found"
    fi

    if [ -f "./mobile/CROSS_PLATFORM_README.md" ]; then
        print_pass "Cross-platform README exists"
    else
        print_fail "Cross-platform README not found"
    fi

    if [ -f "./mobile/E2E_TEST_GUIDE.md" ]; then
        print_pass "E2E test guide exists"
    else
        print_warning "E2E test guide not found"
    fi

    if [ -f "./mobile/OFFLINE_MODE_TEST_GUIDE.md" ]; then
        print_pass "Offline mode test guide exists"
    else
        print_warning "Offline mode test guide not found"
    fi
}

################################################################################
# Summary Report
################################################################################

print_summary() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}                    VERIFICATION SUMMARY                        ${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo ""

    echo -e "Total Checks:  ${BLUE}$TOTAL_CHECKS${NC}"
    echo -e "Passed:        ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed:        ${RED}$FAILED_CHECKS${NC}"
    echo ""

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "${GREEN}✓ All automated checks passed!${NC}"
        echo ""
        echo -e "${BLUE}Next Steps:${NC}"
        echo "  1. Install app on physical iOS device (iOS 14+)"
        echo "  2. Install app on physical Android device (Android 8.0+)"
        echo "  3. Run manual tests using CROSS_PLATFORM_TEST_GUIDE.md"
        echo "  4. Or use quick checklist: CROSS_PLATFORM_QUICK_CHECKLIST.md"
        echo ""
        echo -e "${YELLOW}Note:${NC} Push notifications and widgets require physical devices"
        echo ""
        return 0
    else
        echo -e "${RED}✗ Some checks failed${NC}"
        echo ""
        echo -e "${YELLOW}Action Required:${NC}"
        echo "  - Review failed checks above"
        echo "  - Fix configuration or implementation issues"
        echo "  - Re-run this script to verify fixes"
        echo ""
        return 1
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║      FreeCoffee Mobile - Cross-Platform Verification          ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Source .env file if it exists
    if [ -f "./mobile/.env" ]; then
        print_info "Loading environment variables from mobile/.env"
        set -a
        source ./mobile/.env
        set +a
    fi

    # Run all checks
    check_environment
    check_backend
    check_api_endpoints
    check_mobile_builds
    check_widget_implementation
    check_platform_components
    check_cross_platform_consistency
    check_testing_documentation

    # Print summary and exit
    print_summary
    exit $?
}

# Run main function
main
