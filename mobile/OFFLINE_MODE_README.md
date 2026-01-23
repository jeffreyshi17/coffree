# Offline Mode Testing Documentation

## Overview

This directory contains comprehensive testing documentation for the FreeCoffee mobile app's offline capabilities. The offline mode implementation provides a seamless user experience even when network connectivity is unavailable.

---

## 📂 Documentation Files

### 1. **OFFLINE_MODE_TEST_GUIDE.md** (Comprehensive Guide)
   - **Purpose**: Detailed step-by-step testing procedures
   - **Time**: 20-30 minutes
   - **Audience**: QA testers, first-time testers, thorough testing
   - **Coverage**: 20+ test cases across 7 phases

### 2. **OFFLINE_MODE_QUICK_CHECKLIST.md** (Quick Checklist)
   - **Purpose**: Fast verification checklist
   - **Time**: 10-15 minutes
   - **Audience**: Experienced testers, regression testing
   - **Coverage**: 16 essential test cases

### 3. **offline-verify.sh** (Automated Script)
   - **Purpose**: Automated backend and database verification
   - **Time**: 10-30 seconds
   - **Audience**: Developers, CI/CD pipelines
   - **Coverage**: 15+ automated checks

### 4. **OFFLINE_MODE_README.md** (This File)
   - **Purpose**: Documentation overview and quick start guide
   - **Audience**: All team members

---

## 🚀 Quick Start

### Step 1: Run Automated Checks

Before manual testing, verify backend readiness:

```bash
cd mobile

# Set environment variables (if not already set)
export EXPO_PUBLIC_SUPABASE_URL="your-supabase-url"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
export EXPO_PUBLIC_API_URL="http://localhost:3000"

# Run automated verification
./offline-verify.sh
```

**Expected Output**:
```
✅ All automated checks passed!
Proceed with manual device testing using OFFLINE_MODE_TEST_GUIDE.md
```

---

### Step 2: Choose Testing Approach

#### Option A: Comprehensive Testing (First-Time / Thorough)
```bash
# Follow the detailed guide
open OFFLINE_MODE_TEST_GUIDE.md
```

#### Option B: Quick Testing (Experienced / Regression)
```bash
# Follow the quick checklist
open OFFLINE_MODE_QUICK_CHECKLIST.md
```

---

### Step 3: Manual Device Testing

1. Install app on physical device (iOS 14+ or Android 8.0+)
2. Follow test cases in chosen guide
3. Toggle airplane mode to test offline/online transitions
4. Verify cache, sync, and offline indicator behavior
5. Document results and sign off

---

## 🧪 What Gets Tested

### Offline Mode Features

#### ✅ Cache-First Loading
- **Feature**: Campaigns load instantly from AsyncStorage cache
- **Test**: Open app → Close → Reopen → See instant data (<100ms)
- **Implementation**: `useCampaigns.ts` with `getCachedItem()`

#### ✅ Offline Access
- **Feature**: Full app functionality without network
- **Test**: Enable airplane mode → Navigate tabs → View campaigns
- **Implementation**: Cache fallback in `useCampaigns.ts`

#### ✅ Background Sync
- **Feature**: Automatic data refresh when connection restored
- **Test**: Offline → Reconnect → Wait 5s → See updated data
- **Implementation**: `networkSync.ts` with `performBackgroundSync()`

#### ✅ Network Status Detection
- **Feature**: Visual offline indicator at top of screen
- **Test**: Airplane mode on → Red banner appears
- **Implementation**: `OfflineIndicator.tsx` with NetInfo

#### ✅ Graceful Error Handling
- **Feature**: No crashes or errors when offline
- **Test**: Airplane mode → Pull-to-refresh → Cached data remains
- **Implementation**: Try-catch blocks in `useCampaigns.ts`

---

## 🏗️ Architecture Overview

### Key Components

```
mobile/
├── lib/
│   ├── storage.ts           # AsyncStorage wrapper with cache expiration
│   └── networkSync.ts       # Network monitoring and background sync
├── hooks/
│   └── useCampaigns.ts      # Cache-first data fetching hook
├── components/
│   └── OfflineIndicator.tsx # Visual offline indicator
└── app/
    └── _layout.tsx          # Network sync initialization
```

