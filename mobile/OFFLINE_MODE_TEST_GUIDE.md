# Offline Mode Testing Guide

## Overview

This guide provides comprehensive testing procedures for the FreeCoffee mobile app's offline capabilities, including:
- **Cache-first data loading**: Instant data display from AsyncStorage
- **Offline access**: Full app functionality without network connection
- **Background sync**: Automatic data synchronization when connection restored
- **Network status detection**: Visual indicators and automatic state management

**Time Estimate**: 20-30 minutes for full test suite

---

## Prerequisites

### Required Environment

- [ ] Physical iOS device (iOS 14+) OR Android device (Android 8.0+)
- [ ] Development build or TestFlight/Internal Testing build installed
- [ ] Backend API server running (verify with `curl http://localhost:3000/api/health`)
- [ ] Supabase database accessible and populated with test campaigns
- [ ] Ability to enable/disable airplane mode on device
- [ ] Ability to view device logs (Xcode Console or Android Logcat)

### Environment Setup

```bash
# Set environment variables
export EXPO_PUBLIC_SUPABASE_URL="your-supabase-url"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
export EXPO_PUBLIC_API_URL="http://localhost:3000"

# Start backend server (if not already running)
npm run dev

# Verify backend is accessible
curl http://localhost:3000/api/health
```

### Test Data Requirements

- At least 3 active campaigns in Supabase `campaigns` table
- All campaigns must have `is_valid=true` and `is_expired=false`
- Campaigns should have recent timestamps to verify sync updates

---

## Test Phases

### Phase 1: Initial Cache Population

**Objective**: Verify app loads data and populates cache

#### Test 1.1: Fresh Install - No Cache

**Steps**:
1. Uninstall app from device (to clear all AsyncStorage)
2. Reinstall app
3. Ensure device has active network connection (WiFi or cellular)
4. Open app and navigate to **Campaigns** tab
5. Observe loading behavior

**Expected Results**:
- ✅ Loading spinner appears immediately
- ✅ Campaigns load from network within 2-3 seconds
- ✅ Campaign cards display with correct data (store name, voucher amount, expires date)
- ✅ Campaign count matches database (verify with SQL query below)
- ✅ No offline indicator visible at top of screen

**Database Verification**:
```sql
SELECT COUNT(*) FROM campaigns
WHERE is_valid = true AND is_expired = false;
```

**Cache Verification** (check device logs):
```
Look for: "Successfully cached campaigns" or similar AsyncStorage write message
```

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Record any issues or observations]
```

---

#### Test 1.2: Second Load - Cache Available

**Steps**:
1. Close app completely (swipe away from recent apps)
2. Wait 5 seconds
3. Reopen app
4. Navigate to **Campaigns** tab immediately

**Expected Results**:
- ✅ Campaigns appear **instantly** (no loading spinner)
- ✅ Data displayed is from cache (same campaigns as before)
- ✅ Background network fetch occurs (may not be visible to user)
- ✅ Data updates if backend has new campaigns

**Cache-First Strategy Verification**:
- Data should appear in <100ms (instant)
- No "empty state" or "loading" visible
- User can interact with campaigns immediately

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Record load time and any delays]
```

---

### Phase 2: Offline Access

**Objective**: Verify app remains functional without network connection

#### Test 2.1: Enter Offline Mode

**Steps**:
1. Ensure campaigns are loaded and visible
2. Enable **Airplane Mode** on device
3. Observe app behavior

**Expected Results**:
- ✅ **Offline indicator** appears at top of screen (red banner: "⚠️ No internet connection")
- ✅ Offline indicator slides in with smooth animation (300ms)
- ✅ Campaigns remain visible (no disappearing data)
- ✅ No error messages displayed
- ✅ All campaign data readable (store names, amounts, expiry dates)

