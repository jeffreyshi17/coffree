# FreeCoffee iOS Widget

This directory contains the iOS home screen widget implementation using WidgetKit.

## Overview

The FreeCoffee widget displays the current count of available coffee campaigns directly on your iOS home screen.

## Features

- **Real-time Updates**: Widget automatically refreshes every 15 minutes
- **Campaign Count**: Shows the number of active campaigns
- **Distributed Count**: Displays total vouchers sent (medium/large widgets)
- **Deep Linking**: Tapping the widget opens the Campaigns screen in the app
- **Beautiful Design**: Coffee-themed gradient with clear typography
- **Error Handling**: Graceful fallback when network is unavailable

## Widget Sizes

- **Small**: Displays campaign count and app icon
- **Medium**: Includes campaign count, distributed count, and last updated time

## Requirements

⚠️ **Important**: WidgetKit requires a **development build** and cannot run in Expo Go.

### Building the Widget

1. **Prerequisites**:
   - Xcode 14 or later
   - iOS 14 or later on device
   - Apple Developer account (for device testing)

2. **Build with EAS**:
   ```bash
   cd mobile
   eas build --profile development --platform ios
   ```

3. **Local Development Build**:
   ```bash
   cd mobile
   npx expo prebuild
   npx expo run:ios
   ```

### Adding the Widget to Home Screen

1. Long press on your home screen
2. Tap the "+" button in the top-left corner
3. Search for "FreeCoffee"
4. Select the widget size (Small or Medium)
5. Tap "Add Widget"

## Configuration

The widget uses the same API endpoint as the mobile app:
- **API URL**: Set via `EXPO_PUBLIC_API_URL` environment variable
- **Default**: `http://localhost:3000`
- **Endpoint**: `/api/campaigns/count`

### App Groups

The widget uses iOS App Groups for data sharing between the app and widget extension:
- **Group ID**: `group.com.freecoffee.app`

This is configured in `app.json` under `ios.entitlements`.

## Technical Details

### Files

- **CampaignWidget.swift**: Main widget implementation
  - `CampaignProvider`: Handles timeline updates and data fetching
  - `CampaignWidgetView`: SwiftUI view for widget UI
  - `CampaignEntry`: Timeline entry model
  - `CampaignData`: API response model

- **Info.plist**: Widget extension metadata and configuration

### API Integration

The widget fetches data from the campaigns API:

```swift
GET /api/campaigns/count
Response: {
  "count": 3,
  "distributed": 12
}
```

### Update Policy

- **Refresh Interval**: 15 minutes
- **Timeline Policy**: `.after(nextUpdate)`
- **Timeout**: 10 seconds for API requests

### Error Handling

The widget handles various error scenarios:
- Network unavailability
- API errors
- Invalid responses
- Timeout errors

When an error occurs, the widget displays an error icon with a helpful message.

## Troubleshooting

### Widget Not Showing Up

1. Ensure you're using a development build (not Expo Go)
2. Check that the bundle identifier matches: `com.freecoffee.app`
3. Verify App Groups are configured correctly in Xcode

### Widget Not Updating

1. Check network connectivity
2. Verify the API URL is accessible from the device
3. Check iOS Settings > Screen Time > Background App Refresh
4. Force refresh by removing and re-adding the widget

### API Connection Issues

1. Ensure `NSAppTransportSecurity` is configured in Info.plist
2. For local development, use your computer's IP address instead of `localhost`
3. Check firewall settings allow incoming connections

## Future Enhancements

- [ ] Support for large widget size
- [ ] Configurable widget preferences
- [ ] Display individual campaign details
- [ ] Interactive widget actions (iOS 17+)
- [ ] StandBy mode support (iOS 17+)

## References

- [WidgetKit Documentation](https://developer.apple.com/documentation/widgetkit)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [App Groups](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_security_application-groups)