### Data Flow

```
1. App Launch
   └─> initializeNetworkSync() in _layout.tsx
       └─> NetInfo listener activated

2. Load Campaigns (useCampaigns hook)
   ├─> Step 1: Load from cache (instant)
   ├─> Step 2: Fetch from network (background)
   └─> Step 3: Update cache + UI

3. Network Lost
   └─> NetInfo detects offline
       └─> OfflineIndicator appears
           └─> Cached data continues to display

4. Network Restored
   └─> NetInfo detects online
       └─> performBackgroundSync() triggered
           ├─> syncCampaigns()
           └─> Update cache + UI
               └─> OfflineIndicator disappears
```

---

## 📊 Test Coverage

### Automated Checks (offline-verify.sh)

| Category | Checks | Description |
|----------|--------|-------------|
| Dependencies | 2 | curl, jq installed |
| Environment | 2 | Supabase URL, API key set |
| Backend | 2 | API health, campaigns endpoint |
| Supabase | 3 | Connectivity, campaigns table, phones table |
| Campaigns Data | 3 | Active campaigns, data quality, expiration |
| Cache Storage | 2 | storage.ts, networkSync.ts configuration |
| Components | 2 | OfflineIndicator, _layout integration |
| Hooks | 1 | useCampaigns cache-first strategy |
| **Total** | **17** | **Automated checks** |

### Manual Test Cases

| Phase | Test Cases | Time |
|-------|-----------|------|
| 1. Cache Population | 2 | 2-3 min |
| 2. Offline Access | 4 | 5-7 min |
| 3. Background Sync | 4 | 8-10 min |
| 4. Cache Expiration | 2 | 18+ min (wait time) |
| 5. Pending Sync | 1 | 2 min |
| 6. Network Transitions | 3 | 3-5 min |
| 7. Stress Testing | 3 | 5-7 min |
| **Total** | **19** | **20-30 min** |

---

## ✅ Success Criteria

### Must Pass (Critical)

- [ ] **Fresh install loads campaigns** from network (Test 1.1)
- [ ] **Cache hit shows instant data** on second load (Test 1.2)
- [ ] **Offline indicator appears** when offline (Test 2.1)
- [ ] **Navigation works while offline** (Test 2.2)
- [ ] **App restarts offline without crashes** (Test 2.4)
- [ ] **Background sync triggers on reconnection** (Test 3.1)
- [ ] **New campaigns sync after reconnection** (Test 3.2)

### Should Pass (Important)

- [ ] Pull-to-refresh fails gracefully offline (Test 2.3)
- [ ] Campaign updates sync correctly (Test 3.3)
- [ ] Campaign deletions sync correctly (Test 3.4)
- [ ] Handles intermittent connections (Test 6.3)

### Nice to Have (Optional)

- [ ] Expired cache still used offline (Test 4.1)
- [ ] Large lists perform well offline (Test 7.1)
- [ ] Background sync works while app backgrounded (Test 7.3)

---

## 🐛 Troubleshooting

### Common Issues

#### Issue 1: Offline Indicator Not Appearing

**Symptoms**: Airplane mode enabled but no red banner

**Possible Causes**:
- Network monitor not initialized
- OfflineIndicator component not rendered

**Solutions**:
1. Check `app/_layout.tsx` for `initializeNetworkSync()` call
2. Verify `OfflineIndicator` component imported and rendered
3. Check device logs for network state changes

---

#### Issue 2: Background Sync Not Triggering

**Symptoms**: Reconnect but campaigns don't update

**Possible Causes**:
- Network listener not registered
- API endpoint unreachable
- Background sync failing silently

**Solutions**:
1. Verify API server running: `curl http://localhost:3000/api/health`
2. Check device logs for sync errors
3. Test manual sync with pull-to-refresh
4. Verify Supabase credentials in `.env`

---

#### Issue 3: Cached Data Not Loading

**Symptoms**: App shows loading spinner instead of cached data

**Possible Causes**:
- AsyncStorage permission issues
- Cache keys incorrect
- First install (no cache exists)