**Visual Verification**:
- Offline indicator background: `#dc2626` (red)
- Text color: white (`#fff`)
- Position: Top of screen, above tab navigation
- Icon: ⚠️ warning emoji

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Screenshot of offline indicator recommended]
```

---

#### Test 2.2: Navigation While Offline

**Steps**:
1. While in airplane mode, navigate between tabs:
   - **Home** → **Campaigns** → **Settings** → **Home**
2. Scroll through campaign list
3. Tap on campaign cards (if clickable)

**Expected Results**:
- ✅ Tab navigation works smoothly
- ✅ Campaigns tab shows cached campaigns
- ✅ Home tab displays subscription form (may show error on submit)
- ✅ Settings tab shows subscribed phones (if previously loaded)
- ✅ No app crashes or freezes
- ✅ Offline indicator remains visible on all tabs

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Record any navigation issues]
```

---

#### Test 2.3: Pull-to-Refresh While Offline

**Steps**:
1. While in airplane mode, go to **Campaigns** tab
2. Pull down to refresh (swipe down gesture)
3. Release to trigger refresh

**Expected Results**:
- ✅ Pull-to-refresh gesture works
- ✅ Loading spinner appears briefly
- ✅ Refresh fails gracefully (network error)
- ✅ Cached campaigns remain visible (no data loss)
- ✅ Error message optional (can be silent failure)
- ✅ Offline indicator remains visible

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Note user feedback during failed refresh]
```

---

#### Test 2.4: App Restart While Offline

**Steps**:
1. With airplane mode still enabled, close app completely
2. Wait 5 seconds
3. Reopen app
4. Navigate to **Campaigns** tab

**Expected Results**:
- ✅ App launches successfully
- ✅ Offline indicator appears immediately on launch
- ✅ Campaigns load from cache (instant display)
- ✅ No network error alerts or crashes
- ✅ Data integrity maintained (same campaigns as before)

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Verify cold start behavior]
```

---

### Phase 3: Background Sync

**Objective**: Verify automatic sync when connection restored

#### Test 3.1: Simple Reconnection

**Steps**:
1. Ensure airplane mode is enabled and app is open
2. Campaigns visible from cache
3. **Disable airplane mode** (restore network connection)
4. Wait 2-5 seconds
5. Observe app behavior

**Expected Results**:
- ✅ Offline indicator **disappears** (slides up with animation)
- ✅ Background sync triggered automatically
- ✅ Campaigns refresh with latest data from server
- ✅ No user action required (automatic)
- ✅ Smooth transition (no jarring UI changes)

**Network Sync Verification** (check device logs):
```
Look for:
- "Network restored, performing background sync"
- "Successfully synced campaigns"
- "Background sync completed"
```

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Record sync time and any delays]
```

---

#### Test 3.2: Reconnection with New Campaign

**Steps**:
1. Enable airplane mode with app open showing campaigns
2. While offline, use **web admin** or **API** to add a new campaign:
   ```bash
   curl -X POST http://localhost:3000/api/send-coffee \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://capitalone.com/coffee-test-123",
       "source": "test"
     }'
   ```
3. Verify campaign created in Supabase:
   ```sql
   SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 1;
   ```
4. Return to mobile app (still offline)
5. Verify **new campaign NOT visible** (expected - offline)
6. **Disable airplane mode**
7. Wait 5 seconds for background sync
8. Check campaigns list

**Expected Results**:
- ✅ While offline: New campaign NOT visible (cache shows old data)
- ✅ After reconnection: Background sync triggered
- ✅ New campaign appears in list within 5 seconds
- ✅ Campaign list updates automatically (no manual refresh needed)
- ✅ New campaign displayed correctly (all fields populated)
- ✅ Campaign count increments by 1

**Sync Timing**:
- Expected sync time: 2-5 seconds after reconnection
- If sync takes >10 seconds, investigate network or API issues

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Record new campaign details and sync timing]
```

---

#### Test 3.3: Reconnection with Campaign Update

**Steps**:
1. Note a specific campaign in the list (e.g., "Starbucks - $5 off")
2. Enable airplane mode
3. While offline, **update** that campaign in Supabase (e.g., change amount):
   ```sql
   UPDATE campaigns
   SET voucher_amount = 10
   WHERE id = 'campaign-id-here';
   ```
