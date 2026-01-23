# Cross-Platform Consistency Testing Guide
## FreeCoffee Mobile Application (iOS vs Android)

This guide provides comprehensive step-by-step instructions for testing consistency between iOS and Android builds of the FreeCoffee mobile application.

---

## Test Overview

**Test Scope:** UI consistency, feature parity, and behavior matching between iOS and Android
**Duration:** ~45-60 minutes
**Requirements:** Physical iOS device (iOS 14+) AND physical Android device (Android 8.0+)

**Testing Focus:**
1. Visual consistency (UI, colors, spacing, typography)
2. Feature parity (all features work identically on both platforms)
3. Platform-specific behaviors (native features like notifications and widgets)
4. User experience consistency (navigation, gestures, feedback)

---

## Prerequisites

### Required Hardware
- [ ] Physical iOS device running iOS 14.0 or later
- [ ] Physical Android device running Android 8.0 (Oreo) or later
- [ ] Both devices connected to same WiFi network (for backend access)
- [ ] Both devices with notification permissions enabled

### Required Software
- [ ] TestFlight build installed on iOS device
- [ ] Internal Testing build installed on Android device
- [ ] Backend API server running and accessible
- [ ] Supabase database accessible

### Environment Setup
Both devices should be configured with the same environment:
```bash
# Both apps should use the same backend
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=https://your-app.vercel.app (or http://192.168.x.x:3000 for local testing)
```

### Test Data Preparation
- [ ] Clear existing phone subscriptions from both devices
- [ ] Prepare valid Capital One campaign link for testing
- [ ] Have screenshots capability ready on both devices
- [ ] Prepare side-by-side comparison area (table or desk)

---

## Testing Phases

### Phase 1: Visual Consistency (UI/UX)

#### Test 1.1: App Launch & Splash Screen
**Test:** Compare splash screens on both platforms

**iOS Steps:**
1. Close app completely (swipe up from multitasking)
2. Launch app from home screen
3. Observe splash screen: colors, logo, animation

**Android Steps:**
1. Close app completely (recent apps → swipe away)
2. Launch app from home screen or app drawer
3. Observe splash screen: colors, logo, animation

