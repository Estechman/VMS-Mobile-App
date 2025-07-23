# Device Testing Guide - Phase 2 Capacitor Migration

## Overview
This guide provides step-by-step instructions for testing the Phase 2 Capacitor migration on actual iOS and Android devices to verify all functionality works correctly.

## Prerequisites

### Development Environment Setup
- **Node.js**: 18.x LTS installed
- **Android Studio**: Latest version with Android SDK 34
- **Xcode**: 15.x or higher (macOS only for iOS testing)
- **Physical Devices**: iOS device (iOS 15+) and Android device (API 23+)

### Development Certificates
- **iOS**: Apple Developer account with valid provisioning profiles
- **Android**: Debug signing enabled (automatic for debug builds)

## Build Process

### 1. Prepare the Build Environment
```bash
cd /home/ubuntu/VMS-Mobile-App

# Ensure all dependencies are installed
npm install

# Sync Capacitor with latest changes
npx cap sync

# Verify Capacitor configuration
npx cap doctor
```

### 2. Build for Android
```bash
# Build the web assets
npm run build  # or ionic build if available

# Sync web assets to Android platform
npx cap sync android

# Build Android APK (debug)
npx cap build android

# Alternative: Open in Android Studio for manual build/deploy
npx cap open android
```

**Android Studio Deployment:**
1. Open the project in Android Studio via `npx cap open android`
2. Connect your Android device via USB with Developer Options enabled
3. Enable USB Debugging on the device
4. Click "Run" (green play button) to build and deploy
5. Select your connected device from the deployment target list

### 3. Build for iOS
```bash
# Build the web assets
npm run build  # or ionic build if available

# Sync web assets to iOS platform
npx cap sync ios

# Open in Xcode for build/deploy
npx cap open ios
```

**Xcode Deployment:**
1. Open the project in Xcode via `npx cap open ios`
2. Connect your iOS device via USB
3. Select your device from the deployment target dropdown
4. Configure signing with your Apple Developer account
5. Click "Run" (play button) to build and deploy to device

## High Priority Testing Checklist

### ✅ 1. Login Flow with Biometric Authentication

**Test Steps:**
1. Launch the app on device
2. Navigate to login screen
3. Enter valid ZoneMinder credentials
4. Enable biometric authentication in settings (if available)
5. Log out and attempt to log back in using biometric auth

**Expected Behavior:**
- Capacitor: Uses `capacitor-native-biometric` plugin
- Fallback: Uses existing Cordova fingerprint/TouchID plugins
- Should prompt for fingerprint/face ID and authenticate successfully

**Debug Commands:**
```javascript
// Check in browser console or device logs
console.log("Biometric available:", window.Capacitor ? "Capacitor mode" : "Cordova mode");
```

### ✅ 2. Push Notifications

**Test Steps:**
1. Grant notification permissions when prompted
2. Register for push notifications in app settings
3. Send a test notification from ZoneMinder server
4. Verify notification appears in device notification center
5. Tap notification to ensure app opens correctly

**Expected Behavior:**
- Capacitor: Uses `@capacitor/push-notifications`
- Fallback: Uses existing Firebase/Cordova push plugins
- Should receive and display notifications properly

**Debug Commands:**
```javascript
// Check registration token in console
console.log("Push token:", $rootScope.apnsToken);
```

### ✅ 3. File Download/Save Operations

**Test Steps:**
1. Navigate to Events section
2. Select an event with video/image
3. Attempt to download/save media to device
4. Check device photo gallery for saved files
5. Verify file permissions and access

**Expected Behavior:**
- Capacitor: Uses `@capacitor/filesystem` + `@capacitor/camera`
- Fallback: Uses existing Cordova file transfer plugins
- Files should save to device storage/photo library

**Debug Commands:**
```javascript
// Check file system access in console
console.log("File system available:", window.Capacitor ? "Capacitor" : "Cordova");
```

### ✅ 4. Network Status Detection