4. Return to mobile app (still offline)
5. Verify campaign still shows **old amount** (from cache)
6. **Disable airplane mode**
7. Wait for background sync
8. Check if campaign amount updated

**Expected Results**:
- ✅ While offline: Campaign shows old amount (cached)
- ✅ After reconnection: Background sync fetches updated data
- ✅ Campaign amount updates to new value
- ✅ No duplicate campaigns displayed
- ✅ UI updates smoothly (no flickering)

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Record update behavior and timing]
```

---

#### Test 3.4: Reconnection with Campaign Deletion

**Steps**:
1. Note total campaign count (e.g., 3 campaigns visible)
2. Enable airplane mode
3. While offline, **delete** a campaign or mark as expired:
   ```sql
   UPDATE campaigns
   SET is_expired = true
   WHERE id = 'campaign-id-here';
   ```
4. Return to mobile app (still offline)
5. Verify campaign **still visible** (from cache)
6. **Disable airplane mode**
7. Wait for background sync
8. Check campaigns list

**Expected Results**:
- ✅ While offline: All 3 campaigns visible (cached)
- ✅ After reconnection: Background sync updates cache
- ✅ Deleted/expired campaign **removed from list**
- ✅ Campaign count decrements by 1 (now 2 campaigns)
- ✅ No empty state shown (remaining campaigns visible)

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Record deletion sync behavior]
```

---

### Phase 4: Cache Expiration

**Objective**: Verify cache expiration after 15 minutes

#### Test 4.1: Cache Validity Check

**Steps**:
1. Load campaigns while online (cache populated)
2. Enable airplane mode
3. Keep app closed for **16 minutes** (past 15-minute expiration)
4. Reopen app while **still offline**
5. Navigate to Campaigns tab

**Expected Results**:
- ✅ Cached data shown even if "expired" (graceful degradation)
- ✅ Offline indicator visible
- ✅ No error message about expired cache
- ✅ App prioritizes showing stale data over showing nothing

**Cache Expiration Strategy**:
- Cache expiration is 15 minutes (900,000 ms)
- Expired cache is still used if network unavailable
- Fresh data fetched when network available

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Test requires 16+ minute wait time]
```

---

#### Test 4.2: Cache Refresh After Expiration

**Steps**:
1. Continue from Test 4.1 (cache expired, offline)
2. **Disable airplane mode** (restore network)
3. Wait for background sync
4. Observe campaign data

**Expected Results**:
- ✅ Background sync triggered immediately
- ✅ Fresh data fetched from API
- ✅ Cache updated with new expiration time
- ✅ Campaigns display latest data
- ✅ Cache valid for next 15 minutes

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Verify cache refresh behavior]
```

---

### Phase 5: Pending Sync Operations

**Objective**: Verify queued operations sync when connection restored

#### Test 5.1: Queue Sync Operation While Offline

**Steps**:
1. Enable airplane mode
2. Go to **Home** tab
3. Try to subscribe a new phone number
4. Observe behavior

**Expected Results**:
- ✅ Form submission fails gracefully
- ✅ Error message displayed (e.g., "Network error, please try again")
- ✅ Operation can be queued for later sync (optional feature)
- ✅ No app crash or data corruption