**Solutions**:
1. Check device logs for AsyncStorage errors
2. Verify `STORAGE_KEYS.CAMPAIGNS` constant value
3. Load campaigns while online first to populate cache
4. Clear app data and reinstall if corrupted

---

#### Issue 4: App Crashes When Offline

**Symptoms**: App force closes when airplane mode enabled

**Possible Causes**:
- Network error not caught
- Null pointer exception
- Missing error handling

**Solutions**:
1. Check crash logs in Xcode/Logcat
2. Verify error handling in `useCampaigns.ts`
3. Add try-catch blocks around network calls
4. Test with mock data to isolate issue

---

## 📱 Device Testing Requirements

### iOS Requirements

- **Device**: Physical iPhone or iPad (iOS 14+)
- **Build**: Development build OR TestFlight beta
- **Note**: Expo Go may not support full offline functionality
- **Logs**: Xcode → Window → Devices and Simulators → Console

### Android Requirements

- **Device**: Physical Android device (Android 8.0+)
- **Build**: Development build OR Internal Testing APK
- **Note**: Expo Go may not support full offline functionality
- **Logs**: `adb logcat | grep -E "(freecoffee|offline|sync)"`

---

## 🔗 Related Documentation

- **E2E_TEST_GUIDE.md**: Full end-to-end testing (includes offline as part 2)
- **BUILD_GUIDE.md**: Building development and preview builds
- **lib/storage.ts**: AsyncStorage cache implementation
- **lib/networkSync.ts**: Background sync logic
- **hooks/useCampaigns.ts**: Cache-first data fetching

---

## 📋 Test Sign-Off Template

```markdown
## Offline Mode Test Results

**Tester**: _______________
**Date**: _______________
**Device**: _______________
**OS Version**: _______________
**App Version**: _______________
**Build Type**: Development / TestFlight / Internal Testing

### Automated Checks
- [ ] offline-verify.sh passed

### Manual Test Results
- [ ] Phase 1: Cache Population (2/2 passed)
- [ ] Phase 2: Offline Access (4/4 passed)
- [ ] Phase 3: Background Sync (4/4 passed)
- [ ] Phase 4: Cache Expiration (2/2 passed)
- [ ] Phase 5: Pending Sync (1/1 passed)
- [ ] Phase 6: Network Transitions (3/3 passed)
- [ ] Phase 7: Stress Testing (3/3 passed)

**Total**: ____ / 19 passed

### Critical Issues
[List any blocking issues]

### Minor Issues
[List any non-blocking issues]

### Overall Verdict
⬜ Pass ⬜ Fail ⬜ Pass with Conditions

**Signature**: _______________
```

---

## 🚦 CI/CD Integration

### Automated Testing in CI Pipeline

```yaml
# .github/workflows/mobile-offline-test.yml
name: Mobile Offline Mode Tests

on: [push, pull_request]

jobs:
  offline-verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd mobile
          npm ci

      - name: Install jq
        run: sudo apt-get install -y jq

      - name: Run automated offline mode verification
        env:
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          cd mobile
          ./offline-verify.sh

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: offline-test-report
          path: mobile/test-results/
```

---

## 📚 Additional Resources

### AsyncStorage Documentation
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- 15-minute cache expiration
- 6MB storage limit (mobile)

### Network Monitoring
- [@react-native-community/netinfo](https://github.com/react-native-netinfo/react-native-netinfo)
- Detects WiFi, Cellular, Offline states
- Real-time network state changes

### Supabase REST API
- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript)
- Row Level Security (RLS)
- Real-time subscriptions (future enhancement)

---

## 🎯 Next Steps

1. **Run automated verification**: `./offline-verify.sh`
2. **Choose testing approach**: Comprehensive guide OR quick checklist
3. **Perform manual device testing**: Follow chosen guide
4. **Document results**: Fill out test sign-off template
5. **Report issues**: Create GitHub issues for any failures
6. **Approve for production**: Sign off when all critical tests pass

---

**Questions or Issues?**
- Check troubleshooting section above
- Review device logs (Xcode Console / Android Logcat)
- Consult `lib/networkSync.ts` implementation
- Open GitHub issue with test results and logs

---

**Last Updated**: 2026-01-23
**Version**: 1.0.0
**Maintainer**: FreeCoffee Team
