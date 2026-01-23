# Cross-Platform Quick Checklist
## FreeCoffee Mobile App (iOS vs Android)

Fast verification checklist for experienced testers. For detailed instructions, see `CROSS_PLATFORM_TEST_GUIDE.md`.

**Duration:** ~15-20 minutes
**Requirements:** Physical iOS device (iOS 14+) AND physical Android device (Android 8.0+)

---

## Pre-Test Setup

- [ ] Both devices connected to same WiFi network
- [ ] TestFlight build on iOS, Internal Testing build on Android
- [ ] Backend API server running and accessible
- [ ] Supabase database accessible
- [ ] Clear existing test data from both devices

---

## Visual Consistency (5 min)

### App Launch & Navigation
- [ ] Splash screen: Same coffee brown color (#8B4513) on both
- [ ] Tab bar: 3 tabs (Home, Campaigns, Settings) with same icons/colors
- [ ] Active tab: Coffee brown (#8B4513) on both
- [ ] Tab transitions: Smooth on both platforms

### Home Screen (Subscription Form)
- [ ] Title: "FreeCoffee" with coffee brown color
- [ ] Phone input: Same placeholder format (555) 555-5555
- [ ] Platform selector: Android/Apple buttons styled identically
- [ ] Subscribe button: Same orange color (#d97706)
- [ ] Layout: Spacing and alignment consistent

### Campaigns Screen
- [ ] Campaign cards: Same layout, colors, shadows
- [ ] Coffee emoji (☕) displays on both
- [ ] Timestamp format: "X time ago" matches
- [ ] Card spacing: 12-16px consistent
- [ ] Scrolling: Smooth on both

### Settings Screen
- [ ] Section headers: Same styling
- [ ] Phone display: Same anonymization (XXX) XXX-XX
- [ ] Platform icons: Android robot, Apple logo visible
- [ ] Unsubscribe button: Red color matches

**Visual Score:** ___/10 [ ] Pass [ ] Fail

---

## Feature Parity (7 min)

### Phone Subscription
- [ ] iOS: Subscribe with `555-TEST-iOS`, platform **Apple**
- [ ] Android: Subscribe with `555-TEST-Android`, platform **Android**
- [ ] Both: Success message appears (identical text)
- [ ] Both: Form resets after submission
- [ ] Database: Both phones stored with push tokens

```sql
-- Verify both subscriptions
SELECT phone, platform, push_token FROM phone_numbers WHERE phone LIKE '%TEST%';
-- Expected: 2 rows
```

### Campaign List Loading
- [ ] iOS: Navigate to Campaigns tab, count campaigns
- [ ] Android: Navigate to Campaigns tab, count campaigns
- [ ] Both: Same campaign count displayed
- [ ] Both: Same campaign order (newest first)
- [ ] Both: Same timestamp formatting

```sql
-- Verify campaign count
SELECT COUNT(*) FROM campaigns WHERE is_valid = true AND is_expired = false;
```

### Pull-to-Refresh
- [ ] iOS: Pull down Campaigns list → refresh indicator → data updates
- [ ] Android: Pull down Campaigns list → refresh indicator → data updates
- [ ] Both: Same animation style and color (coffee brown)
- [ ] Both: Refresh completes in 1-2 seconds

### Subscription Management
- [ ] iOS: Settings → Unsubscribe → Confirm → Subscription removed
- [ ] Android: Settings → Unsubscribe → Confirm → Subscription removed
- [ ] Both: Confirmation dialog appears with same text
- [ ] Database: Both phones deleted

```sql
-- Verify deletions
SELECT phone FROM phone_numbers WHERE phone LIKE '%TEST%';
-- Expected: 0 rows
```

**Feature Parity Score:** ___/10 [ ] Pass [ ] Fail

---

## Platform-Specific Features (5 min)

### Push Notifications
**Setup:** Re-subscribe both devices with new test phones

- [ ] iOS: Trigger campaign → notification received → tap opens to Campaigns
- [ ] Android: Trigger campaign → notification received → tap opens to Campaigns
- [ ] Both: Title "☕ New Free Coffee Available!"
- [ ] Both: Body "A new coffee campaign just arrived..."
- [ ] Both: Deep link navigation works correctly

```sql
-- Verify push tokens
SELECT phone, push_token FROM phone_numbers WHERE phone LIKE '%[new-test]%';
-- Both should have non-null push_token
```

### Home Screen Widgets
**Note:** Requires development builds (not TestFlight/Expo Go)

- [ ] iOS: Add widget → displays campaign count → tap opens Campaigns
- [ ] Android: Add widget → displays campaign count → tap opens Campaigns
- [ ] Both: Coffee brown gradient background
- [ ] Both: Correct count matches database
- [ ] Both: Widget updates automatically

```sql
-- Widget should display this count
SELECT COUNT(*) FROM campaigns WHERE is_valid = true AND is_expired = false;
```

**Platform Features Score:** ___/10 [ ] Pass [ ] Fail [ ] N/A (widgets)

---

## Offline Mode (3 min)

### Offline Behavior
- [ ] iOS: Load campaigns → airplane mode ON → offline indicator appears
- [ ] Android: Load campaigns → airplane mode ON → offline indicator appears
- [ ] Both: Red banner at top with "No internet connection"
- [ ] Both: Campaigns still visible from cache
- [ ] Both: Navigation works (all tabs accessible)
- [ ] Both: Pull-to-refresh fails gracefully (no crash)

### Online Recovery
- [ ] iOS: Airplane mode OFF → indicator disappears → auto-sync (~5s)
- [ ] Android: Airplane mode OFF → indicator disappears → auto-sync (~5s)
- [ ] Both: Background sync completes successfully
- [ ] Both: Data updates automatically

**Offline Mode Score:** ___/10 [ ] Pass [ ] Fail

---

## Performance (2 min)

### Launch Time
- [ ] iOS: Close app → launch → time to interactive: ___s (target: 1-3s)
- [ ] Android: Close app → launch → time to interactive: ___s (target: 1-3s)
- [ ] Difference: <1 second acceptable

### Scrolling (20+ campaigns)
- [ ] iOS: Rapid scroll → smoothness rating: ___/5 (target: 4-5)
- [ ] Android: Rapid scroll → smoothness rating: ___/5 (target: 4-5)
- [ ] Both: No visible frame drops or stuttering

### Form Interaction
- [ ] iOS: Keyboard appears instantly, formatting real-time, buttons responsive
- [ ] Android: Keyboard appears instantly, formatting real-time, buttons responsive
- [ ] Both: No lag or delays

**Performance Score:** ___/10 [ ] Pass [ ] Fail

---

## Error Handling (2 min)

### Network Errors
- [ ] iOS: Airplane mode ON → subscribe attempt → clear error message
- [ ] Android: Airplane mode ON → subscribe attempt → clear error message
- [ ] Both: Error message text identical or equivalent
- [ ] Both: Retry after reconnection succeeds

### Input Validation
- [ ] iOS: Invalid phone "123" → submit → validation error
- [ ] Android: Invalid phone "123" → submit → validation error
- [ ] Both: Missing platform selection → validation error
- [ ] Both: Error messages clear and consistent

**Error Handling Score:** ___/10 [ ] Pass [ ] Fail

---

## Critical Issues Tracker

### Blocking Issues (Must Fix Before Release)
1. [ ] ____________________________________________________________
2. [ ] ____________________________________________________________
3. [ ] ____________________________________________________________

### Minor Issues (Nice to Fix)
1. [ ] ____________________________________________________________
2. [ ] ____________________________________________________________
3. [ ] ____________________________________________________________

---

## Quick Database Checks

```sql
-- Campaign count (should match widget and app display)
SELECT COUNT(*) FROM campaigns WHERE is_valid = true AND is_expired = false;

-- Distributed vouchers (should match widget display)
SELECT COUNT(*) FROM message_logs WHERE status = 'success';

-- Active subscriptions (clean up test data)
SELECT phone, platform, push_token IS NOT NULL as has_token
FROM phone_numbers
ORDER BY created_at DESC;

-- Recent notifications (verify push delivery)
SELECT campaign_id, phone_number, status, created_at
FROM message_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## Final Decision Matrix

| Category | iOS Score | Android Score | Pass? |
|----------|-----------|---------------|-------|
| Visual Consistency | ___/10 | ___/10 | [ ] |
| Feature Parity | ___/10 | ___/10 | [ ] |
| Platform Features | ___/10 | ___/10 | [ ] |
| Offline Mode | ___/10 | ___/10 | [ ] |
| Performance | ___/10 | ___/10 | [ ] |
| Error Handling | ___/10 | ___/10 | [ ] |
| **Overall Average** | **___/10** | **___/10** | **[ ]** |

**Pass Criteria:**
- ✅ **Pass:** All categories ≥7/10, no blocking issues
- ⚠️ **Pass with Caveats:** Average ≥7/10, minor issues documented
- ❌ **Fail:** Any category <7/10 or blocking issues present

---

## Test Sign-Off

**Tester:** __________________ **Date:** __________

**iOS Device:** _________ (Model, iOS Version)

**Android Device:** _________ (Model, Android Version)

**Overall Result:** [ ] PASS [ ] FAIL

**Recommendation:**
- [ ] Approve both platforms for production
- [ ] Approve iOS only (Android needs fixes)
- [ ] Approve Android only (iOS needs fixes)
- [ ] Block both (critical issues)

**Notes:**
____________________________________________________________________
____________________________________________________________________

**Signature:** __________________

---

## Post-Test Cleanup

```sql
-- Clean up test data
DELETE FROM phone_numbers WHERE phone LIKE '%TEST%';
DELETE FROM phone_numbers WHERE phone LIKE '%555-1234%';
DELETE FROM phone_numbers WHERE phone LIKE '%555-2345%';

-- Verify cleanup
SELECT COUNT(*) FROM phone_numbers;
```

---

**For detailed test procedures, see:** `CROSS_PLATFORM_TEST_GUIDE.md`

**For automated verification, run:** `./cross-platform-verify.sh`

**For documentation overview, see:** `CROSS_PLATFORM_README.md`
