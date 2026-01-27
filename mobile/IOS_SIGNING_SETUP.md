# iOS App Signing Configuration

This document explains the iOS app signing configuration for the FreeCoffee mobile app.

## Overview

The app signing is configured in `eas.json` to use EAS Build's managed credentials system. This means EAS Build will automatically handle certificate and provisioning profile management.

## Configuration Details

### Production Profile

```json
"production": {
  "autoIncrement": true,
  "ios": {
    "simulator": false,
    "bundleIdentifier": "com.freecoffee.app",
    "credentialsSource": "remote"
  }
}
```

#### Key Settings:

- **bundleIdentifier**: `com.freecoffee.app` - Must match the identifier in `app.json`
- **credentialsSource**: `remote` - EAS Build manages certificates and provisioning profiles automatically
- **simulator**: `false` - Production builds are for physical devices only
- **autoIncrement**: `true` - Automatically increments build number with each build

### Preview Profile

The preview profile also includes the bundle identifier for TestFlight builds:

```json
"preview": {
  "distribution": "internal",
  "ios": {
    "simulator": false,
    "bundleIdentifier": "com.freecoffee.app"
  }
}
```

## Prerequisites

Before building for iOS, you need:

1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com

2. **EAS CLI** (already configured)
   ```bash
   npm install -g eas-cli
   ```

3. **EAS Account & Authentication**
   ```bash
   eas login
   ```

4. **Configure EAS Project**
   ```bash
   cd mobile
   eas build:configure
   ```

## Building for iOS

### First-Time Setup

On your first production build, EAS will:

1. Prompt you to log in to your Apple Developer account
2. Automatically create a Distribution Certificate
3. Generate an App Store Provisioning Profile
4. Store these credentials securely on EAS servers

### Build Commands

**Preview Build (TestFlight):**
```bash
cd mobile
eas build --platform ios --profile preview
```

**Production Build (App Store):**
```bash
cd mobile
eas build --platform ios --profile production
```

## Credentials Management

EAS Build manages your credentials automatically when using `credentialsSource: "remote"`:

- **Distribution Certificate**: Used to sign the app binary
- **Provisioning Profile**: Links the app to your Apple Developer account
- **Push Notification Certificate**: For sending push notifications

### View Credentials

```bash
eas credentials
```

### Manual Credential Management

If you need to use local credentials instead:

1. Update `eas.json`:
   ```json
   "ios": {
     "credentialsSource": "local"
   }
   ```

2. Place credentials in your project:
   - `ios/certs/distribution.p12` - Distribution certificate
   - `ios/profiles/AppStore.mobileprovision` - Provisioning profile

## App Capabilities

The app requires these capabilities (configured in `app.json`):

- **Push Notifications** - For campaign alerts
- **App Groups** (`group.com.freecoffee.app`) - For widget data sharing
- **Background Modes** - For remote notifications

## Troubleshooting

### "No credentials found"
Run `eas credentials` and follow prompts to set up certificates.

### "Bundle identifier mismatch"
Ensure `bundleIdentifier` in `eas.json` matches `ios.bundleIdentifier` in `app.json`.

### "Invalid provisioning profile"
Regenerate the profile:
```bash
eas credentials --platform ios
# Select "Set up ad-hoc provisioning"
```

### "Certificate expired"
Apple certificates expire after 1 year. Regenerate:
```bash
eas credentials --platform ios
# Select "Distribution Certificate" → "Remove" → "Add new"
```

## Submission to App Store

After a successful production build:

```bash
cd mobile
eas submit --platform ios --latest
```

This will:
1. Upload the build to App Store Connect
2. Submit for App Store review (if configured)

You can also manually upload via:
- Download the `.ipa` from EAS Build
- Upload via Xcode's Transporter app
- Or submit through App Store Connect web interface

## Security Notes

- **Never commit certificates or provisioning profiles** to version control
- EAS stores credentials encrypted on their servers
- Use environment variables for sensitive keys (`EXPO_PUBLIC_*`)
- The `credentialsSource: "remote"` approach is recommended for security

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS Credentials](https://docs.expo.dev/app-signing/app-credentials/)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
