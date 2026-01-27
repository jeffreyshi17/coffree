# Offline Mode Testing - Quick Checklist

**Time Estimate**: 10-15 minutes

---

## Pre-Test Setup

- [ ] Backend API running (`curl http://localhost:3000/api/health`)
- [ ] Supabase has 3+ active campaigns
- [ ] Device has network access
- [ ] App installed (development build or TestFlight/Internal Testing)

---

## ✅ Phase 1: Cache Population

### 1.1 Fresh Install
- [ ] Uninstall → Reinstall → Open app
- [ ] Navigate to Campaigns tab
- [ ] **Expected**: Loading spinner → Campaigns load (2-3s) → Cache populated

### 1.2 Cache Hit
- [ ] Close app → Reopen → Campaigns tab
- [ ] **Expected**: Campaigns appear **instantly** (<100ms, no spinner)

---

## ✅ Phase 2: Offline Access

### 2.1 Enter Offline Mode
- [ ] Enable airplane mode
- [ ] **Expected**: Red offline indicator appears at top (⚠️ No internet connection)
- [ ] **Expected**: Campaigns remain visible (from cache)

### 2.2 Navigate While Offline
- [ ] Switch tabs: Home → Campaigns → Settings → Home
- [ ] **Expected**: Tab navigation works, campaigns visible, no crashes

### 2.3 Pull-to-Refresh Offline
- [ ] On Campaigns tab, pull down to refresh
- [ ] **Expected**: Refresh fails gracefully, cached data remains visible

### 2.4 App Restart Offline
- [ ] Force quit app → Reopen (airplane mode still on)
- [ ] **Expected**: App launches, offline indicator shows, cached campaigns load instantly

---

## ✅ Phase 3: Background Sync

### 3.1 Simple Reconnection
- [ ] With app open and offline indicator visible
- [ ] Disable airplane mode
- [ ] **Expected**: Offline indicator disappears (2-5s), background sync triggered automatically

### 3.2 New Campaign Sync
- [ ] Enable airplane mode
- [ ] Add new campaign via API:
  ```bash
  curl -X POST http://localhost:3000/api/send-coffee \
    -H "Content-Type: application/json" \
    -d '{"url": "https://capitalone.com/coffee-test", "source": "test"}'
  ```
- [ ] Verify campaign created: `SELECT COUNT(*) FROM campaigns;`
- [ ] Return to app (still offline) → New campaign NOT visible (expected)
- [ ] Disable airplane mode → Wait 5s
- [ ] **Expected**: New campaign appears in list, count increments

### 3.3 Campaign Update Sync
- [ ] Note a campaign's voucher amount (e.g., $5)
- [ ] Enable airplane mode
- [ ] Update campaign in Supabase: `UPDATE campaigns SET voucher_amount = 10 WHERE id = 'xxx';`
- [ ] App still shows old amount (expected - cached)
- [ ] Disable airplane mode → Wait 5s
- [ ] **Expected**: Campaign updates to new amount ($10)

### 3.4 Campaign Deletion Sync
- [ ] Note campaign count (e.g., 3 campaigns)
- [ ] Enable airplane mode
- [ ] Delete/expire campaign: `UPDATE campaigns SET is_expired = true WHERE id = 'xxx';`
- [ ] App still shows deleted campaign (expected - cached)
- [ ] Disable airplane mode → Wait 5s
- [ ] **Expected**: Deleted campaign removed from list, count decrements (now 2)

---

## ✅ Phase 4: Network Transitions

### 4.1 WiFi ↔ Cellular
- [ ] Load campaigns on WiFi
- [ ] Switch to cellular data (disable WiFi)
- [ ] **Expected**: Seamless transition, no offline indicator (if cellular works)

### 4.2 Intermittent Connection
- [ ] Rapidly toggle airplane mode: On → Off → On → Off (4-5 times)
- [ ] **Expected**: No crashes, offline indicator toggles correctly, data integrity maintained

---

## ✅ Phase 5: Stress Tests

### 5.1 Large Campaign List
- [ ] Ensure 20+ campaigns in database
- [ ] Load while online → Enable airplane mode
- [ ] Scroll through entire list
- [ ] **Expected**: Smooth scrolling, no lag, all campaigns visible from cache

### 5.2 Cold Start Offline
- [ ] Enable airplane mode → Force quit app → Wait 10s → Reopen
- [ ] **Expected**: App launches, offline indicator shows, cached data loads

---

## Database Quick Checks

```sql
-- Campaign count
SELECT COUNT(*) FROM campaigns WHERE is_valid = true AND is_expired = false;

-- Recent campaigns
SELECT store_name, voucher_amount, created_at
FROM campaigns
WHERE is_valid = true AND is_expired = false
ORDER BY created_at DESC LIMIT 5;
```

---

## Device Log Keywords

**iOS (Xcode Console)**:
- "Network state changed"
- "Performing background sync"
- "Cache loaded"
- "AsyncStorage: Successfully stored"

**Android (Logcat)**:
```bash
adb logcat | grep -E "(NetworkSync|cache|offline)"
```

---

## Pass/Fail Criteria

### Critical (Must Pass)
- ✅ **Phase 1.2**: Instant cache load on second open
- ✅ **Phase 2.1**: Offline indicator appears
- ✅ **Phase 2.4**: App works offline after restart
- ✅ **Phase 3.1**: Background sync on reconnection
- ✅ **Phase 3.2**: New campaigns sync after reconnection

### Important (Should Pass)
- ✅ **Phase 2.2**: Navigation works offline
- ✅ **Phase 3.3**: Campaign updates sync
- ✅ **Phase 3.4**: Campaign deletions sync
- ✅ **Phase 4.2**: Handles intermittent connections

---

## Issue Tracking

### Critical Issues
```
[Issues that block offline mode functionality]
```

### Minor Issues
```
[Non-blocking issues or improvements]
```

---

## Test Results

**Device**: _______________
**OS**: _______________
**Date**: _______________

**Status**: ⬜ Pass ⬜ Fail ⬜ Pass with Conditions

**Tests Passed**: ____ / 16

**Tester**: _______________

**Notes**:
```
[Additional observations or comments]
```
