# Production Build Guide for FreeCoffee Mobile App

This guide covers generating production builds for TestFlight (iOS) and Internal Testing (Android) using Expo Application Services (EAS).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build Profiles](#build-profiles)
- [iOS TestFlight Build](#ios-testflight-build)
- [Android Internal Testing Build](#android-internal-testing-build)
- [Troubleshooting](#troubleshooting)
- [Distribution](#distribution)

---

## Prerequisites

### Required Accounts

1. **Expo Account** (Free)
   - Sign up at https://expo.dev
   - Used for EAS Build service

2. **Apple Developer Account** ($99/year)
   - Required for iOS builds and TestFlight distribution
   - Sign up at https://developer.apple.com
   - Enable App Store Connect access

3. **Google Play Developer Account** ($25 one-time)
   - Required for Android builds and Play Console distribution
   - Sign up at https://play.google.com/console

### Required Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version

# Login to Expo account
eas login
```

### Environment Setup

Ensure your `.env` file (or `.env.local`) contains:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=https://your-api.com
```

**Important:** Never commit `.env` files with real credentials to version control.

---

## Build Profiles

The app has three build profiles defined in `eas.json`:

### 1. Development
- **Purpose:** Local development with Expo Dev Client
- **iOS:** Includes simulator builds
- **Android:** APK format
- **Distribution:** Internal

### 2. Preview (TestFlight & Internal Testing)
- **Purpose:** Internal testing before app store release
- **iOS:** Physical device builds for TestFlight
- **Android:** APK format for Internal Testing track
- **Distribution:** Internal

### 3. Production (App Store & Play Store)
- **Purpose:** Final app store releases
- **iOS:** App Store builds with auto-increment build numbers
- **Android:** App Bundle (AAB) format for Play Store
- **Distribution:** Store
- **Credentials:** Managed by EAS (remote)

---

## iOS TestFlight Build

### Step 1: Configure iOS Credentials

On your first iOS build, EAS will prompt you to set up credentials:

```bash
cd mobile
eas credentials
```

Select:
- **iOS** platform
- **Build credentials** setup
- Let EAS **generate** new credentials (recommended)

EAS will create:
- Distribution Certificate
- Provisioning Profile (Ad Hoc for preview, App Store for production)
- Push Notification Certificate

### Step 2: Build for TestFlight (Preview Profile)

```bash
cd mobile

# Build for TestFlight using preview profile
eas build --platform ios --profile preview
```

**Expected Output:**
```
✔ Select a build profile: preview
✔ Build credentials set up
✔ Compiling JavaScript
✔ Building iOS app
✔ Build finished
✔ Build URL: https://expo.dev/accounts/[your-account]/projects/freecoffee-mobile/builds/[build-id]
```

**Build Time:** 10-20 minutes

### Step 3: Download the IPA

Once the build completes:

1. Visit the build URL provided by EAS
2. Download the `.ipa` file
3. Or use: `eas build:download --platform ios`

### Step 4: Upload to TestFlight

**Option A: Manual Upload via Xcode**

1. Open **Transporter** app (macOS)
2. Drag and drop the `.ipa` file
3. Click **Deliver**
4. Wait for processing (5-10 minutes)

**Option B: Automatic Upload via EAS Submit**

```bash
# Configure submit settings (one-time)
eas submit --platform ios --latest

# Follow prompts to enter:
# - Apple ID (email)
# - App-specific password
# - App Store Connect App ID
```

Update `eas.json` submit section:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123XYZ"
      }
    }
  }
}
```

### Step 5: TestFlight Distribution

1. **Log in to App Store Connect**
   - https://appstoreconnect.apple.com

2. **Navigate to TestFlight**
   - Select your app: "FreeCoffee"
   - Wait for build processing (~5-10 minutes)

3. **Add Test Information**
   - Beta App Description
   - Beta App Review Information
   - Export Compliance: Select "No" (no encryption beyond standard)

4. **Add Internal Testers**
   - Go to "Internal Testing"
   - Add testers (up to 100)
   - Testers receive email with TestFlight link

5. **Enable External Testing** (optional)
   - Submit for Beta App Review
   - Add external testers (up to 10,000)
   - Review takes 24-48 hours

---

## Android Internal Testing Build

### Step 1: Configure Android Credentials

On your first Android build, EAS will handle keystore creation:

```bash
cd mobile

# Build for Internal Testing using preview profile
eas build --platform android --profile preview
```

EAS will prompt:
```
? Generate a new Android Keystore? (Y/n) Y
```

Select **Yes** to let EAS generate and manage your keystore.

**Important:** EAS stores your keystore securely. You can download it later if needed:
```bash
eas credentials --platform android
```

### Step 2: Build APK for Internal Testing

```bash
cd mobile

# Build APK for internal testing
eas build --platform android --profile preview
```

**Expected Output:**
```
✔ Select a build profile: preview
✔ Build credentials set up
✔ Generating Android keystore
✔ Compiling JavaScript
✔ Building Android app
✔ Build finished
✔ Build URL: https://expo.dev/accounts/[your-account]/projects/freecoffee-mobile/builds/[build-id]
```

**Build Time:** 5-15 minutes

### Step 3: Download the APK

```bash
# Download the APK file
eas build:download --platform android
```

### Step 4: Upload to Play Console Internal Testing

**Manual Upload:**

1. **Log in to Google Play Console**
   - https://play.google.com/console

2. **Create App Listing** (first time)
   - Click "Create app"
   - App name: "FreeCoffee"
   - Default language: English (United States)
   - App category: Lifestyle
   - Free app: Yes

3. **Navigate to Internal Testing**
   - Left sidebar: Testing → Internal testing
   - Click "Create new release"

4. **Upload APK**
   - Click "Upload"
   - Drag and drop the `.apk` file
   - Add release notes (e.g., "Initial beta release for internal testing")

5. **Add Internal Testers**
   - Create email list of testers
   - Add testers to internal testing track
   - Save and publish release

6. **Share Testing Link**
   - Copy the opt-in URL
   - Share with testers
   - Testers install via Play Store after opting in

**Automatic Upload via EAS Submit:**

```bash
# Submit to Internal Testing track
eas submit --platform android --latest

# Follow prompts to configure service account
```

For automatic submission, you need a Google Cloud service account key:
1. Create service account in Google Cloud Console
2. Download JSON key file
3. Update `eas.json` with path to key file

---

## Troubleshooting

### iOS Build Errors

#### Error: "No profiles for 'com.freecoffee.app' were found"

**Solution:** Let EAS generate credentials
```bash
eas credentials --platform ios
# Select: Build credentials → Generate new credentials
```

#### Error: "Apple Developer account required"

**Solution:**
1. Enroll in Apple Developer Program ($99/year)
2. Wait 24-48 hours for account activation
3. Try build again

#### Error: "Invalid Bundle Identifier"

**Solution:** Ensure `bundleIdentifier` in `app.json` matches App Store Connect:
```json
"ios": {
  "bundleIdentifier": "com.freecoffee.app"
}
```

### Android Build Errors

#### Error: "Keystore not found"

**Solution:** Let EAS generate keystore on first build
```bash
eas build --platform android --profile preview
# Answer "Yes" to generate keystore
```

#### Error: "Package name already in use"

**Solution:** Change package name in `app.json`:
```json
"android": {
  "package": "com.freecoffee.app"
}
```

### Build Timeout Errors

**Solution:**
- Builds can take 10-20 minutes
- Check EAS dashboard for build logs
- Retry if build times out

### Dependency Errors

**Solution:**
```bash
cd mobile

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
npx expo start --clear

# Try build again
eas build --platform [ios|android] --profile preview
```

---

## Distribution

### iOS TestFlight Testing

**Internal Testers (No Review):**
- Add up to 100 testers
- Instant access (no review)
- Great for team testing

**External Testers (Requires Review):**
- Add up to 10,000 testers
- Submit for Beta App Review
- Review takes 24-48 hours
- Use for wider beta testing

**TestFlight App:**
- Testers install TestFlight app from App Store
- Receive email invite with redemption code
- Install FreeCoffee beta from TestFlight

### Android Internal Testing

**Internal Testing Track:**
- Add up to 100 testers via email list
- Instant access (no review)
- Testers opt in via provided URL
- Install from Play Store (marked as "Internal test")

**Alpha/Beta Testing Tracks:**
- Alpha: Limited testing (closed)
- Beta: Wider testing (open or closed)
- Requires review (1-3 days)

**Distribution Methods:**
1. Email list: Invite specific testers
2. Link sharing: Share opt-in URL publicly
3. Google Groups: Use groups for testers

---

## Build Commands Reference

### iOS Builds

```bash
# Preview (TestFlight)
eas build --platform ios --profile preview

# Production (App Store)
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --latest

# Download IPA
eas build:download --platform ios
```

### Android Builds

```bash
# Preview (Internal Testing APK)
eas build --platform android --profile preview

# Production (Play Store AAB)
eas build --platform android --profile production

# Submit to Play Console
eas submit --platform android --latest

# Download APK/AAB
eas build:download --platform android
```

### Both Platforms

```bash
# Build both iOS and Android simultaneously
eas build --platform all --profile preview

# Check build status
eas build:list

# View build details
eas build:view [build-id]

# Cancel running build
eas build:cancel [build-id]
```

---

## Build Checklist

### Before Building

- [ ] EAS CLI installed and authenticated
- [ ] Apple Developer account active (iOS)
- [ ] Google Play Developer account active (Android)
- [ ] Environment variables configured (`.env`)
- [ ] App version bumped in `app.json` (if needed)
- [ ] All code committed to git
- [ ] TypeScript compiles without errors (`npm run tsc --noEmit`)
- [ ] No security vulnerabilities (`npm audit`)

### iOS Build

- [ ] Run `eas build --platform ios --profile preview`
- [ ] Wait for build completion (~10-20 min)
- [ ] Download IPA file
- [ ] Upload to TestFlight (manual or `eas submit`)
- [ ] Add test information in App Store Connect
- [ ] Invite internal testers
- [ ] Test installation on physical device
- [ ] Verify all features work (push, widgets, offline)

### Android Build

- [ ] Run `eas build --platform android --profile preview`
- [ ] Wait for build completion (~5-15 min)
- [ ] Download APK file
- [ ] Upload to Play Console Internal Testing
- [ ] Add internal testers
- [ ] Share opt-in URL with testers
- [ ] Test installation on physical device
- [ ] Verify all features work (push, widgets, offline)

---

## Next Steps

After successful TestFlight and Internal Testing builds:

1. **Gather Feedback**
   - Collect crash reports from testers
   - Review TestFlight feedback
   - Check Play Console pre-launch reports

2. **Fix Issues**
   - Address bugs found in testing
   - Improve performance based on feedback
   - Update app based on tester suggestions

3. **Prepare for Production**
   - Create production builds (`--profile production`)
   - Submit for App Store Review (iOS)
   - Submit for Production Review (Android)
   - Wait for approval (1-7 days)

4. **App Store Submission**
   - See `./store/DESCRIPTION.md` for listing content
   - See `./store/PRIVACY_POLICY.md` for privacy policy
   - See `./store/screenshots/README.md` for screenshot requirements

---

## Support

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **EAS Submit Docs:** https://docs.expo.dev/submit/introduction/
- **TestFlight Docs:** https://developer.apple.com/testflight/
- **Play Console Docs:** https://support.google.com/googleplay/android-developer/

---

## Security Notes

- **Never commit credentials** to version control
- **Use EAS remote credentials** for production (more secure than local)
- **Enable 2FA** on all developer accounts
- **Restrict keystore access** to authorized team members only
- **Rotate credentials** if compromised
- **Review EAS build logs** before distributing to testers

---

*Last Updated: 2026-01-23*
*Version: 1.0.0*