**Expected Result:**
- ✅ Same coffee brown color (#8B4513) on both platforms
- ✅ Same logo/icon display
- ✅ Splash screen duration: 1-3 seconds on both
- ✅ Smooth transition to home screen

**Verification:**
```sql
-- No database check needed for splash screen
```

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 1.2: Tab Navigation Bar
**Test:** Compare tab bar appearance and behavior

**iOS Steps:**
1. Navigate to Home tab
2. Tap Campaigns tab
3. Tap Settings tab
4. Take screenshot of each tab selected

**Android Steps:**
1. Navigate to Home tab
2. Tap Campaigns tab
3. Tap Settings tab
4. Take screenshot of each tab selected

**Compare Side-by-Side:**
- [ ] Tab icons: same size, style, and color
- [ ] Tab labels: same font size and weight
- [ ] Active tab indicator: consistent highlighting
- [ ] Tab bar height: similar proportions
- [ ] Tab bar background: same color (#FFFFFF or platform default)

**Expected Result:**
- ✅ Three tabs visible: Home, Campaigns, Settings
- ✅ Coffee cup icon for Campaigns tab
- ✅ Coffee brown (#8B4513) for active tab
- ✅ Gray (#6B7280) for inactive tabs
- ✅ Tab transitions smooth on both platforms

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 1.3: Home Screen (Subscription Form)
**Test:** Compare subscription form layout, colors, and spacing

**iOS Steps:**
1. Navigate to Home tab
2. Take screenshot of full screen
3. Measure/note: input field height, button size, spacing

**Android Steps:**
1. Navigate to Home tab
2. Take screenshot of full screen
3. Measure/note: input field height, button size, spacing

**Compare Elements:**

| Element | iOS | Android | Match? |
|---------|-----|---------|--------|
| Title text | "FreeCoffee" | "FreeCoffee" | [ ] |
| Title color | Coffee brown | Coffee brown | [ ] |
| Subtitle text | "Never miss..." | "Never miss..." | [ ] |
| Phone input placeholder | "(555) 555-5555" | "(555) 555-5555" | [ ] |
| Phone input border | Rounded | Rounded | [ ] |
| Platform selector buttons | Android/Apple | Android/Apple | [ ] |
| Subscribe button color | Orange (#d97706) | Orange (#d97706) | [ ] |
| Subscribe button text | "Subscribe" | "Subscribe" | [ ] |
| Spacing consistency | Even padding | Even padding | [ ] |

**Expected Result:**
- ✅ Identical layout and element positioning
- ✅ Same font sizes for title, subtitle, labels
- ✅ Same colors: coffee brown theme throughout
- ✅ Same input field styling (height ~48-56px)
- ✅ Same button styling (height ~48-56px)

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 1.4: Campaigns Screen (List View)
**Test:** Compare campaign card layout and styling

**Prerequisite:** Ensure at least 3 campaigns exist in database

**iOS Steps:**
1. Navigate to Campaigns tab
2. Wait for campaigns to load
3. Take screenshot showing multiple campaign cards
4. Note: card height, spacing, font sizes

**Android Steps:**
1. Navigate to Campaigns tab
2. Wait for campaigns to load
3. Take screenshot showing multiple campaign cards
4. Note: card height, spacing, font sizes

**Compare Campaign Cards:**

| Element | iOS | Android | Match? |
|---------|-----|---------|--------|
| Card background | White | White | [ ] |
| Card shadow/elevation | Subtle shadow | Subtle shadow | [ ] |
| Card border radius | Rounded corners | Rounded corners | [ ] |
| Coffee cup emoji | ☕ | ☕ | [ ] |
| Marketing channel | Display format | Display format | [ ] |
| Timestamp | "X time ago" | "X time ago" | [ ] |
| Card spacing | 12-16px | 12-16px | [ ] |

**Expected Result:**
- ✅ Campaign cards have identical layout
- ✅ Same card dimensions (width: 100%, height: auto)
- ✅ Same text hierarchy (title, subtitle, timestamp)
- ✅ Same colors and shadows
- ✅ Smooth scrolling on both platforms

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 1.5: Settings Screen (Subscription Management)
**Test:** Compare settings layout and subscription list

**iOS Steps:**
1. Navigate to Settings tab
2. Take screenshot of settings screen
3. Note: section headers, button styles, list items

**Android Steps:**
1. Navigate to Settings tab
2. Take screenshot of settings screen
3. Note: section headers, button styles, list items

**Compare Elements:**

| Element | iOS | Android | Match? |
|---------|-----|---------|--------|
| Screen title | "Settings" | "Settings" | [ ] |
| Section header | "Your Subscriptions" | "Your Subscriptions" | [ ] |
| Phone display | "(XXX) XXX-XX" | "(XXX) XXX-XX" | [ ] |
| Platform icon | Android/Apple | Android/Apple | [ ] |
| Unsubscribe button | Red text | Red text | [ ] |
| Empty state message | Consistent | Consistent | [ ] |

**Expected Result:**
- ✅ Identical layout and element order
- ✅ Same anonymization pattern for phone numbers
- ✅ Same platform icons (Android robot, Apple logo)
- ✅ Same button styling and colors
- ✅ Same empty state message if no subscriptions

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

### Phase 2: Feature Parity Testing

#### Test 2.1: Phone Number Subscription
**Test:** Subscribe with phone number on both platforms

**iOS Steps:**
1. Navigate to Home tab
2. Enter phone: `555-1234-iOS` (use unique identifier)
3. Select platform: **Apple**
4. Tap "Subscribe" button
5. Wait for success message
6. Note: success message text, animation

**Android Steps:**
1. Navigate to Home tab
2. Enter phone: `555-1234-Android` (use unique identifier)
3. Select platform: **Android**
4. Tap "Subscribe" button
5. Wait for success message
6. Note: success message text, animation

**Compare Behavior:**

| Behavior | iOS | Android | Match? |
|----------|-----|---------|--------|
| Phone formatting | (555) 123-4XXX | (555) 123-4XXX | [ ] |
| Platform selection | Visual feedback | Visual feedback | [ ] |
| Loading state | Spinner visible | Spinner visible | [ ] |
| Success message | Alert/modal | Alert/modal | [ ] |
| Message text | "Success! Subscribed..." | "Success! Subscribed..." | [ ] |
| Auto-dismiss | 3-5 seconds | 3-5 seconds | [ ] |
| Form reset | Clears inputs | Clears inputs | [ ] |

**Database Verification:**
```sql
-- Check both phones were added
SELECT phone, platform, push_token, created_at
FROM phone_numbers
WHERE phone LIKE '%1234%'
ORDER BY created_at DESC;

-- Expected: 2 rows (one iOS, one Android)
```

**Expected Result:**
- ✅ Both subscriptions succeed
- ✅ Same success message on both platforms
- ✅ Both phones stored in database with push tokens
- ✅ Form resets after submission on both platforms

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 2.2: Campaign List Loading
**Test:** Campaign list loads identically on both platforms

**iOS Steps:**
1. Navigate to Campaigns tab
2. Note: loading state (spinner/skeleton)
3. Wait for campaigns to load
4. Count: number of campaigns displayed
5. Note: first 3 campaign IDs/channels

**Android Steps:**
1. Navigate to Campaigns tab
2. Note: loading state (spinner/skeleton)
3. Wait for campaigns to load
4. Count: number of campaigns displayed
5. Note: first 3 campaign IDs/channels

**Compare:**

| Metric | iOS | Android | Match? |
|--------|-----|---------|--------|
| Loading indicator | Spinner | Spinner | [ ] |
| Campaign count | X campaigns | X campaigns | [ ] |
| Campaign order | By created_at DESC | By created_at DESC | [ ] |
| First campaign ID | XXX | XXX | [ ] |
| Timestamp format | "X hours ago" | "X hours ago" | [ ] |

**Database Verification:**
```sql
-- Check campaign count
SELECT COUNT(*) FROM campaigns
WHERE is_valid = true AND is_expired = false;

-- Get first 3 campaigns (should match app order)
SELECT campaign_id, marketing_channel, created_at
FROM campaigns
WHERE is_valid = true AND is_expired = false
ORDER BY created_at DESC
LIMIT 3;
```

**Expected Result:**
- ✅ Same number of campaigns displayed
- ✅ Same campaign order on both platforms
- ✅ Same timestamp formatting ("just now", "5m ago", "2h ago", etc.)
- ✅ All valid, non-expired campaigns visible

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 2.3: Pull-to-Refresh
**Test:** Pull-to-refresh functionality works consistently

**iOS Steps:**
1. Navigate to Campaigns tab
2. Pull down from top of list
3. Observe: refresh indicator animation
4. Wait for refresh to complete
5. Check: campaigns updated

**Android Steps:**
1. Navigate to Campaigns tab
2. Pull down from top of list
3. Observe: refresh indicator animation
4. Wait for refresh to complete
5. Check: campaigns updated

**Compare:**

| Behavior | iOS | Android | Match? |
|----------|-----|---------|--------|
| Pull gesture | Smooth | Smooth | [ ] |
| Refresh indicator | Spinning circle | Spinning circle | [ ] |
| Indicator color | Coffee brown | Coffee brown | [ ] |
| Refresh duration | 1-2 seconds | 1-2 seconds | [ ] |
| Data updates | Yes | Yes | [ ] |

**Expected Result:**
- ✅ Pull-to-refresh works on both platforms
- ✅ Same animation style and color
- ✅ Data refreshes correctly on both
- ✅ Smooth, responsive gesture recognition

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 2.4: Subscription Management (Unsubscribe)
**Test:** Unsubscribe functionality works identically

**iOS Steps:**
1. Navigate to Settings tab
2. Locate your iOS phone subscription
3. Tap "Unsubscribe" button
4. Confirm unsubscribe (if confirmation dialog appears)
5. Wait for confirmation message
6. Verify: subscription removed from list

**Android Steps:**
1. Navigate to Settings tab
2. Locate your Android phone subscription
3. Tap "Unsubscribe" button
4. Confirm unsubscribe (if confirmation dialog appears)
5. Wait for confirmation message
6. Verify: subscription removed from list

**Compare:**

| Behavior | iOS | Android | Match? |
|----------|-----|---------|--------|
| Button color | Red (#EF4444) | Red (#EF4444) | [ ] |
| Confirmation dialog | Appears | Appears | [ ] |
| Dialog text | "Are you sure?" | "Are you sure?" | [ ] |
| Loading state | Spinner | Spinner | [ ] |
| Success message | "Unsubscribed" | "Unsubscribed" | [ ] |
| List updates | Item removed | Item removed | [ ] |

**Database Verification:**
```sql
-- Both phones should be deleted
SELECT phone, platform
FROM phone_numbers
WHERE phone LIKE '%1234%';

-- Expected: 0 rows
```

**Expected Result:**
- ✅ Unsubscribe works on both platforms
- ✅ Confirmation dialog consistent
- ✅ Both phones removed from database
- ✅ UI updates correctly after removal

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

### Phase 3: Platform-Specific Features

#### Test 3.1: Push Notifications (iOS)
**Test:** iOS push notification delivery and appearance

**Prerequisites:**
- Re-subscribe iOS device: phone `555-2345-iOS`, platform **Apple**
- Ensure push token was registered (check database)

**iOS Steps:**
1. Put app in background (home button/swipe up)
2. Trigger new campaign from web admin
3. Wait for notification (10-30 seconds)
4. Observe notification: banner, sound, badge
5. Tap notification
6. Verify: app opens to Campaigns screen

**Notification Appearance:**
- [ ] Title: "☕ New Free Coffee Available!"
- [ ] Body: "A new coffee campaign just arrived. Tap to view."
- [ ] Sound: Plays notification sound
- [ ] Badge: App icon shows badge (if configured)
- [ ] Action: Tap opens app to Campaigns screen

**Database Verification:**
```sql
-- Check push token exists
SELECT phone, platform, push_token
FROM phone_numbers
WHERE phone LIKE '%2345-iOS%';

-- Check message was logged
SELECT campaign_id, phone_number, status
FROM message_logs
WHERE phone_number LIKE '%2345-iOS%'
ORDER BY created_at DESC LIMIT 1;
```

**Expected Result:**
- ✅ Notification received within 30 seconds
- ✅ Notification displays correctly with title and body
- ✅ Tapping notification opens app to Campaigns screen
- ✅ New campaign visible in campaigns list

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 3.2: Push Notifications (Android)
**Test:** Android push notification delivery and appearance

**Prerequisites:**
- Re-subscribe Android device: phone `555-2345-Android`, platform **Android**
- Ensure push token was registered (check database)

**Android Steps:**
1. Put app in background (home button/recent apps)
2. Trigger new campaign from web admin (different from iOS test)
3. Wait for notification (10-30 seconds)
4. Observe notification: banner, sound, vibration
5. Tap notification
6. Verify: app opens to Campaigns screen

**Notification Appearance:**
- [ ] Title: "☕ New Free Coffee Available!"
- [ ] Body: "A new coffee campaign just arrived. Tap to view."
- [ ] Sound: Plays notification sound
- [ ] Vibration: Device vibrates (if enabled)
- [ ] Icon: Coffee icon in notification shade
- [ ] Action: Tap opens app to Campaigns screen

**Database Verification:**
```sql
-- Check push token exists
SELECT phone, platform, push_token
FROM phone_numbers
WHERE phone LIKE '%2345-Android%';

-- Check message was logged
SELECT campaign_id, phone_number, status
FROM message_logs
WHERE phone_number LIKE '%2345-Android%'
ORDER BY created_at DESC LIMIT 1;
```

**Expected Result:**
- ✅ Notification received within 30 seconds
- ✅ Notification displays correctly with title, body, and icon
- ✅ Tapping notification opens app to Campaigns screen
- ✅ New campaign visible in campaigns list

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 3.3: Push Notification Comparison
**Test:** Compare iOS vs Android notification behavior

**Compare Notifications:**

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| Delivery time | <30s | <30s | Both timely |
| Banner style | iOS native | Android native | Platform-specific OK |
| Title text | Same | Same | Should match exactly |
| Body text | Same | Same | Should match exactly |
| Sound | Plays | Plays | Both audible |
| Vibration | N/A | Vibrates | Android-specific |
| Icon | App icon | Coffee icon | Platform-specific OK |
| Tap action | Opens to Campaigns | Opens to Campaigns | Behavior must match |
| Deep link | Works | Works | Both navigate correctly |

**Expected Result:**
- ✅ Both platforms receive notifications promptly
- ✅ Title and body text are identical
- ✅ Both navigate to Campaigns screen on tap
- ✅ Platform-specific styling is acceptable (iOS banner vs Android card)

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 3.4: Home Screen Widget (iOS)
**Test:** iOS widget displays and updates correctly

**Prerequisites:**
- iOS device with development build (widgets don't work in TestFlight without proper entitlements)
- At least 2 valid campaigns in database

**iOS Steps:**
1. Go to iOS home screen
2. Long-press to enter jiggle mode
3. Tap "+" to add widget
4. Find "FreeCoffee" in widget list
5. Add widget to home screen (small or medium size)
6. Observe: campaign count display
7. Wait 15 minutes or force refresh (re-add widget)
8. Observe: count updates

**Widget Appearance:**
- [ ] Coffee brown gradient background (#8B4513)
- [ ] "FreeCoffee" title visible
- [ ] Campaign count displays correctly (e.g., "3 Campaigns")
- [ ] Distributed count visible (medium/large widgets)
- [ ] Last updated timestamp shown
- [ ] Tap opens app to Campaigns screen

**Database Verification:**
```sql
-- Widget should display this count
SELECT COUNT(*) FROM campaigns
WHERE is_valid = true AND is_expired = false;

-- Distributed count
SELECT COUNT(*) FROM message_logs
WHERE status = 'success';
```

**Expected Result:**
- ✅ Widget displays correct campaign count
- ✅ Coffee brown gradient matches app theme
- ✅ Tapping widget opens app to Campaigns screen
- ✅ Widget updates automatically (~15 minutes)

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 3.5: Home Screen Widget (Android)
**Test:** Android widget displays and updates correctly

**Prerequisites:**
- Android device with development build
- At least 2 valid campaigns in database

**Android Steps:**
1. Go to Android home screen
2. Long-press on empty space
3. Tap "Widgets"
4. Find "FreeCoffee" in widget list
5. Drag widget to home screen
6. Observe: campaign count display
7. Wait 15-30 minutes for update
8. Observe: count updates

**Widget Appearance:**
- [ ] Coffee brown gradient background (#8B4513 → #654321)
- [ ] "FreeCoffee" title visible
- [ ] Campaign count displays correctly (e.g., "3 Campaigns")
- [ ] Distributed count visible
- [ ] Last updated timestamp shown
- [ ] Tap opens app to Campaigns screen

**Database Verification:**
```sql
-- Widget should display this count
SELECT COUNT(*) FROM campaigns
WHERE is_valid = true AND is_expired = false;

-- Distributed count
SELECT COUNT(*) FROM message_logs
WHERE status = 'success';
```

**Expected Result:**
- ✅ Widget displays correct campaign count
- ✅ Coffee brown gradient matches app theme (may have slight platform-specific rendering)
- ✅ Tapping widget opens app to Campaigns screen
- ✅ Widget updates automatically (~30 minutes due to Android restrictions)

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 3.6: Widget Comparison
**Test:** Compare iOS vs Android widget functionality

**Compare Widgets:**

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| Background color | #8B4513 | #8B4513 → #654321 | Android has gradient |
| Campaign count | Displays | Displays | Both accurate |
| Distributed count | Displays | Displays | Both accurate |
| Update frequency | ~15 min | ~30 min | Android limitation |
| Tap action | Opens Campaigns | Opens Campaigns | Behavior matches |
| Widget sizes | Small/Medium | Resizable | Platform differences OK |
| Text hierarchy | Clear | Clear | Both readable |
| Loading state | Shows | Shows | Both handle loading |
| Error state | Shows | Shows | Both handle errors |

**Expected Result:**
- ✅ Both widgets display accurate campaign counts
- ✅ Both widgets open app to Campaigns screen when tapped
- ✅ Both widgets update automatically (different intervals acceptable)
- ✅ Visual styling is consistent with platform conventions

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

### Phase 4: Offline Mode Consistency

#### Test 4.1: Offline Mode (iOS)
**Test:** iOS offline functionality and UI

**iOS Steps:**
1. Load campaigns while online (Campaigns tab)
2. Enable airplane mode
3. Observe: offline indicator appears at top
4. Navigate to Home, Campaigns, Settings tabs
5. Pull to refresh campaigns
6. Disable airplane mode
7. Observe: offline indicator disappears, sync occurs

**Offline Behavior:**
- [ ] Red offline indicator banner appears
- [ ] Indicator text: "No internet connection"
- [ ] Navigation works (all tabs accessible)
- [ ] Campaigns visible from cache
- [ ] Pull-to-refresh fails gracefully (no crash)
- [ ] Auto-sync when back online (~5 seconds)
- [ ] Offline indicator disappears smoothly

**Expected Result:**
- ✅ Offline indicator visible when network unavailable
- ✅ Cached campaigns remain accessible
- ✅ No crashes or errors during offline usage
- ✅ Automatic sync when connectivity restored

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 4.2: Offline Mode (Android)
**Test:** Android offline functionality and UI

**Android Steps:**
1. Load campaigns while online (Campaigns tab)
2. Enable airplane mode
3. Observe: offline indicator appears at top
4. Navigate to Home, Campaigns, Settings tabs
5. Pull to refresh campaigns
6. Disable airplane mode
7. Observe: offline indicator disappears, sync occurs

**Offline Behavior:**
- [ ] Red offline indicator banner appears
- [ ] Indicator text: "No internet connection"
- [ ] Navigation works (all tabs accessible)
- [ ] Campaigns visible from cache
- [ ] Pull-to-refresh fails gracefully (no crash)
- [ ] Auto-sync when back online (~5 seconds)
- [ ] Offline indicator disappears smoothly

**Expected Result:**
- ✅ Offline indicator visible when network unavailable
- ✅ Cached campaigns remain accessible
- ✅ No crashes or errors during offline usage
- ✅ Automatic sync when connectivity restored

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 4.3: Offline Mode Comparison
**Test:** Compare offline behavior consistency

**Compare Offline Features:**

| Feature | iOS | Android | Match? |
|---------|-----|---------|--------|
| Offline indicator | Red banner | Red banner | [ ] |
| Indicator position | Top of screen | Top of screen | [ ] |
| Indicator text | "No internet..." | "No internet..." | [ ] |
| Cache persistence | Works | Works | [ ] |
| Tab navigation | Functional | Functional | [ ] |
| Pull-to-refresh | Fails gracefully | Fails gracefully | [ ] |
| Sync trigger | Automatic | Automatic | [ ] |
| Sync delay | ~5s | ~5s | [ ] |
| Indicator animation | Slide in/out | Slide in/out | [ ] |

**Expected Result:**
- ✅ Offline mode behavior is identical on both platforms
- ✅ Offline indicator appears/disappears consistently
- ✅ Cached data accessible on both platforms
- ✅ Automatic sync works reliably on both

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

### Phase 5: Performance & Responsiveness

#### Test 5.1: App Launch Time
**Test:** Compare app launch performance

**iOS Steps:**
1. Close app completely
2. Start timer
3. Tap app icon
4. Stop timer when Home tab is interactive
5. Record time
6. Repeat 3 times, calculate average

**Android Steps:**
1. Close app completely
2. Start timer
3. Tap app icon
4. Stop timer when Home tab is interactive
5. Record time
6. Repeat 3 times, calculate average

**Performance Comparison:**

| Metric | iOS Trial 1 | iOS Trial 2 | iOS Trial 3 | iOS Avg |
|--------|-------------|-------------|-------------|---------|
| Launch time | ___s | ___s | ___s | ___s |

| Metric | Android Trial 1 | Android Trial 2 | Android Trial 3 | Android Avg |
|--------|-----------------|-----------------|-----------------|-------------|
| Launch time | ___s | ___s | ___s | ___s |

**Expected Result:**
- ✅ iOS launch time: 1-3 seconds
- ✅ Android launch time: 1-3 seconds
- ✅ Difference between platforms: <1 second
- ✅ Launch performance acceptable on both

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 5.2: Campaign List Scrolling
**Test:** Compare scroll performance with large lists

**Prerequisites:** Ensure at least 20 campaigns in database

**iOS Steps:**
1. Navigate to Campaigns tab
2. Wait for full list to load
3. Scroll rapidly from top to bottom
4. Observe: frame drops, stuttering
5. Rate smoothness: 1-5 (5 = perfectly smooth)

**Android Steps:**
1. Navigate to Campaigns tab
2. Wait for full list to load
3. Scroll rapidly from top to bottom
4. Observe: frame drops, stuttering
5. Rate smoothness: 1-5 (5 = perfectly smooth)

**Scrolling Performance:**

| Metric | iOS | Android |
|--------|-----|---------|
| Smoothness (1-5) | ___ | ___ |
| Frame drops | Yes/No | Yes/No |
| Stuttering | Yes/No | Yes/No |
| Fling velocity | Fast/Medium/Slow | Fast/Medium/Slow |

**Expected Result:**
- ✅ Both platforms: smooth scrolling (rating 4-5)
- ✅ No visible frame drops during rapid scrolling
- ✅ Fling gesture responsive on both platforms

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 5.3: Form Interaction Responsiveness
**Test:** Compare form input responsiveness

**iOS Steps:**
1. Navigate to Home tab
2. Tap phone number input
3. Note: keyboard appearance time
4. Type: "5551234567"
5. Observe: formatting latency
6. Tap platform selector buttons
7. Observe: visual feedback delay
8. Tap Subscribe button
9. Observe: loading spinner appearance time

**Android Steps:**
1. Navigate to Home tab
2. Tap phone number input
3. Note: keyboard appearance time
4. Type: "5551234567"
5. Observe: formatting latency
6. Tap platform selector buttons
7. Observe: visual feedback delay
8. Tap Subscribe button
9. Observe: loading spinner appearance time

**Responsiveness Comparison:**

| Interaction | iOS | Android | Match? |
|-------------|-----|---------|--------|
| Keyboard appearance | <300ms | <300ms | [ ] |
| Input formatting | Real-time | Real-time | [ ] |
| Button press feedback | Immediate | Immediate | [ ] |
| Loading spinner | <100ms | <100ms | [ ] |
| Overall responsiveness | Excellent | Excellent | [ ] |

**Expected Result:**
- ✅ Keyboard appears instantly on both platforms
- ✅ Phone formatting applies in real-time
- ✅ Button presses provide immediate visual feedback
- ✅ No noticeable lag on either platform

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

### Phase 6: Error Handling Consistency

#### Test 6.1: Network Error Handling
**Test:** Compare error messages and recovery

**iOS Steps:**
1. Enable airplane mode
2. Navigate to Home tab
3. Try to subscribe with phone number
4. Observe: error message
5. Disable airplane mode
6. Retry subscription
7. Observe: recovery behavior

**Android Steps:**
1. Enable airplane mode
2. Navigate to Home tab
3. Try to subscribe with phone number
4. Observe: error message
5. Disable airplane mode
6. Retry subscription
7. Observe: recovery behavior

**Error Handling Comparison:**

| Behavior | iOS | Android | Match? |
|----------|-----|---------|--------|
| Error message appears | Yes | Yes | [ ] |
| Message text | Clear/helpful | Clear/helpful | [ ] |
| Error color | Red | Red | [ ] |
| Retry option | Available | Available | [ ] |
| Auto-recovery | Works | Works | [ ] |
| Success after retry | Yes | Yes | [ ] |

**Expected Result:**
- ✅ Both show clear error messages
- ✅ Error message text is identical or equivalent
- ✅ Retry functionality works on both platforms
- ✅ Successful recovery after connectivity restored

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 6.2: Invalid Input Handling
**Test:** Compare form validation behavior

**iOS Steps:**
1. Navigate to Home tab
2. Enter invalid phone: "123"
3. Try to submit
4. Observe: validation error
5. Clear input
6. Enter valid phone but don't select platform
7. Try to submit
8. Observe: platform validation error

**Android Steps:**
1. Navigate to Home tab
2. Enter invalid phone: "123"
3. Try to submit
4. Observe: validation error
5. Clear input
6. Enter valid phone but don't select platform
7. Try to submit
8. Observe: platform validation error

**Validation Comparison:**

| Validation | iOS | Android | Match? |
|------------|-----|---------|--------|
| Invalid phone error | Appears | Appears | [ ] |
| Error message text | Same | Same | [ ] |
| Error color | Red | Red | [ ] |
| Missing platform error | Appears | Appears | [ ] |
| Error position | Consistent | Consistent | [ ] |
| Form remains editable | Yes | Yes | [ ] |

**Expected Result:**
- ✅ Form validation works identically on both platforms
- ✅ Error messages are clear and consistent
- ✅ Users can correct errors and resubmit

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

### Phase 7: Accessibility & Platform Standards

#### Test 7.1: Platform UI Guidelines
**Test:** Verify adherence to platform design guidelines

**iOS Evaluation:**
- [ ] Uses iOS system fonts (San Francisco)
- [ ] Respects iOS safe areas (notch, bottom bar)
- [ ] Navigation follows iOS patterns (tabs at bottom)
- [ ] Buttons have iOS-style appearance
- [ ] Alerts/modals follow iOS Human Interface Guidelines

**Android Evaluation:**
- [ ] Uses Android system fonts (Roboto)
- [ ] Respects Android safe areas (status bar, navigation bar)
- [ ] Navigation follows Material Design (tabs at bottom)
- [ ] Buttons have Material Design appearance
- [ ] Toasts/dialogs follow Material Design guidelines

**Expected Result:**
- ✅ iOS build follows Apple Human Interface Guidelines
- ✅ Android build follows Material Design guidelines
- ✅ Both feel "native" to their respective platforms
- ✅ No jarring cross-platform UI inconsistencies

**Pass/Fail:** [ ] PASS [ ] FAIL

**Notes:** _____________________________________________________________

---

#### Test 7.2: Dark Mode Support (If Implemented)
**Test:** Compare dark mode appearance

**iOS Steps:**
1. Enable dark mode in iOS Settings → Display & Brightness
2. Open FreeCoffee app
3. Check: background colors, text colors, tab bar
4. Take screenshots of each tab

**Android Steps:**
1. Enable dark mode in Android Settings → Display → Dark theme
2. Open FreeCoffee app
3. Check: background colors, text colors, tab bar
4. Take screenshots of each tab

**Dark Mode Comparison:**

| Element | iOS | Android | Match? |
|---------|-----|---------|--------|
| Background color | Dark gray | Dark gray | [ ] |
| Text color | Light gray/white | Light gray/white | [ ] |
| Tab bar | Dark theme | Dark theme | [ ] |
| Campaign cards | Dark | Dark | [ ] |
| Button colors | Adjusted | Adjusted | [ ] |

**Expected Result:**
- ✅ Dark mode works on both platforms (if implemented)
- ✅ Colors are consistent and readable
- ✅ Coffee brown accent color adjusted for dark mode

**Note:** If dark mode is not implemented, mark N/A

**Pass/Fail:** [ ] PASS [ ] FAIL [ ] N/A

**Notes:** _____________________________________________________________

---

## Final Comparison Summary

### Visual Consistency Score
Rate overall visual consistency (1-10): ___/10

**Areas of Excellence:**
- _________________________________________________________________
- _________________________________________________________________
- _________________________________________________________________

**Areas Needing Improvement:**
- _________________________________________________________________
- _________________________________________________________________
- _________________________________________________________________

### Feature Parity Score
Rate feature parity (1-10): ___/10

**Features Working Identically:**
- [ ] Phone subscription
- [ ] Campaign list
- [ ] Settings/unsubscribe
- [ ] Pull-to-refresh
- [ ] Offline mode
- [ ] Push notifications
- [ ] Home screen widgets

**Features with Platform Differences:**
- _________________________________________________________________
- _________________________________________________________________

### Performance Comparison
Rate performance similarity (1-10): ___/10

**Performance Summary:**
| Metric | iOS | Android | Difference |
|--------|-----|---------|------------|
| Launch time | ___s | ___s | ___s |
| Scroll performance | ___/5 | ___/5 | ___ |
| Form responsiveness | ___/5 | ___/5 | ___ |

### Critical Issues Found
**Blocking Issues (Must Fix):**
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

**Minor Issues (Nice to Fix):**
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

---

## Test Sign-Off

**Tester Name:** _________________________________

**Test Date:** _________________________________

**iOS Device:** _________ (Model, iOS Version)

**Android Device:** _________ (Model, Android Version)

**Overall Result:** [ ] PASS [ ] FAIL

**Recommendation:**
- [ ] Approve for production release (all platforms)
- [ ] Approve iOS only (block Android until issues fixed)
- [ ] Approve Android only (block iOS until issues fixed)
- [ ] Block both platforms (critical issues found)

**Justification:**
____________________________________________________________________
____________________________________________________________________
____________________________________________________________________

**Signature:** _________________________________

---

## Appendix A: Device Specifications

### iOS Test Device
- Model: _________________________________
- iOS Version: _________________________________
- Screen Size: _________________________________
- RAM: _________________________________
- Storage Available: _________________________________

### Android Test Device
- Model: _________________________________
- Android Version: _________________________________
- Screen Size: _________________________________
- RAM: _________________________________
- Storage Available: _________________________________

---

## Appendix B: Database Queries

### Campaign Count Query
```sql
SELECT COUNT(*) as total_campaigns
FROM campaigns
WHERE is_valid = true AND is_expired = false;
```

### Distributed Vouchers Query
```sql
SELECT COUNT(*) as distributed_count
FROM message_logs
WHERE status = 'success';
```

### Phone Subscriptions Query
```sql
SELECT phone, platform, push_token IS NOT NULL as has_push_token, created_at
FROM phone_numbers
ORDER BY created_at DESC;
```

### Recent Message Logs Query
```sql
SELECT campaign_id, phone_number, status, created_at
FROM message_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## Appendix C: Screenshot Comparison Template

For each screen, place iOS and Android screenshots side-by-side:

```
┌─────────────────────────────┬─────────────────────────────┐
│       iOS Screenshot        │     Android Screenshot      │
├─────────────────────────────┼─────────────────────────────┤
│                             │                             │
│   [Paste iOS screenshot]    │  [Paste Android screenshot] │
│                             │                             │
│                             │                             │
└─────────────────────────────┴─────────────────────────────┘

Differences noted:
- ______________________________________________________________
- ______________________________________________________________
```

**Screens to Compare:**
1. Home (Subscription Form)
2. Campaigns (List View)
3. Settings (Subscription Management)
4. Push Notification (System notification)
5. Home Screen Widget
6. Offline Indicator

---

**End of Cross-Platform Testing Guide**