**Note**: This test verifies error handling. Pending sync queue implementation may vary based on feature scope.

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Record offline submission behavior]
```

---

### Phase 6: Network Transition Scenarios

**Objective**: Test various network transition scenarios

#### Test 6.1: WiFi to Cellular Transition

**Steps**:
1. Connect device to WiFi
2. Load campaigns
3. Disable WiFi (but keep cellular data enabled)
4. Observe app behavior

**Expected Results**:
- ✅ Seamless transition (no offline indicator if cellular works)
- ✅ Background sync continues on cellular
- ✅ Campaigns refresh successfully
- ✅ No interruption to user experience

**Pass/Fail**: ⬜ Pass ⬜ Fail

---

#### Test 6.2: Cellular to WiFi Transition

**Steps**:
1. Connect device to cellular data only (WiFi off)
2. Load campaigns
3. Enable WiFi (better connection)
4. Observe app behavior

**Expected Results**:
- ✅ Smooth transition to WiFi
- ✅ Background sync triggered on better connection
- ✅ Data refreshes
- ✅ No offline indicator

**Pass/Fail**: ⬜ Pass ⬜ Fail

---

#### Test 6.3: Intermittent Connection (Flaky Network)

**Steps**:
1. Rapidly toggle airplane mode on/off multiple times:
   - On → Wait 2s → Off → Wait 2s → On → Wait 2s → Off
2. Observe offline indicator and sync behavior

**Expected Results**:
- ✅ Offline indicator appears/disappears correctly
- ✅ No app crash during rapid transitions
- ✅ Background sync triggered only when stable connection
- ✅ No duplicate sync operations
- ✅ Data integrity maintained

**Pass/Fail**: ⬜ Pass ⬜ Fail

**Notes**:
```
[Test app resilience to flaky networks]
```

---

### Phase 7: Stress Testing

**Objective**: Verify offline mode under edge cases

#### Test 7.1: Large Campaign List Offline

**Steps**:
1. Ensure database has 20+ campaigns (create test data if needed)
2. Load all campaigns while online (populate cache)
3. Enable airplane mode
4. Scroll through entire campaign list

**Expected Results**:
- ✅ All campaigns load from cache
- ✅ Smooth scrolling performance (no lag)
- ✅ No memory issues or crashes
- ✅ Images/data render correctly

**Pass/Fail**: ⬜ Pass ⬜ Fail

---

#### Test 7.2: Cold Start with No Network

**Steps**:
1. Enable airplane mode
2. Force quit app
3. Wait 10 seconds
4. Reopen app (cold start)

**Expected Results**:
- ✅ App launches successfully
- ✅ Offline indicator appears immediately
- ✅ Cached data loads (from previous session)
- ✅ No splash screen errors
- ✅ Home screen accessible

**Pass/Fail**: ⬜ Pass ⬜ Fail

---

#### Test 7.3: Background App State During Reconnection

**Steps**:
1. Enable airplane mode with app open
2. Press home button (app goes to background)
3. Wait 5 seconds
4. Disable airplane mode (while app in background)
5. Wait 10 seconds
6. Reopen app (bring to foreground)

**Expected Results**:
- ✅ Background sync occurred while app backgrounded
- ✅ Fresh data visible when app reopened
- ✅ Offline indicator correctly reflects network state
- ✅ No stale data displayed

**Pass/Fail**: ⬜ Pass ⬜ Fail

---

## Device Log Verification

### iOS Logs (Xcode Console)

```bash
# Connect device to Mac, open Xcode
# Window → Devices and Simulators → Select Device → Open Console
# Filter by "freecoffee" or "expo"

Look for:
- "Network state changed: online/offline"
- "Performing background sync"
- "Successfully synced campaigns"
- "Cache loaded: X campaigns"
- "AsyncStorage: Successfully stored campaigns"
```

### Android Logs (Logcat)

```bash
# Connect device via USB with USB debugging enabled
adb logcat | grep -E "(freecoffee|network|sync|cache)"

Look for:
- "NetworkSync: Connection restored"
- "NetworkSync: Performing background sync"
- "CampaignService: Fetched X campaigns"
- "AsyncStorage: Cached campaigns updated"
```

---

## Database Verification Queries

### Check Campaign Count

```sql
SELECT COUNT(*) as total_campaigns
FROM campaigns
WHERE is_valid = true AND is_expired = false;
```

### Check Recent Campaigns

```sql
SELECT id, store_name, voucher_amount, created_at, expires_at
FROM campaigns
WHERE is_valid = true AND is_expired = false
ORDER BY created_at DESC
LIMIT 10;
```

### Verify Campaign Data Integrity

```sql
SELECT
  id,
  store_name,
  voucher_amount,
  voucher_code,
  campaign_url,
  is_valid,
  is_expired,
  created_at
