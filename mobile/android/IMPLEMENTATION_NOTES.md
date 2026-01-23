# Android Widget Implementation Notes

## Implementation Overview

This Android widget implementation provides home screen widget functionality for the FreeCoffee mobile app, displaying campaign counts directly on the user's home screen.

## Files Created

### Widget Code
1. **`app/src/main/java/com/freecoffee/app/widgets/CampaignWidget.kt`**
   - Main widget provider class extending `AppWidgetProvider`
   - Implements async API calls using Kotlin coroutines
   - Fetches campaign count from `/api/campaigns/count` endpoint
   - Updates widget UI with campaign and distribution data
   - Handles deep linking to Campaigns screen
   - Includes error handling and loading states

### Widget Resources
2. **`app/src/main/res/xml/campaign_widget_info.xml`**
   - Widget metadata and configuration
   - Size: 180dp × 110dp minimum
   - Update interval: 15 minutes (900000ms)
   - Supports horizontal/vertical resizing

3. **`app/src/main/res/layout/campaign_widget.xml`**
   - Widget UI layout in XML
   - Coffee cup emoji + "FreeCoffee" header
   - Large campaign count display
   - Distributed vouchers count
   - Last updated timestamp
   - References gradient background

4. **`app/src/main/res/drawable/widget_background.xml`**
   - Coffee brown gradient background (#8B4513 → #654321)
   - Matches iOS widget theme
   - 16dp rounded corners

5. **`app/src/main/res/values/strings.xml`**
   - App name: "FreeCoffee"
   - Widget description: "Stay updated with available coffee campaigns"

### Documentation
6. **`app/src/main/java/com/freecoffee/app/widgets/README.md`**
   - Comprehensive widget documentation
   - Features, setup, customization, troubleshooting

7. **`app/src/main/AndroidManifest.xml.template`**
   - Template showing widget receiver configuration
   - To be added to AndroidManifest.xml during build

8. **`android/WIDGET_SETUP.md`**
   - Step-by-step integration guide
   - Prebuild instructions
   - Gradle configuration
   - Testing procedures

9. **`android/IMPLEMENTATION_NOTES.md`** (this file)
   - Implementation summary
   - Design decisions
   - Technical notes

## Design Decisions

### Technology Choices

1. **Kotlin over Java**
   - Modern Android development standard
   - Coroutines for clean async code
   - Null safety and concise syntax

2. **AppWidgetProvider**
   - Standard Android widget framework
   - Well-documented and stable
   - Compatible with all Android versions 8.0+

3. **Kotlin Coroutines**
   - Non-blocking network requests
   - Clean error handling
   - Better than AsyncTask or callbacks

4. **HttpURLConnection**
   - Lightweight networking (no external dependencies)
   - Sufficient for simple GET requests
   - Reduces app size

### API Integration

- **Endpoint**: `GET /api/campaigns/count`
- **Response**: `{ "count": 3, "distributed": 12 }`
- **Timeout**: 10 seconds
- **Error Handling**: Graceful degradation with error state UI
- **No Caching**: Widget fetches fresh data on each update (consideration: add caching in future)

### UI Design

- **Theme**: Coffee brown gradient matching iOS widget and app theme
- **Layout**: Linear layout with vertical stack
- **Text Hierarchy**:
  - Header: 14sp bold white
  - Count: 36sp bold white (main focus)
  - Label: 12sp semi-transparent white
  - Distributed: 10sp semi-transparent white
  - Updated: 10sp very transparent white
- **Spacing**: 16dp padding, 8dp margins between elements
- **Shape**: 16dp rounded corners for modern look

### Deep Linking

- **Scheme**: `freecoffee://campaigns`
- **Configured in**: `app.json` (`"scheme": "freecoffee"`)
- **Behavior**: Opens app to Campaigns tab
- **Implementation**: PendingIntent with FLAG_IMMUTABLE (Android 12+)

## Technical Considerations

### Update Strategy

- **Interval**: 15 minutes (900000ms)
- **Why not shorter?** Android enforces 30-minute minimum for battery optimization
- **Actual interval**: Widget specifies 15 minutes but Android may batch updates
- **Manual refresh**: User can remove/re-add widget to force update

### Battery Impact

- **Network calls**: ~1KB per update
- **Frequency**: Maximum 4 times per hour (if Android allows)
- **Background work**: Minimal - only HTTP request and UI update
- **Coroutines**: Automatically cancelled if widget removed

### Threading

- **Main thread**: Widget callbacks, UI updates
- **IO thread**: Network requests via Dispatchers.IO
- **No blocking**: All network calls are async
- **Error handling**: Try-catch with fallback UI

### Memory Management

- **Stateless widget**: No persistent data stored
- **API responses**: Small JSON objects (~100 bytes)
- **View recycling**: RemoteViews are efficient
- **No leaks**: Coroutines scoped to update cycle

## Differences from iOS Widget

| Feature | iOS (Swift) | Android (Kotlin) |
|---------|-------------|------------------|
| Framework | WidgetKit | AppWidgetProvider |
| UI | SwiftUI | XML Layouts |
| Async | async/await | Coroutines |
| Networking | URLSession | HttpURLConnection |
| Update interval | 15 min (actual) | 15 min (requested) |
| Sizes | Small, Medium | Resizable (180×110 min) |
| Preview | PreviewProvider | Widget picker |
| Config | Info.plist | widget_info.xml |

## Dependencies

### Required

- Kotlin Standard Library (included in React Native 0.68+)
- Kotlin Coroutines (`kotlinx-coroutines-android`)
- Android SDK 26+ (Android 8.0+)

### Optional

- None - widget uses only standard Android APIs

## Build Integration

### Expo Prebuild

When running `npx expo prebuild`, the widget files are included in the generated Android project:

1. Kotlin files copied to `android/app/src/main/java/`
2. Resources copied to `android/app/src/main/res/`
3. **Manual step required**: Add receiver to `AndroidManifest.xml`

### Gradle Configuration

Required in `android/app/build.gradle`:

\`\`\`gradle
dependencies {
    implementation "org.jetbrains.kotlin:kotlin-stdlib:1.8.0"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.4"
}
\`\`\`

### AndroidManifest.xml

Required receiver configuration:

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

## Testing Notes

### Development Testing

1. Build: `npx expo run:android`
2. Install on emulator or device
3. Long-press home screen → Widgets → FreeCoffee
4. Add widget to home screen
5. Verify campaign count displays
6. Tap widget to test deep linking

### Production Testing

1. Build: `eas build --platform android --profile production`
2. Install APK/AAB on physical device
3. Test widget functionality with production API
4. Verify battery usage is minimal
5. Test on various Android versions (8.0, 9.0, 10, 11, 12, 13, 14)

## Known Limitations

1. **Expo Go Incompatible**: Widget requires native code, not available in Expo Go
2. **Manual AndroidManifest**: Receiver must be added manually (future: create Expo plugin)
3. **No Configuration**: Widget doesn't have user-configurable options (future enhancement)
4. **No Offline Mode**: Widget requires network; doesn't cache data (future enhancement)
5. **Fixed Size**: Only one size supported, though resizable (future: multiple size variants)
6. **No Preview Image**: Widget picker shows generic preview (future: add custom preview)

## Future Enhancements

### High Priority
- [ ] Create Expo config plugin to auto-add receiver to AndroidManifest
- [ ] Add offline caching using SharedPreferences
- [ ] Create widget preview image for better UX

### Medium Priority
- [ ] Support multiple widget sizes (1×1, 2×1, 2×2, 4×1)
- [ ] Add widget configuration activity for customization
- [ ] Implement WorkManager for more reliable updates
- [ ] Add refresh button to widget layout

### Low Priority
- [ ] Add widget themes (light/dark mode support)
- [ ] Animated transitions for count changes
- [ ] Interactive widget elements (Android 12+)
- [ ] Support for Android 12+ Material You theming

## Maintenance Notes

### API Changes

If `/api/campaigns/count` endpoint changes:
1. Update response parsing in `CampaignWidget.kt` (line ~179)
2. Update data class `CampaignData` if needed
3. Update widget layout if new fields added
4. Test thoroughly before deployment

### UI Updates

To update widget appearance:
1. Edit `campaign_widget.xml` for layout changes
2. Edit `widget_background.xml` for color/shape changes
3. Edit `strings.xml` for text changes
4. Rebuild app to see changes

### Dependency Updates

Keep Kotlin and Coroutines updated:

\`\`\`gradle
// Check for updates
./gradlew dependencyUpdates

// Update versions in build.gradle
ext.kotlin_version = '1.9.0' // latest stable
implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3"
\`\`\`

## Support & Troubleshooting

For issues, check:
1. Logcat: `adb logcat | grep CampaignWidget`
2. Widget setup guide: `android/WIDGET_SETUP.md`
3. Widget README: `widgets/README.md`
4. iOS widget (for comparison): `ios/widgets/CampaignWidget.swift`

## References

- [Android Widgets Guide](https://developer.android.com/develop/ui/views/appwidgets)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)
- [iOS Widget Implementation](../ios/widgets/README.md)