**Test Steps:**
1. Start app on WiFi connection
2. Switch to mobile data
3. Turn off all network connections
4. Reconnect to WiFi
5. Verify app responds to network changes

**Expected Behavior:**
- Capacitor: Uses `@capacitor/network`
- Fallback: Uses existing Cordova network information plugin
- Should detect network type changes and adjust bandwidth settings

**Debug Commands:**
```javascript
// Check network status in console
console.log("Network type:", getBandwidth());
```

### ✅ 5. App Badge Count Updates

**Test Steps:**
1. Ensure app is in background
2. Generate new events in ZoneMinder
3. Check if app icon shows badge count
4. Open app and verify badge clears
5. Test badge updates with different event counts

**Expected Behavior:**
- Capacitor: Uses `@capacitor/app` badge API
- Fallback: Uses existing Cordova badge plugin
- Badge should update with new event counts

**Debug Commands:**
```javascript
// Check badge functionality in console
console.log("Badge count set to:", badgeCount);
```

### ✅ 6. Build Process Verification

**Test Steps:**
1. Clean build environment: `rm -rf android/app/build ios/App/build`
2. Run full Capacitor build: `npx cap build android` and `npx cap build ios`
3. Verify no build errors or warnings
4. Test app launches and core functionality works
5. Check build logs for any plugin issues

**Expected Behavior:**
- All 10 Capacitor plugins should process without errors
- Build should complete successfully
- App should launch and function normally

## Troubleshooting Common Issues

### Android Issues

**AAPT2 Daemon Startup Failed:**
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx cap sync android
npx cap build android
```

**Plugin Not Found Errors:**
```bash
# Reinstall Capacitor plugins
npm uninstall @capacitor/device @capacitor/network
npm install @capacitor/device@5.x @capacitor/network@5.x
npx cap sync android
```

**Firebase/Push Notification Issues:**
1. Ensure `google-services.json` is present in `android/app/`
2. Check Firebase project configuration
3. Verify FCM server key is configured in ZoneMinder

### iOS Issues

**Code Signing Errors:**
1. Open project in Xcode via `npx cap open ios`
2. Select project root in navigator
3. Go to "Signing & Capabilities" tab
4. Select your development team
5. Ensure provisioning profile is valid

**Plugin Permission Issues:**
1. Check `Info.plist` for required permissions
2. Add missing usage descriptions for camera, biometric, etc.
3. Rebuild and redeploy

### General Issues

**Capacitor Not Detected:**
- Verify `capacitor.config.ts` is properly configured
- Check that `@capacitor/core` is installed
- Ensure web assets are built and synced

**Fallback to Cordova Not Working:**
- Verify existing Cordova plugins are still installed
- Check that platform detection logic is working
- Review browser console for JavaScript errors

## Testing Results Documentation

### Create Test Report
Document your testing results using this template:

```markdown
# Device Testing Results - Phase 2 Migration

## Test Environment
- **Android Device**: [Model, OS Version]
- **iOS Device**: [Model, iOS Version]
- **Build Date**: [Date]
- **Commit**: [Git commit hash]

## Test Results
- [ ] ✅/❌ Biometric Authentication: [Notes]
- [ ] ✅/❌ Push Notifications: [Notes]
- [ ] ✅/❌ File Operations: [Notes]
- [ ] ✅/❌ Network Detection: [Notes]
- [ ] ✅/❌ Badge Updates: [Notes]
- [ ] ✅/❌ Build Process: [Notes]

## Issues Found
[List any issues discovered during testing]

## Recommendations
[Any recommendations for fixes or improvements]
```

## Next Steps

After completing device testing:
1. Document all test results
2. Report any issues found to the development team
3. If all tests pass, Phase 2 migration is verified complete
4. If issues are found, prioritize fixes before proceeding to Phase 3

## Support

If you encounter issues during testing:
1. Check the browser console for JavaScript errors
2. Review device logs for native plugin errors
3. Verify all prerequisites are properly installed
4. Consult the Capacitor documentation for platform-specific issues
