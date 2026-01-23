# End-to-End Testing Guide
## FreeCoffee Mobile Application

This guide provides comprehensive step-by-step instructions for testing the complete subscription flow from mobile app installation through campaign delivery and notification.

---

## Test Overview

**Test Scope:** Complete user journey from phone signup to campaign notification
**Duration:** ~30-45 minutes
**Requirements:** Physical iOS or Android device, active backend, Supabase access

**Flow Being Tested:**
1. Phone signup via mobile app →
2. Phone stored in database with push token →
3. New campaign triggers notification →
4. Notification received on device →
5. Campaign appears in mobile app →
6. Widget displays correct count

---

## Prerequisites

### Required Accounts & Access
- [ ] Physical iOS device (iOS 14+) or Android device (Android 8.0+)
- [ ] Apple Developer account (for iOS TestFlight) OR Google Play Console access (for Android Internal Testing)
- [ ] Supabase project access (read/write to phone_numbers, campaigns, message_logs tables)
- [ ] Capital One coffee campaign link (format: `https://coffree.capitalone.com/sms/?cid=xxx&mc=yyy`)
- [ ] Access to web admin interface (to submit campaigns)

### Environment Setup
```bash
# Backend must be running
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app (or http://localhost:3000)
```

### Mobile App Installation
**Option A: Development Build**
```bash
cd mobile
npx expo run:ios   # For iOS
npx expo run:android   # For Android
```

**Option B: TestFlight (iOS)**
1. Upload build: `eas build --platform ios --profile preview`
2. Submit to TestFlight: `eas submit --platform ios --latest`
3. Install TestFlight app from App Store
4. Accept tester invitation
5. Install FreeCoffee from TestFlight

**Option C: Play Console Internal Testing (Android)**
1. Upload build: `eas build --platform android --profile preview`
2. Submit to Play Console: `eas submit --platform android --latest --track internal`
3. Accept tester invitation
4. Install FreeCoffee from Play Store link

---

## Test Procedure

### Phase 1: Mobile App Installation & Launch

#### 1.1 Install Application
**Action:** Install mobile app on physical device using one of the methods above

**Expected Result:**
- App installs successfully without errors
- App icon appears on home screen with FreeCoffee branding
- App opens when tapped

**Verification:**
```sql
-- No database changes at this step
```

**Status:** ⬜ Pass ⬜ Fail
**Notes:** _________________________________

---

#### 1.2 Grant Push Notification Permissions
**Action:**
1. Open FreeCoffee app
2. Accept notification permission prompt when it appears (should appear on first launch)

**Expected Result:**
- iOS: System dialog appears asking "Allow 'FreeCoffee' to send you notifications?"
- Android: System dialog appears asking "Allow FreeCoffee to send notifications?"
- After accepting, notifications are enabled in app settings

**Verification:**
- iOS: Settings → FreeCoffee → Notifications shows "Allow Notifications" is ON
- Android: Settings → Apps → FreeCoffee → Notifications shows notifications are enabled

**Status:** ⬜ Pass ⬜ Fail
**Notes:** _________________________________

---

### Phase 2: Phone Number Subscription

#### 2.1 Navigate to Home Screen
**Action:**
1. Ensure you're on the "Home" tab (first tab)
2. Observe the subscription form

**Expected Result:**
- Home screen displays with coffee cup icon
- Title: "Welcome to FreeCoffee"
- Subtitle: "Get notified about Capital One free coffee offers"
- Form shows phone input field and platform selector
- "Get Free Coffee" button is visible

**Status:** ⬜ Pass ⬜ Fail
**Screenshot:** _________________________________

---

#### 2.2 Submit Phone Number
**Action:**
1. Enter a valid 10-digit phone number (e.g., 555-123-4567)
2. Select platform: Android or Apple (match your device)
3. Tap "Get Free Coffee" button

**Expected Result:**
- Button changes to "Sending your free coffee texts..." with loading spinner
- After 2-5 seconds, success modal appears
- Success modal shows: "Success!" with checkmark
- Message shows: "You'll receive N free coffee voucher(s) via text shortly!" OR "You have been added to the mailing list!" (if no campaigns exist)
- Phone input field is cleared after dismissing modal

**Verification:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM phone_numbers
WHERE phone = '5551234567' -- normalized: digits only
ORDER BY created_at DESC
LIMIT 1;

