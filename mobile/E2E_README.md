# End-to-End Testing Documentation

This directory contains comprehensive E2E testing documentation for the FreeCoffee mobile application.

## Files Overview

### 1. E2E_TEST_GUIDE.md (Comprehensive)
**Purpose:** Complete step-by-step testing guide with detailed instructions

**Use When:**
- First-time testing the application
- Need detailed verification steps
- Training new testers
- Creating test reports

**Contains:**
- 27 detailed test cases
- Database verification queries
- Troubleshooting guides
- Screenshot placeholders
- Sign-off checklist

**Time Required:** 30-45 minutes

---

### 2. E2E_QUICK_CHECKLIST.md (Quick Reference)
**Purpose:** Fast verification checklist for experienced testers

**Use When:**
- Quick regression testing
- Verifying bug fixes
- Pre-deployment validation
- Daily testing during development

**Contains:**
- 7 testing phases
- Pass/fail criteria
- SQL query quick reference
- Critical vs minor issue tracking

**Time Required:** 10-15 minutes (if familiar with flow)

---

### 3. e2e-verify.sh (Automated Verification)
**Purpose:** Automated backend and database state verification

**Use When:**
- Pre-test setup validation
- CI/CD pipeline checks
- Quick system health check
- Debugging backend issues

**Usage:**
```bash
cd mobile
./e2e-verify.sh
```

**Checks:**
- Backend server accessibility
- Supabase database connectivity
- Test phone subscription status
- Campaign availability
- Message delivery logs
- API endpoint health
- Database statistics

**Time Required:** 10-30 seconds

---

## Testing Workflow

### Initial Setup (First Time Only)
1. Install mobile app on physical device
2. Configure environment variables
3. Ensure backend server is running
4. Have Capital One campaign link ready

### Regular Testing Flow
```
1. Run automated verification
   └─> ./e2e-verify.sh

2. If verification passes:
   └─> Follow E2E_QUICK_CHECKLIST.md

3. If issues found:
   └─> Use E2E_TEST_GUIDE.md for detailed debugging

4. Document results
   └─> Fill in checklist or full test report

5. Update implementation_plan.json
   └─> Mark subtask as completed or blocked
```

---

## Test Environment Setup

### Prerequisites
- **Device:** Physical iOS (14+) or Android (8.0+) device
- **Backend:** Next.js server running at `$EXPO_PUBLIC_API_URL`
- **Database:** Supabase project accessible
- **Build:** Development build or TestFlight/Internal Testing build

### Environment Variables

**Backend (.env):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

**Mobile (mobile/.env):**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
EXPO_PUBLIC_API_URL=https://your-app.vercel.app
```

**Test Script (export before running):**
```bash
export EXPO_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJxxxxx"
export EXPO_PUBLIC_API_URL="https://your-app.vercel.app"
export TEST_PHONE="5551234567"
```

---

## Test Scenarios Covered

### Phase 1: Installation & Permissions
- App installation on physical device
- First launch experience
- Notification permission granting
- App icon and splash screen

### Phase 2: Phone Subscription
- Phone number input and validation
- Platform selection (Android/Apple)
- Form submission and loading states
- Push token registration
- Database entry creation
- Duplicate phone prevention

### Phase 3: Campaign Delivery & Notifications
- Campaign submission via web admin
- Push notification triggering
- Notification appearance on device
- Notification content verification
- Deep linking to Campaigns screen
- Database logging

### Phase 4: Campaign Display
- Campaign list rendering
- Pull-to-refresh functionality
- Campaign count accuracy
- Card styling and layout
- Timestamp formatting

### Phase 5: Home Screen Widgets
- Widget installation (iOS & Android)
- Widget data accuracy
- Widget auto-refresh
- Deep linking from widget
- Widget layout and styling

### Phase 6: Offline Mode
- Offline indicator display
- Cache-first data loading
- Background sync on reconnection
- Network transition handling

### Phase 7: Subscription Management
- Settings screen display
- Phone number anonymization
- Unsubscribe flow with confirmation
- Database cleanup after unsubscribe
- Re-subscription capability

---

## Pass/Fail Criteria

### Critical Requirements (Must Pass)
✅ Phone signup completes successfully
✅ Push token stored in database
✅ Campaign triggers push notification
✅ Notification received within 10 seconds
✅ Campaign appears in mobile app
✅ Widget displays correct count
✅ Offline mode works with cache

### Non-Critical (Can Be Fixed)
- Minor UI styling issues
- Non-essential error messages
- Performance optimizations
- Widget refresh timing
- Animation smoothness

---

## Troubleshooting Quick Reference

### Push Notifications Not Received
1. Check push token: `SELECT push_token FROM phone_numbers WHERE phone = 'XXX'`
2. Verify Expo service: https://status.expo.dev
3. Check device notification settings
4. Verify backend triggered notification (check logs)
5. Use development build (not Expo Go)

### Widget Not Displaying Data
1. Verify environment variables set
2. Check network permissions
3. Ensure development build (not Expo Go)
4. Verify Supabase REST API accessible
5. Check 10-second timeout not exceeded

### App Crashes on Launch
1. Verify .env file exists
2. Check bundle identifier matches
3. Run `npx expo prebuild --clean`
4. Verify all native modules linked

### Offline Mode Not Working
1. Load campaigns while online first
2. Verify AsyncStorage installed
3. Check NetInfo properly linked
4. Clear app cache and retry

---

## Test Data Management

### Test Phone Numbers
Use these formats for testing:
- Primary: 555-123-4567
- Secondary: 555-987-6543
- Tertiary: 555-111-2222

**Important:** These are normalized to digits only in database

### Sample Campaign Links
```
https://coffree.capitalone.com/sms/?cid=TEST1234&mc=TESTCHANNEL
```

### Database Cleanup
```sql
-- Remove test data after testing
DELETE FROM message_logs WHERE phone_number = '5551234567';
DELETE FROM phone_numbers WHERE phone = '5551234567';
DELETE FROM campaigns WHERE campaign_id = 'TEST1234';
```

---

## CI/CD Integration

### Automated Backend Verification
```yaml
# .github/workflows/e2e-verify.yml
name: E2E Backend Verification

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run E2E Verification
        env:
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_KEY }}
          EXPO_PUBLIC_API_URL: ${{ secrets.API_URL }}
        run: |
          cd mobile
          ./e2e-verify.sh
