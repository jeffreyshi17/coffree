# Android Widget Integration

This document explains how the Android campaign widget is integrated into the Expo app and how it survives `expo prebuild` operations.

## Problem

Expo's `expo prebuild --clean` command regenerates the entire `android/` directory from scratch, which deletes any custom native code placed there. This was causing the Android widget implementation to be deleted during builds.

## Solution

The widget files are stored OUTSIDE the `android/` directory in `mobile/native/android/` and are automatically copied into the correct locations during prebuild using an Expo config plugin.

## File Structure

```
mobile/
├── native/android/               # Safe from prebuild --clean
│   ├── widgets/
│   │   └── CampaignWidget.kt     # Widget implementation
│   └── res/
│       ├── xml/
│       │   └── campaign_widget_info.xml
│       ├── layout/
│       │   └── campaign_widget.xml
│       └── drawable/
│           └── widget_background.xml
├── plugins/
│   └── withAndroidWidget.js      # Expo config plugin
└── app.json                       # Includes plugin reference
```

## How It Works

1. **Source Files**: Widget files are stored in `mobile/native/android/` which is NOT touched by `expo prebuild`

2. **Config Plugin**: `mobile/plugins/withAndroidWidget.js` is an Expo config plugin that:
   - Runs automatically during `expo prebuild`
   - Copies widget files from `native/android/` to `android/` directory
   - Modifies `AndroidManifest.xml` to register the widget receiver

3. **App Configuration**: The plugin is registered in `app.json`:
   ```json
   {
     "expo": {
       "plugins": [
         "./plugins/withAndroidWidget.js"
       ]
     }
   }
   ```

## Verification

After running `expo prebuild`, verify the widget is integrated:

```bash
cd mobile

# Run prebuild
npx expo prebuild --platform android --clean

# Verify widget files exist
ls android/app/src/main/java/com/freecoffee/app/widgets/CampaignWidget.kt

# Verify AndroidManifest.xml includes widget receiver
cat android/app/src/main/AndroidManifest.xml | grep "CampaignWidget"
```

You should see:
- ✅ CampaignWidget.kt file exists
- ✅ AndroidManifest.xml contains `<receiver android:name=".widgets.CampaignWidget">`

## Widget Features

The Campaign Widget displays:
- Total count of available campaigns
- Last updated timestamp
- Direct link to open the app

The widget automatically refreshes:
- Every 30 minutes
- When the app is opened
- When the device boots
- When manually tapped

## Modifying the Widget

To modify the widget:

1. Edit files in `mobile/native/android/` (NOT in `android/` directory)
2. Run `npx expo prebuild --platform android` to copy changes
3. Build the app to test

**NEVER** edit files directly in `android/` directory - they will be lost on next prebuild!

## Technical Details

### Widget Configuration
- **Minimum Width**: 4 cells (250dp)
- **Minimum Height**: 1 cell (40dp)
- **Update Period**: 30 minutes
- **Resize Mode**: Horizontal and vertical

### Dependencies
- Uses Kotlin coroutines for async network requests
- Fetches data from `EXPO_PUBLIC_SUPABASE_URL/api/campaigns/count`
- Uses SharedPreferences for caching between updates

### AndroidManifest.xml Entry
```xml
<receiver
    android:name=".widgets.CampaignWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/campaign_widget_info" />
</receiver>
```

## Troubleshooting

### Widget Not Showing After Prebuild
1. Run `npx expo prebuild --platform android --clean`
2. Check plugin output in terminal
3. Verify files were copied (see Verification section above)

### Widget Not Updating
1. Check Supabase URL in `.env`
2. Verify app has internet permission
3. Check widget logs: `adb logcat | grep CampaignWidget`

### Build Errors
1. Ensure all XML files are valid
2. Verify Kotlin syntax in CampaignWidget.kt
3. Run `cd android && ./gradlew clean`

## References

- [Expo Config Plugins](https://docs.expo.dev/guides/config-plugins/)
- [Android App Widgets](https://developer.android.com/guide/topics/appwidgets)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)
