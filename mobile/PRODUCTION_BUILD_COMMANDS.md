# Production Build Commands - Quick Reference

This document provides the exact commands to generate production builds for TestFlight (iOS) and Internal Testing (Android).

## Prerequisites Verification

```bash
# Verify you're in the mobile directory
pwd
# Expected: /path/to/freecoffee/.auto-claude/worktrees/tasks/004-native-mobile-application/mobile

# Verify EAS CLI is installed
eas --version
# Expected: eas-cli/X.X.X

# Verify you're logged in to Expo
eas whoami
# Expected: Your Expo username
# If not logged in: eas login

# Verify environment variables
cat .env
# Expected: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_API_URL
```

## iOS TestFlight Build

### Build Command

```bash
cd mobile
eas build --platform ios --profile preview
```

### Expected Prompts

```
? Select a build profile: preview
✔ Build credentials will be generated automatically
✔ Compiling JavaScript bundle
✔ Building iOS app
```

### On First Build Only

```
? Generate a new Apple Distribution Certificate? (Y/n) Y
? Generate a new Apple Provisioning Profile? (Y/n) Y
```

**Select "Yes" for both** - EAS will handle credentials automatically.

### Expected Output

```
✔ Build finished
Build URL: https://expo.dev/accounts/[your-account]/projects/freecoffee-mobile/builds/[build-id]
Build artifact URL: https://expo.dev/artifacts/[artifact-id]

iOS .ipa file is ready for download
```

### Download Build

```bash
# Download the .ipa file
eas build:download --platform ios --latest

# Or download specific build by ID
eas build:download --id [build-id]
```

### Upload to TestFlight

**Option 1: Automatic (Recommended)**

```bash
# Submit to TestFlight
eas submit --platform ios --latest

# Follow prompts:
# - Apple ID: your-apple-id@example.com
# - App-specific password: xxxx-xxxx-xxxx-xxxx
# - App Store Connect App ID: 1234567890
```

**Option 2: Manual**

1. Download the `.ipa` file
2. Open **Transporter** app (macOS)
3. Drag and drop the `.ipa` file
4. Click **Deliver**

### Verify TestFlight Upload

1. Go to https://appstoreconnect.apple.com
2. Select "FreeCoffee" app
3. Navigate to TestFlight tab
4. Wait for build processing (5-10 minutes)
5. Add test information
6. Invite internal testers

---

## Android Internal Testing Build

### Build Command

```bash
cd mobile
eas build --platform android --profile preview
```

### Expected Prompts

```
? Select a build profile: preview
✔ Build credentials will be generated automatically
✔ Compiling JavaScript bundle
✔ Building Android app
```

### On First Build Only

```
? Generate a new Android Keystore? (Y/n) Y
```

**Select "Yes"** - EAS will generate and securely store your keystore.

### Expected Output

```
✔ Build finished
Build URL: https://expo.dev/accounts/[your-account]/projects/freecoffee-mobile/builds/[build-id]
Build artifact URL: https://expo.dev/artifacts/[artifact-id]

Android .apk file is ready for download
```

### Download Build

```bash
# Download the .apk file
eas build:download --platform android --latest

# Or download specific build by ID
eas build:download --id [build-id]
```

### Upload to Play Console Internal Testing

**Option 1: Automatic (Recommended)**

```bash
# Submit to Internal Testing track
eas submit --platform android --latest --track internal

# Follow prompts for service account setup (first time)
```

**Option 2: Manual**

1. Download the `.apk` file
2. Go to https://play.google.com/console
3. Select "FreeCoffee" app (or create new app)
4. Navigate to: Testing → Internal testing
5. Click "Create new release"
6. Upload `.apk` file
7. Add release notes
8. Review and rollout

### Verify Play Console Upload

1. Go to https://play.google.com/console
2. Select "FreeCoffee" app
3. Navigate to "Internal testing"
4. Verify release is live
5. Add internal testers (email list)
6. Copy opt-in URL and share with testers

---

## Build Both Platforms Simultaneously

```bash
cd mobile

# Build iOS and Android at the same time
eas build --platform all --profile preview
```

This will queue both builds and run them in parallel (faster and more efficient).

---

## Monitoring Builds

### Check Build Status

