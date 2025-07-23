# Modern Build System Guide

## Overview
Phase 3 modernization replaces Gulp/Bower with Webpack + TypeScript while maintaining compatibility with existing Ionic 1.x and Angular 1.x code.

## Build Commands

### Development
```bash
npm run serve          # Start development server on localhost:8100
npm run build:dev      # Development build to dist/
npm run type-check     # TypeScript type checking
```

### Production
```bash
npm run build          # Production build with optimization
npm run cap:build      # Build and sync with Capacitor
```

### Mobile Platforms
```bash
npm run cap:run:android    # Build and run on Android device
npm run cap:run:ios        # Build and run on iOS device
npm run cap:open:android   # Open in Android Studio
npm run cap:open:ios       # Open in Xcode
```

## Architecture Changes

### Build Output
- **Old**: www/ served directly
- **New**: www/ compiled to dist/ via Webpack

### Dependency Management
- **Old**: Bower dependencies in www/lib/
- **New**: NPM dependencies bundled by Webpack

### SASS Compilation
- **Old**: Gulp task compiles SCSS to CSS
- **New**: Webpack with sass-loader handles SCSS

### TypeScript Integration
- **Gradual**: .js files work unchanged
- **Optional**: Add .ts files for new code
- **Type Checking**: `npm run type-check`

## CI/CD Automation

### Automated Builds
- **Android APK**: Built on Ubuntu runners
- **iOS IPA**: Built on macOS runners
- **Artifacts**: Uploaded with 30-day retention
- **Releases**: Auto-generated on main branch

### Public Download URLs
- GitHub Releases provide public download links
- Artifacts available via GitHub Actions interface
- Version tagged with build number

## Migration Status

### ✅ Completed
- Modern Webpack build system
- TypeScript foundation
- NPM dependency migration
- Automated CI/CD builds
- Public artifact distribution

### 🔄 Preserved
- Existing Angular 1.x code compatibility
- Capacitor/Cordova dual setup from Phase 2
- Python Appium testing infrastructure
- All existing functionality

## Testing Strategy
- Jest unit tests: `npm test`
- Type checking: `npm run type-check`
- Lint checking: `npm run lint`
- E2E tests: Existing Python Appium tests preserved