```

### Manual Testing Required
Note: Full E2E testing with physical devices must be done manually
- Push notifications require physical device
- Widgets require native builds
- Device-specific behaviors cannot be automated

---

## Reporting Issues

### Issue Template
```markdown
**Test Case:** Phase X - [Test Name]
**Severity:** Critical | High | Medium | Low
**Device:** iPhone 14 Pro / Pixel 7
**OS Version:** iOS 17.2 / Android 14
**App Version:** 1.0.0 (Build 1)

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Screenshots/Videos:**
[Attach media]

**Database State:**
```sql
SELECT * FROM phone_numbers WHERE phone = 'XXX';
```

**Backend Logs:**
```
[Paste relevant logs]
```

**Additional Context:**
[Any other relevant information]
```

---

## Test Results Archive

### Test Report Storage
Store completed test reports in:
```
.auto-claude/specs/004-native-mobile-application/test-results/
├── e2e-test-YYYY-MM-DD-HH-MM.md
├── screenshots/
│   ├── phase1-installation.png
│   ├── phase2-subscription.png
│   ├── phase3-notification.png
│   └── ...
└── videos/
    ├── complete-flow.mp4
    └── notification-tap.mp4
```

### Test History Tracking
```sql
-- Create test_runs table (optional)
CREATE TABLE test_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_date TIMESTAMPTZ NOT NULL,
  tester_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  os_version TEXT NOT NULL,
  app_version TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('pass', 'fail', 'partial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Next Steps After E2E Testing

### If All Tests Pass ✅
1. Mark subtask-8-1 as completed in implementation_plan.json
2. Commit test results and documentation
3. Proceed to subtask-8-2: Offline mode testing (deeper dive)
4. Proceed to subtask-8-3: Cross-platform consistency testing
5. Begin app store submission preparation

### If Tests Fail ❌
1. Document all failures in test report
2. Create GitHub issues for each bug
3. Prioritize critical issues
4. Fix issues and re-test
5. Update implementation_plan.json with status

---

## Frequently Asked Questions

### Q: Can I test with Expo Go instead of a development build?
**A:** No. Push notifications and widgets require native code and won't work in Expo Go. Use `npx expo run:ios` or `npx expo run:android` for development builds, or TestFlight/Internal Testing for distribution builds.

### Q: How long does widget refresh take?
**A:** iOS enforces a minimum 15-minute refresh interval. Android may batch updates to 30 minutes or more for battery optimization. You can force refresh by removing and re-adding the widget.

### Q: What if push notifications don't arrive?
**A:** Check the troubleshooting section in E2E_TEST_GUIDE.md. Most common issues: missing push token, Expo service outage, device notification settings, or using Expo Go instead of dev build.

### Q: Can I automate the entire E2E test?
**A:** No. Physical device interactions (notifications, widgets, offline mode) require manual testing. However, you can automate backend/database verification with e2e-verify.sh.

### Q: How do I test on both iOS and Android?
**A:** Run the complete test flow on one platform first, then repeat on the other platform (subtask-8-3). Widget implementation differs between platforms, so both must be tested.

---

## Contact & Support

**Test Issues:** Create GitHub issue with `[E2E Test]` label
**Backend Issues:** Check backend server logs and Supabase dashboard
**Build Issues:** Refer to BUILD_GUIDE.md and IOS_SIGNING_SETUP.md

---

**Last Updated:** 2026-01-23
**Version:** 1.0.0
**Maintained By:** Auto-Claude Coder Agent
