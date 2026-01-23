# Android Widget Setup Guide

This guide explains how to integrate the FreeCoffee Campaign Widget into your Android build.

## Prerequisites

- Expo CLI installed
- EAS CLI installed (for cloud builds)
- Android Studio installed (for local builds)

## Integration Steps

### Step 1: Prebuild the Android Project

Run the prebuild command to generate the native Android project:

\`\`\`bash
cd mobile
npx expo prebuild --platform android
\`\`\`

This will create the `android/` directory with the full native Android project.

### Step 2: Add Widget Receiver to AndroidManifest.xml

After prebuild, edit `mobile/android/app/src/main/AndroidManifest.xml` and add the widget receiver inside the `<application>` tag:

\`\`\`xml
<receiver
    android:name="com.freecoffee.app.widgets.CampaignWidget"
    android:exported="true"
    android:label="@string/app_name">

    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>

    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/campaign_widget_info" />
</receiver>
\`\`\`

### Step 3: Add Kotlin Dependencies

Ensure your `mobile/android/app/build.gradle` includes Kotlin and Coroutines:

\`\`\`gradle
dependencies {
    // ... other dependencies
    implementation "org.jetbrains.kotlin:kotlin-stdlib:1.8.0"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.4"
}
\`\`\`

And in `mobile/android/build.gradle`, ensure Kotlin plugin is applied:

\`\`\`gradle
buildscript {
    ext.kotlin_version = '1.8.0'
    dependencies {
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}
\`\`\`

### Step 4: Verify Widget Resources

Ensure all widget files are present:

- ✅ `android/app/src/main/java/com/freecoffee/app/widgets/CampaignWidget.kt`
- ✅ `android/app/src/main/res/xml/campaign_widget_info.xml`
- ✅ `android/app/src/main/res/layout/campaign_widget.xml`
- ✅ `android/app/src/main/res/drawable/widget_background.xml`
- ✅ `android/app/src/main/res/values/strings.xml`

### Step 5: Build and Test

#### Local Development Build

\`\`\`bash
npx expo run:android
\`\`\`

#### Cloud Build with EAS

\`\`\`bash
eas build --platform android --profile development
\`\`\`

## Automated Setup (Future Enhancement)

To automate this setup, create an Expo config plugin:

### Create `plugins/withAndroidWidget.js`:

\`\`\`javascript
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidWidget(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    // Add widget receiver
    const application = androidManifest.application[0];

    application.receiver = application.receiver || [];
    application.receiver.push({
      $: {
        'android:name': 'com.freecoffee.app.widgets.CampaignWidget',
        'android:exported': 'true',
        'android:label': '@string/app_name',
      },
      'intent-filter': [{
        action: [{
          $: {
            'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
          },
        }],
      }],
      'meta-data': [{
        $: {
          'android:name': 'android.appwidget.provider',
          'android:resource': '@xml/campaign_widget_info',
        },
      }],
    });

    return config;
  });
};
\`\`\`

### Update `app.json`:

\`\`\`json
{
  "expo": {
    "plugins": [
      "./plugins/withAndroidWidget"
    ]
  }
}
\`\`\`

## Troubleshooting

### Build Errors

**Error: Cannot resolve symbol 'CampaignWidget'**

- Ensure the Kotlin file is in the correct package path
- Verify package name matches: `com.freecoffee.app.widgets`

**Error: Resource not found: @xml/campaign_widget_info**

- Check that `campaign_widget_info.xml` is in `res/xml/` directory
- Run `./gradlew clean` and rebuild

**Error: Coroutines not found**

- Add Kotlin Coroutines dependency to `build.gradle`
- Sync Gradle files

### Widget Not Appearing

1. Check that the app is installed (not Expo Go)
2. Long-press home screen → Widgets
3. Look for "FreeCoffee" in the widget list
4. Check logcat for errors: `adb logcat | grep Widget`

### Widget Not Updating

- Android enforces minimum 30-minute update intervals
- Battery saver mode may delay updates
- Remove and re-add widget to force update

## Environment Configuration

Set the API URL in your build configuration:

### For EAS Build

In `eas.json`:

\`\`\`json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_API_URL": "http://10.0.2.2:3000"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-production-api.com"
      }
    }
  }
}
\`\`\`

### For Local Build

In `.env` or `.env.production`:

\`\`\`
EXPO_PUBLIC_API_URL=https://your-api.com
\`\`\`

## Testing

### Emulator Testing

\`\`\`bash
# Start emulator
emulator -avd Pixel_5_API_31

# Install app
npx expo run:android

# Add widget to home screen
# Long-press → Widgets → FreeCoffee
\`\`\`

### Physical Device Testing

\`\`\`bash
# Enable USB debugging on device
# Connect via USB

# Install
npx expo run:android --device

# Test widget functionality
\`\`\`

## Production Checklist

- [ ] Widget receiver added to AndroidManifest.xml
- [ ] Kotlin dependencies included in build.gradle
- [ ] All widget resources present and compiled
- [ ] API URL configured for production
- [ ] Widget tested on multiple Android versions (8.0+)
- [ ] Widget tested on multiple screen sizes
- [ ] Deep linking to Campaigns screen verified
- [ ] Widget preview image created (optional)
- [ ] Battery usage verified (should be minimal)

## Next Steps

1. Create Expo config plugin for automated setup
2. Add widget preview image for better UX in widget picker
3. Implement widget configuration activity
4. Add support for multiple widget sizes
5. Implement offline caching for widget data
6. Add WorkManager for more reliable updates