-- Expected columns:
-- - phone: '5551234567' (normalized)
-- - platform: 'android' or 'apple' (matches selection)
-- - push_token: 'ExponentPushToken[xxxxxxxxxx]' (Expo push token)
-- - created_at: (current timestamp)
```

**Status:** ⬜ Pass ⬜ Fail
**Database Entry ID:** _________________________________
**Push Token:** _________________________________

---

#### 2.3 Verify Push Token Stored
**Action:** Check that push token was successfully stored in Supabase

**Expected Result:**
- push_token column contains valid Expo push token
- Format: `ExponentPushToken[xxxxxxxxxxxxxxxxxx]` (alphanumeric string)
- Token should NOT be null

**Verification:**
```sql
SELECT push_token
FROM phone_numbers
WHERE phone = '5551234567';

-- Expected: ExponentPushToken[xxxxxxxxxx]
-- Fail if: NULL or empty string
```

**Status:** ⬜ Pass ⬜ Fail
**Notes:** _________________________________

---

#### 2.4 Test Duplicate Phone Prevention
**Action:**
1. Try to submit the same phone number again
2. Tap "Get Free Coffee"

**Expected Result:**
- Error message appears: "Phone number already subscribed"
- Form does not submit
- No new database entry is created

**Verification:**
```sql
SELECT COUNT(*) FROM phone_numbers WHERE phone = '5551234567';
-- Expected: 1 (not 2)
```

**Status:** ⬜ Pass ⬜ Fail
**Notes:** _________________________________

---

### Phase 3: Campaign Submission & Notification

#### 3.1 Check Initial Campaign Count
**Action:** Navigate to "Campaigns" tab in mobile app

**Expected Result:**
- Campaigns screen loads without errors
- If campaigns exist: Shows cards with campaign details
- If no campaigns: Shows "No campaigns yet" message

**Current Count:** _______ campaigns

**Verification:**
```sql
SELECT COUNT(*) FROM campaigns
WHERE is_valid = true AND is_expired = false;
```

**Status:** ⬜ Pass ⬜ Fail

---

#### 3.2 Submit New Campaign via Web Admin
**Action:**
1. Open web admin interface (http://localhost:3000 or production URL)
2. Paste Capital One coffee link in the form
   - Format: `https://coffree.capitalone.com/sms/?cid=XXXXXX&mc=YYYYYY`
3. Click "Send Coffee to All Phones" button

**Expected Result:**
- Web admin shows success message: "Sent to N phone(s)"
- Campaign is validated and stored in database

**Verification:**
```sql
-- Check campaign was created
SELECT campaign_id, marketing_channel, is_valid, is_expired, source, created_at
FROM campaigns
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- - is_valid: true
-- - is_expired: false
-- - source: 'manual'

-- Check SMS was sent
SELECT status, error_message, created_at
FROM message_logs
WHERE phone_number = '5551234567'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: status = 'success' (if campaign is valid)
```

**Campaign ID:** _________________________________
**Status:** ⬜ Pass ⬜ Fail
**Notes:** _________________________________

---

#### 3.3 Verify Push Notification Sent
**Action:** Check notification was triggered by backend

**Expected Result:**
- Backend calls POST /api/notifications/send
- Expo Push API is called with notification payload

**Verification:**
```sql
-- Check if notification was triggered (check backend logs)
-- Expected log entry: "Sent X notification(s)"

-- Verify push token is still valid in database
SELECT push_token FROM phone_numbers WHERE phone = '5551234567';
```

**Backend Logs:**
```
// Expected console output from send-coffee route:
"Sending push notification for new campaign: [campaign_id]"

// Expected response from notifications/send route:
{
  "success": true,
  "message": "Sent 1 notification(s)",
  "sent": 1,
  "failed": 0
}
```

**Status:** ⬜ Pass ⬜ Fail
**Notes:** _________________________________

---

#### 3.4 Receive Push Notification on Mobile
**Action:**
1. Wait 5-10 seconds after campaign submission
2. Check device for push notification

**Expected Result:**
- Push notification appears on device (banner or notification center)
- Title: "☕ New Free Coffee Available!"
- Body: "A new coffee campaign just arrived. Check the app to get your voucher!"
- Notification sound plays (if enabled)

**Troubleshooting if notification doesn't appear:**
- Check device notification settings (Settings → FreeCoffee → Notifications)
- Verify app is NOT in "Do Not Disturb" mode
- Check push token is valid (not null in database)
- Verify backend has NEXT_PUBLIC_BASE_URL configured correctly
- Check Expo Push service status: https://status.expo.dev

**Status:** ⬜ Pass ⬜ Fail
**Time Received:** _________________________________
**Screenshot:** _________________________________

---

#### 3.5 Tap Notification to Open App
**Action:**
1. Tap the push notification

