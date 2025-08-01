#!/bin/bash
RED='\033[0;31m'
NC='\033[1m\033[0m'
GREEN='\033[0;32m'
ORANGE='\033[0;33m'

err() { echo -e "${RED}$@${NC}"; }
success() { echo -e "${GREEN}$@${NC}"; }

PACKAGE_NAME="zmNinja-electron-npm-v1.7.008-OPTIMIZED"

echo "Creating optimized npm package..."
rm -rf ${PACKAGE_NAME}/ ${PACKAGE_NAME}.zip

mkdir -p ${PACKAGE_NAME}
mkdir -p ${PACKAGE_NAME}/node_modules

echo "Copying essential files..."
cp -R www/ ${PACKAGE_NAME}/
cp -R electron_js/ ${PACKAGE_NAME}/

echo "Creating optimized package.json for Electron..."
cat > ${PACKAGE_NAME}/package.json << 'EOF'
{
  "name": "zmninja",
  "description": "Home security mobile app for ZoneMinder",
  "version": "1.7.008",
  "displayName": "zmNinja",
  "author": "Zoneminder Inc, Pliable Pixels",
  "license": "SEE LICENSE IN LICENSE.md",
  "main": "electron_js/main.js",
  "scripts": {
    "start": "electron .",
    "electron:start": "electron ."
  },
  "dependencies": {
    "angular": "^1.5.3",
    "angular-animate": "^1.5.3",
    "angular-cookies": "^1.8.3",
    "angular-sanitize": "^1.5.3",
    "angular-touch": "^1.8.3",
    "angular-translate": "^2.19.0",
    "clivas": "^0.2.0",
    "deep-equal": "^2.2.3",
    "define-properties": "^1.2.1",
    "electron-window-state": "^5.0.3",
    "es-abstract": "^1.23.7",
    "function-bind": "^1.1.2",
    "gridstack": "^12.2.2",
    "has": "^1.0.4",
    "has-symbols": "^1.1.0",
    "is-arguments": "^1.2.0",
    "is-date-object": "^1.1.0",
    "is-regex": "^1.2.1",
    "jsonfile": "^6.1.0",
    "keypress": "^0.2.1",
    "localforage": "^1.10.0",
    "lodash": "^4.17.21",
    "menu": "^0.2.5",
    "minimist": "^1.2.8",
    "mkdirp": "^3.0.1",
    "moment": "^2.29.4",
    "moment-timezone": "^0.6.0",
    "object-is": "^1.1.6",
    "object-keys": "^1.1.1",
    "regexp.prototype.flags": "^1.5.3"
  },
  "devDependencies": {
    "electron": "^37.2.5"
  }
}
EOF

echo "Copying only required node modules..."
cp -R node_modules/electron-window-state ${PACKAGE_NAME}/node_modules/
cp -R node_modules/jsonfile ${PACKAGE_NAME}/node_modules/
cp -R node_modules/mkdirp ${PACKAGE_NAME}/node_modules/
cp -R node_modules/deep-equal ${PACKAGE_NAME}/node_modules/
cp -R node_modules/minimist ${PACKAGE_NAME}/node_modules/
cp -R node_modules/menu ${PACKAGE_NAME}/node_modules/
cp -R node_modules/clivas ${PACKAGE_NAME}/node_modules/
cp -R node_modules/keypress ${PACKAGE_NAME}/node_modules/
cp -R node_modules/define-properties ${PACKAGE_NAME}/node_modules/
cp -R node_modules/es-abstract ${PACKAGE_NAME}/node_modules/
cp -R node_modules/function-bind ${PACKAGE_NAME}/node_modules/
cp -R node_modules/has ${PACKAGE_NAME}/node_modules/
cp -R node_modules/has-symbols ${PACKAGE_NAME}/node_modules/
cp -R node_modules/is-arguments ${PACKAGE_NAME}/node_modules/
cp -R node_modules/is-date-object ${PACKAGE_NAME}/node_modules/
cp -R node_modules/is-regex ${PACKAGE_NAME}/node_modules/
cp -R node_modules/object-is ${PACKAGE_NAME}/node_modules/
cp -R node_modules/object-keys ${PACKAGE_NAME}/node_modules/
cp -R node_modules/regexp.prototype.flags ${PACKAGE_NAME}/node_modules/

echo "Creating package..."
zip -r ${PACKAGE_NAME}.zip ${PACKAGE_NAME}/

echo "Package size comparison:"
ls -lh ${PACKAGE_NAME}.zip
du -sh ${PACKAGE_NAME}/

success "Optimized package created: ${PACKAGE_NAME}.zip"
