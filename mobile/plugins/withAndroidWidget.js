const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to copy Android widget files during prebuild
 * This ensures the widget survives `expo prebuild --clean` operations
 */
const withAndroidWidget = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;

      // Source files (outside android/ directory, safe from prebuild --clean)
      const sourceRoot = path.join(projectRoot, 'native', 'android');

      // Destination paths (inside android/ directory, managed by prebuild)
      const androidProjectPath = config.modRequest.platformProjectRoot;

      // File mappings: source -> destination
      const fileMappings = [
        {
          src: path.join(sourceRoot, 'widgets', 'CampaignWidget.kt'),
          dest: path.join(androidProjectPath, 'app', 'src', 'main', 'java', 'com', 'freecoffee', 'app', 'widgets', 'CampaignWidget.kt'),
        },
        {
          src: path.join(sourceRoot, 'res', 'xml', 'campaign_widget_info.xml'),
          dest: path.join(androidProjectPath, 'app', 'src', 'main', 'res', 'xml', 'campaign_widget_info.xml'),
        },
        {
          src: path.join(sourceRoot, 'res', 'layout', 'campaign_widget.xml'),
          dest: path.join(androidProjectPath, 'app', 'src', 'main', 'res', 'layout', 'campaign_widget.xml'),
        },
        {
          src: path.join(sourceRoot, 'res', 'drawable', 'widget_background.xml'),
          dest: path.join(androidProjectPath, 'app', 'src', 'main', 'res', 'drawable', 'widget_background.xml'),
        },
      ];

      // Copy each file
      for (const mapping of fileMappings) {
        const { src, dest } = mapping;

        // Check if source file exists
        if (!fs.existsSync(src)) {
          console.warn(`[withAndroidWidget] Source file not found: ${src}`);
          continue;
        }

        // Create destination directory if it doesn't exist
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }

        // Copy file
        fs.copyFileSync(src, dest);
        console.log(`[withAndroidWidget] Copied: ${path.relative(projectRoot, src)} -> ${path.relative(androidProjectPath, dest)}`);
      }

      // Modify AndroidManifest.xml to register the widget receiver
      const manifestPath = path.join(androidProjectPath, 'app', 'src', 'main', 'AndroidManifest.xml');

      if (fs.existsSync(manifestPath)) {
        let manifest = fs.readFileSync(manifestPath, 'utf-8');

        // Check if widget receiver is already registered
        if (!manifest.includes('CampaignWidget')) {
          // Find the closing </application> tag
          const applicationCloseTag = '</application>';
          const widgetReceiverXml = `
        <!-- Campaign Widget Receiver -->
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

    `;

          // Insert widget receiver before </application>
          manifest = manifest.replace(applicationCloseTag, widgetReceiverXml + applicationCloseTag);

          // Write modified manifest
          fs.writeFileSync(manifestPath, manifest, 'utf-8');
          console.log('[withAndroidWidget] Registered widget receiver in AndroidManifest.xml');
        } else {
          console.log('[withAndroidWidget] Widget receiver already registered in AndroidManifest.xml');
        }
      } else {
        console.warn('[withAndroidWidget] AndroidManifest.xml not found');
      }

      return config;
    },
  ]);
};

module.exports = withAndroidWidget;