FROM campaigns
WHERE is_valid = true AND is_expired = false;
```

---

## Troubleshooting

### Issue: Offline Indicator Not Appearing

**Possible Causes**:
- Network monitor not initialized
- OfflineIndicator component not rendered
- Network state not updating

**Solutions**:
1. Check `_layout.tsx` for `initializeNetworkSync()` call
2. Verify `OfflineIndicator` component imported and rendered
3. Check device logs for network state changes

### Issue: Background Sync Not Triggering

**Possible Causes**:
- Network listener not registered
- Background sync logic failing silently
- API endpoint unreachable

**Solutions**:
1. Verify API server running: `curl http://localhost:3000/api/health`
2. Check device logs for sync errors
3. Verify Supabase credentials in `.env` file
4. Test manual sync by pulling to refresh

### Issue: Cached Data Not Loading

**Possible Causes**:
- AsyncStorage permission issues
- Cache keys incorrect
- Data not serialized properly

**Solutions**:
1. Check device logs for AsyncStorage errors
2. Verify `STORAGE_KEYS.CAMPAIGNS` constant value
3. Clear app data and reinstall
4. Test with simple data first

### Issue: Campaigns Not Updating After Reconnection

**Possible Causes**:
- Background sync failed
- API not returning updated data
- Cache not being updated

**Solutions**:
1. Check API response: `curl http://localhost:3000/api/campaigns`
2. Verify Supabase RLS policies allow reading campaigns
3. Check device logs for sync errors
4. Manual pull-to-refresh to force sync

### Issue: App Crashes When Offline

**Possible Causes**:
- Network error not caught
- Null pointer exception on missing data
- AsyncStorage read/write error

**Solutions**:
1. Check crash logs in Xcode/Logcat
2. Verify error handling in `useCampaigns.ts`
3. Add try-catch blocks around network calls
4. Test with mock data to isolate issue

---

## Success Criteria

### Required (Must Pass)

- ✅ **Test 1.1**: Fresh install loads campaigns from network
- ✅ **Test 1.2**: Second load shows instant cache data
- ✅ **Test 2.1**: Offline indicator appears when offline
- ✅ **Test 2.2**: Navigation works while offline
- ✅ **Test 2.4**: App restarts while offline without crashes
- ✅ **Test 3.1**: Background sync triggered on reconnection
- ✅ **Test 3.2**: New campaigns sync after reconnection

### Recommended (Should Pass)

- ✅ **Test 2.3**: Pull-to-refresh fails gracefully offline
- ✅ **Test 3.3**: Campaign updates sync correctly
- ✅ **Test 3.4**: Campaign deletions sync correctly
- ✅ **Test 6.3**: Handles intermittent connections

### Optional (Nice to Have)

- ✅ **Test 4.1**: Expired cache still used offline
- ✅ **Test 5.1**: Pending operations queued
- ✅ **Test 7.1**: Large lists perform well offline
- ✅ **Test 7.3**: Background sync works while app backgrounded

---

## Test Sign-Off

**Tester Name**: ________________________

**Date**: ________________________

**Test Environment**:
- Device: ________________________
- OS Version: ________________________
- App Version: ________________________
- Build Type: Development / TestFlight / Internal Testing

**Summary**:
- Total Tests: 20
- Passed: ____
- Failed: ____
- Skipped: ____

**Critical Issues Found**:
```
[List any blocking issues that prevent offline mode from working]
```

**Non-Critical Issues Found**:
```
[List minor issues or improvements]
```

**Overall Verdict**: ⬜ Pass ⬜ Fail ⬜ Pass with Conditions

**Conditions** (if applicable):
```
[Describe any conditions or known limitations]
```

**Approval**: ⬜ Approved for Production ⬜ Needs Fixes

**Signature**: ________________________
