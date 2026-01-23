# FreeCoffee Android Widget

This directory contains the Android home screen widget implementation for the FreeCoffee app.

## Overview

The Campaign Widget displays the count of available coffee campaigns directly on the Android home screen, allowing users to quickly see how many campaigns are active without opening the app.

## Features

- **Real-time Campaign Count**: Displays the number of valid, non-expired campaigns
- **Distributed Vouchers**: Shows the total number of vouchers sent
- **Auto-refresh**: Updates every 15 minutes
- **Coffee-themed Design**: Gradient background matching the app's coffee brown theme (#8B4513)
- **Deep Linking**: Tapping the widget opens the app to the Campaigns screen
- **Error Handling**: Gracefully handles network errors with user-friendly messages

## Files

### Widget Code
- `CampaignWidget.kt`: Main widget provider implementing AppWidgetProvider
  - Fetches data from `/api/campaigns/count` endpoint
  - Updates widget UI with campaign count and distributed vouchers
  - Handles click events to deep link into the app
  - Implements coroutines for async network requests

### Resources
- `res/xml/campaign_widget_info.xml`: Widget metadata configuration
  - Minimum size: 180dp × 110dp
  - Update interval: 15 minutes (900000ms)
  - Supports horizontal and vertical resizing

- `res/layout/campaign_widget.xml`: Widget UI layout
  - Coffee cup emoji and "FreeCoffee" header
  - Large campaign count display
  - Distributed vouchers count
  - Last updated timestamp

- `res/drawable/widget_background.xml`: Coffee brown gradient background
  - Start color: #8B4513 (Saddle Brown)
  - End color: #654321 (Dark Brown)
  - 16dp rounded corners

- `res/values/strings.xml`: String resources
  - App name and widget description

## Setup

### 1. Build Configuration

The widget requires a development or production build (not compatible with Expo Go):

\`\`\`bash
# Development build
npx expo run:android

# Production build via EAS
eas build --platform android --profile production
\`\`\`

### 2. AndroidManifest.xml

The widget is registered in `AndroidManifest.xml` (auto-generated during prebuild):

\`\`\`xml
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
\`\`\`

### 3. Permissions

No special permissions required. The widget uses the app's existing internet permission.

### 4. Dependencies

The widget uses:
- Kotlin Coroutines for async operations
- Android AppWidget APIs (built-in)
- Standard HTTP networking (HttpURLConnection)
- JSON parsing (org.json)

## Usage

### Adding the Widget

1. Long-press on the home screen
2. Tap "Widgets"
3. Scroll to "FreeCoffee"
4. Drag the Campaign Widget to your home screen
5. Widget will automatically fetch and display campaign count

### Widget Behavior

- **Initial Load**: Shows "..." while fetching data
- **Success**: Displays campaign count, distributed vouchers, and update time
- **Error**: Shows "!" with "Unable to load" message
- **Click**: Opens app to Campaigns screen (`freecoffee://campaigns`)

## API Integration

The widget fetches data from:

**Endpoint**: `GET /api/campaigns/count`

**Response**:
\`\`\`json
{
  "count": 3,
  "distributed": 12
}
\`\`\`

**Configuration**:
- API URL: Set via `EXPO_PUBLIC_API_URL` environment variable
- Default: `http://localhost:3000`
- Timeout: 10 seconds
- Retry: Manual (tap widget to retry)

## Customization

### Update Frequency

To change the update interval, modify `campaign_widget_info.xml`:

\`\`\`xml
<appwidget-provider
    android:updatePeriodMillis="1800000"  <!-- 30 minutes -->
    ...>
</appwidget-provider>
\`\`\`

Note: Minimum allowed value is 30 minutes (1800000ms) due to Android battery optimization.

### Widget Size

Current size: 180dp × 110dp (approximately 2×2 grid cells)

To change, modify `campaign_widget_info.xml`:

\`\`\`xml
<appwidget-provider
    android:minWidth="180dp"
    android:minHeight="110dp"
    ...>
</appwidget-provider>
\`\`\`

### Colors

To match app theme, edit `widget_background.xml`:

\`\`\`xml
<gradient
    android:startColor="#YOUR_COLOR"
    android:endColor="#YOUR_COLOR"
    ...>
</gradient>
\`\`\`

## Troubleshooting

### Widget Not Appearing

1. Ensure you're running a development or production build (not Expo Go)
2. Check that `AndroidManifest.xml` includes the widget receiver
3. Verify widget resources are in the correct directories
4. Run `npx expo prebuild --clean` to regenerate Android project

### Widget Shows Error

1. Check network connectivity
2. Verify API URL is correct in environment variables
3. Test API endpoint manually: `curl https://your-api.com/api/campaigns/count`
4. Check Android logcat for error messages: `adb logcat | grep CampaignWidget`

### Widget Not Updating

1. Android limits update frequency to conserve battery
2. Minimum update interval is 30 minutes
3. Force update by removing and re-adding widget
4. Check that device isn't in battery saver mode

### Deep Link Not Working

1. Verify app handles `freecoffee://` scheme in `app.json`:
   \`\`\`json
   {
     "scheme": "freecoffee"
   }
   \`\`\`
2. Ensure Campaigns screen exists at `/(tabs)/campaigns`
3. Test deep link manually: `adb shell am start -a android.intent.action.VIEW -d "freecoffee://campaigns"`

## Testing

### Local Development

1. Install app: `npx expo run:android`
2. Add widget to home screen
3. Verify campaign count displays
4. Trigger API change and wait for update
5. Tap widget to verify deep linking

### Production Testing

1. Build: `eas build --platform android --profile production`
2. Install on physical device
3. Test widget functionality
4. Verify production API integration

## Technical Notes

- **API Calls**: Made on the main widget update cycle
- **Threading**: Network calls run on IO dispatcher (Kotlin coroutines)
- **Memory**: Widget is stateless; data fetched on each update
- **Battery Impact**: Minimal due to 15-minute update interval
- **Network Usage**: ~1KB per update (JSON response)

## Future Enhancements

- [ ] Add widget configuration activity for customization
- [ ] Support multiple widget sizes (small, medium, large)
- [ ] Add refresh button to widget layout
- [ ] Cache data to show last known count when offline
- [ ] Add widget preview image for widget picker
- [ ] Implement WorkManager for more reliable background updates

## Related Files

- iOS Widget: `mobile/ios/widgets/CampaignWidget.swift`
- API Endpoint: `app/api/campaigns/count/route.ts`
- Mobile Service: `mobile/services/campaignService.ts`
