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
cp package.json ${PACKAGE_NAME}/

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
