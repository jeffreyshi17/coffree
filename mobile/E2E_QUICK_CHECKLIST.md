# E2E Quick Verification Checklist

## Pre-Test Setup
- [ ] Backend server running at `$EXPO_PUBLIC_API_URL`
- [ ] Supabase database accessible
- [ ] Mobile app installed on physical device (iOS 14+ or Android 8.0+)
- [ ] Capital One campaign link ready for testing

## Automated Verification
```bash
cd mobile
./e2e-verify.sh
```

Expected output: "✓ System ready for E2E testing"

---

## Manual Test Steps

### Phase 1: Installation (5 min)
- [ ] App installs without errors
- [ ] App launches successfully
- [ ] Notification permission prompt appears and is accepted

### Phase 2: Subscription (5 min)
- [ ] Phone number input accepts formatting
- [ ] Platform selector works (Android/Apple)
- [ ] Submit button triggers loading state
- [ ] Success modal appears with voucher count
- [ ] Phone appears in Supabase with push token
- [ ] Duplicate submission shows error

**Verification:**
```bash
# Check phone was added with push token
./e2e-verify.sh
```

### Phase 3: Campaign & Notification (10 min)
- [ ] Campaign submitted via web admin
- [ ] Push notification appears on device within 10 seconds
- [ ] Notification title: "☕ New Free Coffee Available!"
- [ ] Tap notification opens app to Campaigns screen
- [ ] Campaign card appears in list with correct details

**Verification:**
```sql
-- Check campaign was created
SELECT * FROM campaigns WHERE is_valid = true ORDER BY created_at DESC LIMIT 1;

-- Check message was sent
SELECT * FROM message_logs WHERE status = 'success' ORDER BY created_at DESC LIMIT 1;
```

### Phase 4: Campaign Display (5 min)
- [ ] Campaigns screen shows all valid campaigns
- [ ] Pull-to-refresh updates data
- [ ] Campaign count matches database
- [ ] Card styling is coffee-themed (#8B4513)

### Phase 5: Widget (10 min)
- [ ] Widget added to home screen successfully
- [ ] Widget displays campaign count (matches app)
- [ ] Widget shows distributed count
- [ ] Last updated timestamp appears
- [ ] Tapping widget opens app to Campaigns screen
- [ ] Widget auto-refreshes after 15-30 minutes

### Phase 6: Offline Mode (5 min)
- [ ] Enable Airplane Mode
- [ ] Offline indicator appears (red banner)
- [ ] Campaigns still visible from cache
- [ ] Disable Airplane Mode
- [ ] Offline indicator disappears
- [ ] Background sync occurs automatically

### Phase 7: Settings (5 min)
- [ ] Settings screen shows subscribed phone (anonymized)
- [ ] Platform icon displayed correctly
- [ ] Unsubscribe button works with confirmation
- [ ] Phone removed from database after unsubscribe
- [ ] Re-subscribe works successfully

---

## Success Criteria

### Critical Path (Must Pass)
✅ All 7 phases completed without errors
✅ Push notification received within 10 seconds
✅ Campaign appears in app immediately after notification
✅ Widget displays accurate campaign count
✅ Offline mode works with cache and sync
✅ Phone stored with push token in database

### Database Integrity
✅ Phone number normalized (digits only)
✅ Push token format: `ExponentPushToken[xxx]`
✅ Platform is 'android' or 'apple'
✅ Campaign marked as is_valid=true
✅ Message log created with status='success'

### User Experience
✅ No crashes or freezes
✅ Loading states appear appropriately
✅ Error messages are user-friendly
✅ UI styling is consistent (coffee theme)
✅ Animations are smooth
✅ Response times < 3 seconds

---

## Pass/Fail Decision

**PASS:** All critical path items checked ✅
**FAIL:** Any critical path item unchecked ❌

**Result:** [ ] PASS [ ] FAIL

**Tested By:** _______________________
**Date:** _______________________
**Device:** _______________________
**App Version:** _______________________

---

## Issues Found

### Critical Issues (Block Release)
```
1. ____________________________________________
2. ____________________________________________
3. ____________________________________________
```

### Minor Issues (Can Be Fixed Later)
```
1. ____________________________________________
2. ____________________________________________
3. ____________________________________________
```

---

## Next Steps

### If PASS:
1. Mark subtask-8-1 as completed ✅
2. Commit test results
3. Proceed to subtask-8-2 (offline mode testing)
4. Proceed to subtask-8-3 (cross-platform testing)

### If FAIL:
1. Document all failures above ❌
2. Create GitHub issues for bugs
3. Fix critical issues
4. Re-run failed tests
5. Update implementation_plan.json

---

## Quick SQL Queries

```sql
-- Check test phone subscription
SELECT * FROM phone_numbers WHERE phone = '5551234567';

-- Check push token exists
SELECT phone, push_token FROM phone_numbers WHERE push_token IS NOT NULL;

-- Count valid campaigns
SELECT COUNT(*) FROM campaigns WHERE is_valid = true AND is_expired = false;

-- Check latest message delivery
SELECT * FROM message_logs ORDER BY created_at DESC LIMIT 5;

-- Campaign delivery success rate
SELECT
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) as total
FROM message_logs;
```

---

**End of Quick Checklist**