```bash
# List all builds
eas build:list

# List only iOS builds
eas build:list --platform ios

# List only Android builds
eas build:list --platform android

# View specific build details
eas build:view [build-id]
```

### View Build Logs

```bash
# View logs for specific build
eas build:view [build-id]

# Or view online
# Open the Build URL provided after running build command
```

### Cancel Running Build

```bash
# Cancel specific build
eas build:cancel [build-id]
```

---

## Troubleshooting Commands

### Clear Credentials and Regenerate

```bash
# iOS credentials
eas credentials --platform ios

# Android credentials
eas credentials --platform android
```

### Clear Local Cache

```bash
cd mobile

# Clear Node modules
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
npx expo start --clear

# Clear EAS cache (forces fresh build)
eas build --platform ios --profile preview --clear-cache
```

### Check for Issues Before Building

```bash
cd mobile

# TypeScript check
npx tsc --noEmit

# Lint check
npm run lint

# Security audit
npm audit --audit-level=moderate

# Verify Expo doctor
npx expo doctor
```

---

## Environment Variables Required

Ensure your `.env` file contains:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# API Configuration
EXPO_PUBLIC_API_URL=https://your-production-api.com

# Optional: Deep linking
EXPO_PUBLIC_SCHEME=freecoffee
```

**Important:** For production builds, use **production API URLs**, not localhost!

---

## Post-Build Verification

### iOS Verification

```bash
# After downloading .ipa, verify it's valid
unzip -l FreeCoffee.ipa

# Check for required files
# - Payload/FreeCoffee.app/
# - iTunesMetadata.plist (if present)
```

### Android Verification

```bash
# After downloading .apk, verify it's valid
aapt dump badging freecoffee-mobile.apk

# Check package name
# Expected: package: name='com.freecoffee.app'

# Check version
# Expected: versionCode='1' versionName='1.0.0'
```

---

## Build Time Estimates

- **iOS Preview Build:** 10-20 minutes
- **iOS Production Build:** 15-25 minutes
- **Android Preview Build:** 5-15 minutes
- **Android Production Build:** 8-18 minutes
- **TestFlight Processing:** 5-10 minutes
- **Play Console Processing:** 2-5 minutes

---

## Common Build Errors and Solutions

### Error: "Not logged in to Expo"

```bash
eas login
# Enter your Expo credentials
```

### Error: "Project not configured for EAS Build"

```bash
cd mobile
eas build:configure
```

### Error: "Bundle identifier mismatch"

Check `app.json` matches `eas.json`:
- iOS: `bundleIdentifier: "com.freecoffee.app"`
- Android: `package: "com.freecoffee.app"`

### Error: "Apple Developer account required"

- Enroll at https://developer.apple.com
- Wait 24-48 hours for activation
- Try build again

### Error: "Build timed out"

- Check EAS dashboard for logs
- May need to upgrade EAS plan for faster builds
- Retry the build

---

## Success Criteria

### iOS Build Success

✅ Build completes without errors
✅ `.ipa` file downloads successfully
✅ File size is reasonable (30-100 MB expected)
✅ Upload to TestFlight succeeds
✅ Build appears in App Store Connect
✅ Internal testers can install via TestFlight
✅ App launches and all features work

### Android Build Success

✅ Build completes without errors
✅ `.apk` file downloads successfully
✅ File size is reasonable (30-80 MB expected)
✅ Upload to Play Console succeeds
✅ Build passes pre-launch checks
✅ Internal testers can install via Play Store
✅ App launches and all features work

---

## Next Commands After Build

### iOS

```bash
# Submit to TestFlight
eas submit --platform ios --latest

# Check submission status
# Visit: https://appstoreconnect.apple.com
```

### Android

```bash
# Submit to Internal Testing
eas submit --platform android --latest --track internal

# Check submission status
# Visit: https://play.google.com/console
```

---

## Contact for Issues

- **EAS Build Support:** https://expo.dev/support
- **EAS Build Status:** https://status.expo.dev
- **Documentation:** https://docs.expo.dev/build/introduction/

---

*Last Updated: 2026-01-23*
*Task: subtask-7-5 - Generate production builds for TestFlight (iOS) and Internal Testing (Android)*
