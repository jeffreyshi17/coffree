# App Store Screenshots Guide

This guide provides specifications and guidelines for creating app store screenshots for FreeCoffee on both Apple App Store and Google Play Store.

## Overview

App store screenshots are crucial for conversion rates. They provide users with a visual preview of the app before downloading. High-quality, well-designed screenshots can significantly increase downloads.

## Screenshot Requirements

### Apple App Store

#### Required Sizes

You must provide screenshots for at least one device size. For maximum reach, provide all sizes:

| Device | Resolution | Aspect Ratio | Required |
|--------|-----------|--------------|----------|
| iPhone 6.9" (16 Pro Max) | 1320 x 2868 px | 19.5:9 | ✅ Yes |
| iPhone 6.7" (15 Plus/Pro Max) | 1290 x 2796 px | 19.5:9 | ✅ Yes |
| iPhone 6.5" (XS Max, 11 Pro Max) | 1242 x 2688 px | 19.5:9 | Recommended |
| iPhone 6.1" (15/14/13) | 1179 x 2556 px | 19.5:9 | Recommended |
| iPhone 5.5" (8 Plus) | 1242 x 2208 px | 16:9 | Optional |
| iPad Pro 12.9" (6th gen) | 2048 x 2732 px | 4:3 | Optional |
| iPad Pro 12.9" (2nd gen) | 2048 x 2732 px | 4:3 | Optional |

**Notes:**
- Minimum 3 screenshots, maximum 10 screenshots per device size
- PNG or JPEG format (PNG recommended for quality)
- RGB color space
- No alpha channels or transparency
- Maximum file size: 500 MB per screenshot

### Google Play Store

#### Required Sizes

| Device | Resolution | Aspect Ratio | Required |
|--------|-----------|--------------|----------|
| Phone | 1080 x 1920 px or higher | 16:9 or 9:16 | ✅ Yes |
| 7-inch Tablet | 1200 x 1920 px | 16:10 | Recommended |
| 10-inch Tablet | 1920 x 1200 px | 16:10 | Recommended |

**Notes:**
- Minimum 2 screenshots, maximum 8 screenshots
- PNG or JPEG format (24-bit PNG or JPEG with no alpha)
- Minimum dimension: 320 px
- Maximum dimension: 3840 px
- Aspect ratio constraints: 16:9 to 9:16

## Screenshot Content Strategy

### Recommended Screenshot Order

Include screenshots in this order to maximize conversion:

1. **Home/Subscribe Screen** - Show the simple subscription form
2. **Success State** - Show confirmation after subscribing
3. **Campaigns List** - Display available coffee campaigns
4. **Campaign Details** - Highlight campaign information
5. **Push Notification** - Show notification on lock screen/notification center
6. **Home Screen Widget** - Display widget showing campaign count
7. **Settings Screen** - Show subscription management
8. **Offline Mode** - Demonstrate offline capability

### Design Guidelines

#### Text Overlays

Add descriptive text overlays to explain features:

- **Font**: Use clear, legible sans-serif fonts (e.g., SF Pro for iOS, Roboto for Android)
- **Font Size**: Large enough to read on small app store thumbnails
- **Contrast**: Ensure high contrast between text and background
- **Language**: Use concise, benefit-focused copy

Example text overlays:
- "Subscribe Once, Never Miss Free Coffee ☕"
- "Instant Push Notifications for New Campaigns"
- "Quick Access with Home Screen Widget"
- "Works Offline - View Campaigns Anytime"

#### Visual Elements