**Expected Result:**
- App opens automatically (launches if closed, or brings to foreground if backgrounded)
- App navigates to "Campaigns" screen (second tab)
- Campaigns screen displays updated campaign list

**Verification:**
- Active tab indicator shows "Campaigns" is selected
- New campaign card appears in the list
- Campaign shows correct details:
  - Campaign ID
  - Marketing Channel
  - "Valid" status indicator
  - Timestamp (e.g., "Just now" or "5 minutes ago")

**Status:** ⬜ Pass ⬜ Fail
**Notes:** _________________________________

---

### Phase 4: Campaign Display in App

#### 4.1 Verify Campaign Appears in List
**Action:**
1. Pull down on Campaigns screen to refresh
2. Observe campaign list

**Expected Result:**
- New campaign card appears at top of list (most recent first)
- Campaign card displays:
  - ✓ "Valid" status badge (green)
  - Campaign ID (e.g., "ID: XXXXXX")
  - Marketing Channel (e.g., "Channel: YYYYYY")
  - Timestamp (e.g., "Just now" or "2 minutes ago")
- Card has coffee-themed styling (#8B4513 brown color)

**Status:** ⬜ Pass ⬜ Fail
**Screenshot:** _________________________________

---

#### 4.2 Test Pull-to-Refresh
**Action:**
1. Pull down on Campaigns screen
2. Release to trigger refresh

**Expected Result:**
- Loading indicator appears briefly
- Campaign list refreshes
- Updated data is displayed (if any changes occurred)

**Status:** ⬜ Pass ⬜ Fail

---

#### 4.3 Check Campaign Count
**Action:** Observe the campaign count in the app

**Expected Result:**
- Campaign count increased by 1 from Phase 3.1
- Count matches database query

**Verification:**
```sql
SELECT COUNT(*) FROM campaigns
WHERE is_valid = true AND is_expired = false;
```

**App Count:** _______
**Database Count:** _______
**Status:** ⬜ Pass ⬜ Fail

---

### Phase 5: Widget Testing

#### 5.1 Add Widget to Home Screen (iOS)
**Action:**
1. Long-press on iOS home screen
2. Tap "+" button (top-left)
3. Search for "FreeCoffee"
4. Select "Campaign Widget"
5. Choose size: Small or Medium
6. Tap "Add Widget"
7. Tap "Done"

**Expected Result:**
- Widget appears on home screen
- Widget displays:
  - "☕ FreeCoffee" header
  - Campaign count (matching app count)
  - "N available" label
  - Distributed count: "X sent" (if any campaigns were sent)
  - Last updated timestamp
- Coffee brown gradient background (#8B4513 → darker brown)

**Status:** ⬜ Pass ⬜ Fail
**Screenshot:** _________________________________

---

#### 5.2 Add Widget to Home Screen (Android)
**Action:**
1. Long-press on Android home screen
2. Tap "Widgets"
3. Scroll to "FreeCoffee"
4. Long-press and drag "Campaign Widget" to home screen
5. Release to place widget
6. Resize widget if desired (horizontal/vertical)

**Expected Result:**
- Widget appears on home screen
- Widget displays:
  - "☕ FreeCoffee" header
  - Campaign count (matching app count)
  - "N campaign(s)" label
  - Distributed count: "X vouchers sent"
  - Last updated timestamp (e.g., "Updated at 3:45 PM")
- Coffee brown gradient background (#8B4513 → #654321)

**Status:** ⬜ Pass ⬜ Fail
**Screenshot:** _________________________________

---

#### 5.3 Verify Widget Data Accuracy
**Action:** Compare widget data with app and database

**Expected Result:**
- Widget campaign count matches Campaigns screen count
- Widget distributed count matches database message_logs success count

**Verification:**
```sql
-- Campaign count (should match widget)
SELECT COUNT(*) FROM campaigns
WHERE is_valid = true AND is_expired = false;

-- Distributed count (should match widget)
SELECT COUNT(*) FROM message_logs
WHERE status = 'success';
```

**Widget Count:** _______
**App Count:** _______
**Database Count:** _______
**Status:** ⬜ Pass ⬜ Fail

---

#### 5.4 Test Widget Deep Linking
**Action:**
1. Tap the widget on home screen

**Expected Result:**
- App opens automatically
- App navigates directly to "Campaigns" screen
- Campaign list is displayed

**Status:** ⬜ Pass ⬜ Fail

---

#### 5.5 Test Widget Auto-Refresh
**Action:**
1. Note widget's current campaign count
2. Submit another campaign via web admin (repeat Phase 3.2)
3. Wait 15-30 minutes (widget refresh interval)
   - iOS: 15 minutes (enforced by system)
   - Android: 30 minutes minimum (system may batch updates)
4. Observe widget count

**Expected Result:**
- Widget count updates to reflect new campaign
- "Last updated" timestamp changes
- No manual refresh needed

**Alternative (Force Refresh):**
- iOS: Remove and re-add widget
- Android: Tap widget to open app, then return to home screen

**Status:** ⬜ Pass ⬜ Fail
**Notes:** _________________________________

---

### Phase 6: Offline Mode Testing

#### 6.1 Test Offline Campaign Display
**Action:**
1. With campaigns loaded, enable Airplane Mode
2. Navigate to Campaigns screen

**Expected Result:**
- Offline indicator appears at top of screen (red banner: "No internet connection")
- Previously loaded campaigns still display from cache
- No error message shown
- Pull-to-refresh shows error if attempted

**Status:** ⬜ Pass ⬜ Fail

---

#### 6.2 Test Background Sync
**Action:**
1. Keep app open while in Airplane Mode
2. Disable Airplane Mode (turn on network)
3. Wait 5 seconds

**Expected Result:**
- Offline indicator disappears automatically
- Background sync occurs silently
- Campaign list updates if new data available
- No user action required

**Status:** ⬜ Pass ⬜ Fail

---

### Phase 7: Subscription Management

#### 7.1 View Subscription in Settings
**Action:**
1. Navigate to "Settings" tab (third tab)
2. Observe subscription status

**Expected Result:**
- Settings screen shows "Your Subscriptions" section
- Phone number displayed (anonymized: XXX-XXX-4567)
- Platform icon displayed (Android robot or Apple logo)
- "Unsubscribe" button is visible

**Status:** ⬜ Pass ⬜ Fail
**Screenshot:** _________________________________

---

#### 7.2 Test Unsubscribe Flow
**Action:**
1. Tap "Unsubscribe" button
2. Confirm in dialog

**Expected Result:**
- Confirmation dialog appears: "Are you sure you want to unsubscribe?"
- After confirming:
  - Phone number is removed from list
  - Success message appears: "Unsubscribed successfully"
  - Empty state displays: "No active subscriptions"

**Verification:**
```sql
SELECT * FROM phone_numbers WHERE phone = '5551234567';
-- Expected: 0 rows (phone was deleted)
```

**Status:** ⬜ Pass ⬜ Fail

---

#### 7.3 Re-Subscribe to Restore Notification Access
**Action:**
1. Navigate back to Home tab
2. Re-enter phone number
3. Submit form

**Expected Result:**
- Phone is re-added to database
- Push token is stored again
- User can receive notifications for future campaigns

**Status:** ⬜ Pass ⬜ Fail

---

## Test Summary

### Results
- Total Test Cases: 27
- Passed: _______
- Failed: _______
- Skipped: _______

### Critical Path Status
- [ ] Phone signup successful
- [ ] Push token stored correctly
- [ ] Campaign triggers notification
- [ ] Notification received on device
- [ ] Campaign appears in app
- [ ] Widget displays correct count

### Known Issues
```
Issue #1: ________________________________________________
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
Reproducible: [ ] Yes [ ] No
Notes: ____________________________________________________

Issue #2: ________________________________________________
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
Reproducible: [ ] Yes [ ] No
Notes: ____________________________________________________
```

---

## Troubleshooting

### Push Notifications Not Received

**Symptoms:** No notification appears after campaign submission

**Possible Causes:**
1. **Push token not stored:**
   ```sql
   SELECT push_token FROM phone_numbers WHERE phone = 'XXXXXXXXXX';
   -- If NULL, app didn't register for notifications
   ```
   **Fix:** Uninstall app, reinstall, accept notification permission

2. **Expo Push service issue:**
   - Check: https://status.expo.dev
   - **Fix:** Wait for service restoration or retry

3. **Backend not triggering notification:**
   - Check backend logs for: "Sending push notification"
   - Check `/api/notifications/send` endpoint is accessible
   - **Fix:** Verify `NEXT_PUBLIC_BASE_URL` environment variable is set

4. **Device notification settings:**
   - iOS: Settings → FreeCoffee → Notifications → Allow Notifications (ON)
   - Android: Settings → Apps → FreeCoffee → Notifications (Enabled)
   - **Fix:** Enable notifications in device settings

5. **Expo Go limitations:**
   - Expo Go may have notification restrictions
   - **Fix:** Use development build or TestFlight/Internal Testing build

---

### Widget Not Displaying Data

**Symptoms:** Widget shows "Loading..." or error state

**Possible Causes:**
1. **API endpoint unreachable:**
   - Widget queries Supabase REST API directly
   - **Fix:** Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set

2. **Network permissions:**
   - iOS: Check Info.plist includes `NSAppTransportSecurity` exception
   - Android: Check AndroidManifest.xml includes `INTERNET` permission
   - **Fix:** Add required permissions (should be included by default)

3. **Widget not installed correctly:**
   - Native widgets require development build (not Expo Go)
   - **Fix:** Build with `npx expo run:ios` or `npx expo run:android`

4. **Data fetch timeout:**
   - Widget has 10-second timeout for API requests
   - **Fix:** Check network connectivity and Supabase response time

---

### App Crashes on Launch

**Symptoms:** App closes immediately after opening

**Possible Causes:**
1. **Missing environment variables:**
   - Check `.env` file exists in mobile/ directory
   - **Fix:** Copy `.env.example` to `.env` and fill in values

2. **Bundle identifier mismatch:**
   - iOS: Check app.json `ios.bundleIdentifier` matches provisioning profile
   - Android: Check app.json `android.package` matches build configuration
   - **Fix:** Update app.json or regenerate with `npx expo prebuild --clean`

3. **Native module linking issue:**
   - Expo modules may not be linked correctly
   - **Fix:** Run `npx expo prebuild --clean` and rebuild

---

### Offline Mode Not Working

**Symptoms:** App shows errors when network is disabled

**Possible Causes:**
1. **Cache not populated:**
   - Cache requires initial data fetch while online
   - **Fix:** Load Campaigns screen while online first, then test offline

2. **AsyncStorage not initialized:**
   - Storage may not be properly configured
   - **Fix:** Check `@react-native-async-storage/async-storage` is installed

3. **Network detection not working:**
   - NetInfo may not be properly linked
   - **Fix:** Reinstall `@react-native-community/netinfo` and rebuild

---

## Appendices

### A. Database Schema Reference

```sql
-- phone_numbers table
CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'apple')),
  push_token TEXT,  -- Expo push token format: ExponentPushToken[xxx]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id TEXT NOT NULL UNIQUE,
  marketing_channel TEXT NOT NULL,
  full_link TEXT NOT NULL,
  source TEXT NOT NULL,  -- 'manual' or 'scraper'
  is_valid BOOLEAN DEFAULT true,
  is_expired BOOLEAN DEFAULT false,
  first_submitted_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- message_logs table
CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id TEXT NOT NULL,
  marketing_channel TEXT NOT NULL,
  link TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### B. API Endpoint Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/phone` | POST | Add phone subscription with push token |
| `/api/phone` | GET | List all subscribed phones |
| `/api/phone?phone=XXX` | DELETE | Remove subscription |
| `/api/send-coffee` | POST | Submit campaign and send to phones |
| `/api/notifications/send` | POST | Send push notifications via Expo |
| `/api/campaigns/count` | GET | Get valid campaign count |
| `/api/logs` | GET | Get message delivery logs |

---

### C. Environment Variables

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

---

### D. Test Data Examples

**Valid Phone Numbers:**
- 555-123-4567 (normalized: 5551234567)
- (555) 987-6543 (normalized: 5559876543)
- 555.111.2222 (normalized: 5551112222)

**Invalid Phone Numbers:**
- 555-123-456 (too short)
- 555-123-45678 (too long)
- 123-456-7890 (may be invalid with Capital One API)

**Sample Campaign Link:**
```
https://coffree.capitalone.com/sms/?cid=ABCD1234&mc=TESTCHANNEL
```

---

## Test Completion Sign-Off

**Tester Name:** _________________________________
**Test Date:** _________________________________
**App Version:** _________________________________
**Device Used:** _________________________________
**OS Version:** _________________________________

**Overall Result:** [ ] Pass [ ] Fail [ ] Pass with Issues

**Approval for Production:** [ ] Approved [ ] Rejected

**Signature:** _________________________________
**Date:** _________________________________

---

## Next Steps After Testing

### If All Tests Pass:
1. ✅ Mark subtask-8-1 as completed in implementation_plan.json
2. ✅ Commit test results and documentation
3. ✅ Proceed to subtask-8-2 (offline mode testing)
4. ✅ Proceed to subtask-8-3 (cross-platform consistency testing)

### If Tests Fail:
1. ❌ Document all failures in "Known Issues" section
2. ❌ Create GitHub issues for each bug found
3. ❌ Fix critical issues before proceeding
4. ❌ Re-run failed test cases after fixes
5. ❌ Update implementation_plan.json with blocker status

---

**End of E2E Test Guide**
