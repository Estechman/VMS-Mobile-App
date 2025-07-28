# zmNinja Desktop App for macOS

This is the modernized zmNinja application packaged as an Electron desktop app for macOS (including M1 Macs).

## Features
- Modern Angular 16+ / Ionic 7+ implementation
- Fixed authentication flow with API validation
- Pre-configured demo server (https://demo.zoneminder.com/)
- No CORS restrictions (unlike browser testing)
- Native desktop experience

## Installation & Setup

1. **Install Node.js** (if not already installed):
   - Download from https://nodejs.org/ (LTS version recommended)
   - Choose the macOS installer for Apple Silicon (M1/M2) or Intel

2. **Install dependencies**:
   ```bash
   cd zmNinja-electron-mac
   npm run install-deps
   ```

3. **Run the application**:
   ```bash
   npm start
   ```

## Testing the Demo Server

The app comes pre-configured with the demo server settings:
- **Portal URL**: https://demo.zoneminder.com/
- **API URL**: https://demo.zoneminder.com/api  
- **Streaming URL**: https://demo.zoneminder.com/cgi-bin/
- **Username**: (blank)
- **Password**: (blank)
- **Use Authentication**: Disabled

Simply click the "Save" button on the login screen to test the authentication flow.

## Troubleshooting

If you encounter any issues:
1. Make sure you have Node.js installed
2. Try deleting `node_modules` and running `npm run install-deps` again
3. Check that your internet connection allows access to demo.zoneminder.com

## Technical Details

This build includes all the authentication fixes from the modernization project:
- API validation step after login (`/host/getVersion.json`)
- Proper error handling and navigation flow
- Modern Angular/Ionic architecture
- CORS-free API communication