- **Device Frames**: Use official Apple/Android device frames (optional but recommended)
- **Background**: Use subtle gradient or solid color matching brand (#8B4513 coffee brown)
- **Annotations**: Add arrows or highlights to draw attention to key features
- **Call-outs**: Use numbered badges to explain multi-step processes

#### App Store Guidelines Compliance

**Apple App Store - Do NOT include:**
- ❌ References to other mobile platforms
- ❌ Price or promotional text ("Free", "On Sale")
- ❌ References to Apple awards (without permission)
- ❌ Images of Apple hardware (unless using official templates)
- ❌ Screenshots with notch/Dynamic Island cropped incorrectly

**Google Play Store - Do NOT include:**
- ❌ Graphic violence or sexual content
- ❌ Misleading information
- ❌ Poor quality or pixelated images
- ❌ Text-only screenshots (must show app interface)

## Screenshot Checklist

### Pre-Production

- [ ] Populate test data in the app (sample campaigns, phone numbers)
- [ ] Use real device or high-quality simulator/emulator
- [ ] Ensure UI is in final production state (no debug info, lorem ipsum, etc.)
- [ ] Set device to light mode (or create both light and dark versions)
- [ ] Remove status bar personal info (time = 9:41, full battery, full signal)
- [ ] Disable notifications from other apps

### Production

- [ ] Capture screenshots at native resolution (use simulator/emulator)
- [ ] Take screenshots in portrait orientation (primary)
- [ ] Ensure all text is readable and not truncated
- [ ] Verify colors match brand guidelines
- [ ] Check for spelling and grammar errors
- [ ] Capture each key screen/feature

### Post-Production

- [ ] Add device frames (optional but recommended)
- [ ] Add text overlays to explain features
- [ ] Add background design elements
- [ ] Ensure consistent styling across all screenshots
- [ ] Export at correct resolutions for each device size
- [ ] Compress files while maintaining quality (use ImageOptim, TinyPNG)
- [ ] Verify file sizes are under limits

### Final Review

- [ ] Preview screenshots at small size (thumbnail view)
- [ ] Verify text is still readable at small size
- [ ] Check screenshot order tells a compelling story
- [ ] Confirm compliance with Apple/Google guidelines
- [ ] Get feedback from team members
- [ ] Test on multiple device sizes in app store preview tools

## Screenshot Files Organization

Organize your screenshot files using this folder structure:

```
mobile/store/screenshots/
├── ios/
│   ├── 6.9-inch/          # iPhone 16 Pro Max
│   │   ├── 01-subscribe.png
│   │   ├── 02-success.png
│   │   ├── 03-campaigns.png
│   │   ├── 04-notification.png
│   │   └── 05-widget.png
│   ├── 6.7-inch/          # iPhone 15 Plus
│   │   └── ...
│   └── ipad-12.9/         # iPad Pro
│       └── ...
├── android/
│   ├── phone/
│   │   ├── 01-subscribe.png
│   │   ├── 02-success.png
│   │   ├── 03-campaigns.png
│   │   ├── 04-notification.png
│   │   └── 05-widget.png
│   ├── tablet-7/
│   │   └── ...
│   └── tablet-10/
│       └── ...
└── README.md              # This file
```

## Screenshot Creation Tools

### Recommended Tools

1. **Screenshot Capture**
   - iOS Simulator (Xcode) - `Cmd + S` to save screenshot
   - Android Emulator - Use screenshot button in toolbar
   - Physical devices - Native screenshot functionality

2. **Design & Editing**
   - **Figma** (Free for personal use) - Best for adding overlays and frames
   - **Sketch** (Mac only) - Professional design tool
   - **Adobe Photoshop** - Advanced editing
   - **Canva** - Easy-to-use online tool with templates

3. **Device Frames**
   - **MockUPhone** - https://mockuphone.com (Free)
   - **Screely** - https://screely.com (Free)
   - **Shots.so** - https://shots.so (Free with watermark)
   - **Rotato** - https://rotato.app (Paid, 3D device mockups)

4. **Optimization**
   - **ImageOptim** (Mac) - Lossless compression
   - **TinyPNG** - https://tinypng.com (Online compression)
   - **Squoosh** - https://squoosh.app (Google's image optimizer)

### Templates

Consider using these Figma templates for app store screenshots:
- **App Store Screenshot Template** by Figma Community
- **Play Store Asset Templates** by Material Design

## Localization

If you plan to support multiple languages, create localized versions of screenshots:

### Priority Languages for FreeCoffee

1. **English (US)** - Primary
2. **Spanish (US)** - Large Spanish-speaking user base in US
3. **French (Canada)** - For Canadian users
4. **Portuguese (Brazil)** - If expanding to Brazil

### Localization Guidelines

- Translate all text overlays
- Keep text concise to fit different language lengths
- Use native speakers to verify translations
- Maintain consistent visual style across languages

## App Preview Videos (Optional but Recommended)

In addition to screenshots, consider creating app preview videos:

### Apple App Store
- Duration: 15-30 seconds
- Format: MP4 or MOV (H.264 or HEVC codec)
- Resolution: Same as screenshot requirements
- Maximum file size: 500 MB
- Shows app in action, no voice-over needed

### Google Play Store
- Duration: 30 seconds to 2 minutes
- Format: MP4 or MOV
- Resolution: 1920 x 1080 minimum
- Maximum file size: 100 MB
- Can include voice-over and captions

## Example Screenshot Captions

Use these caption ideas for text overlays:

### Screenshot 1 - Subscribe Screen
**Heading:** "Get Started in Seconds"
**Subheading:** "Enter your phone number and never miss free coffee"

### Screenshot 2 - Success State
**Heading:** "You're All Set! ☕"
**Subheading:** "We'll notify you when new campaigns arrive"

### Screenshot 3 - Campaigns
**Heading:** "Browse Available Campaigns"
**Subheading:** "See all active Capital One coffee offers in one place"

### Screenshot 4 - Notification
**Heading:** "Instant Push Notifications"
**Subheading:** "Be first to know about new free coffee campaigns"

### Screenshot 5 - Widget
**Heading:** "Home Screen Widget"
**Subheading:** "Check campaign count without opening the app"

### Screenshot 6 - Offline
**Heading:** "Works Offline"
**Subheading:** "View campaigns even without internet connection"

### Screenshot 7 - Settings
**Heading:** "Easy Management"
**Subheading:** "View subscription and unsubscribe anytime"

## Quality Assurance

Before submitting to app stores:

1. **Visual Inspection**
   - ✅ All screenshots are crisp and clear (no blur or pixelation)
   - ✅ Colors are vibrant and accurate
   - ✅ Text is fully legible at small sizes
   - ✅ No awkward cropping or cutoff elements

2. **Content Accuracy**
   - ✅ App functionality matches what's shown in screenshots
   - ✅ No outdated UI elements or old app versions
   - ✅ All text is accurate and grammatically correct
   - ✅ Brand colors and fonts are consistent

3. **Compliance**
   - ✅ No prohibited content
   - ✅ No references to competing platforms
   - ✅ File sizes and dimensions meet requirements
   - ✅ Screenshots represent actual app functionality (not conceptual)

## App Store Connect / Play Console Upload

### Apple App Store Connect

1. Log in to App Store Connect
2. Select your app
3. Go to "App Information" → "App Previews and Screenshots"
4. Select device size
5. Drag and drop screenshots in desired order
6. Add optional captions (below screenshots)
7. Save changes

### Google Play Console

1. Log in to Google Play Console
2. Select your app
3. Go to "Store presence" → "Main store listing"
4. Scroll to "Screenshots" section
5. Upload screenshots for phone (required) and tablet (optional)
6. Drag to reorder if needed
7. Save changes

## Maintenance

### When to Update Screenshots

Update your screenshots when:
- You release a major app redesign
- You add significant new features
- Current screenshots show outdated UI
- Competitors have better-looking screenshots
- Conversion rate is declining

### A/B Testing

Consider A/B testing different screenshot sets:
- Different feature ordering
- With vs. without device frames
- Light vs. dark mode
- Different text overlays
- Different visual treatments

Use app store optimization (ASO) tools to track which screenshots perform better.

## Resources

### Official Guidelines

- **Apple App Store**: https://developer.apple.com/app-store/product-page/
- **Google Play Store**: https://support.google.com/googleplay/android-developer/answer/9866151

### ASO Tools

- **App Radar** - https://appradar.com
- **Sensor Tower** - https://sensortower.com
- **AppTweak** - https://apptweak.com

### Design Inspiration

- **Mobbin** - https://mobbin.com (app design patterns)
- **Screenlane** - https://screenlane.com (app store screenshots)
- **App Store Screenshots** - https://www.appstoresscreenshots.com

## Support

If you need help creating screenshots:

- Check the FreeCoffee GitHub repository for example scripts
- Ask the community in GitHub Discussions
- Hire a designer on Fiverr or Upwork for professional screenshots

---

**Last Updated:** January 23, 2026
**Version:** 1.0.0

Good luck with your app store submission! 🚀☕
