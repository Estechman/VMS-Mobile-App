#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_info_plist>"
    exit 1
fi

INFO_PLIST="$1"

sed -i 's/<key>CFBundleDisplayName<\/key>\s*<string>Electron<\/string>/<key>CFBundleDisplayName<\/key>\n\t<string>zmNinja<\/string>/g' "$INFO_PLIST"
sed -i 's/<key>CFBundleName<\/key>\s*<string>Electron<\/string>/<key>CFBundleName<\/key>\n\t<string>zmNinja<\/string>/g' "$INFO_PLIST"
sed -i 's/<string>com\.github\.Electron<\/string>/<string>com.zoneminder.zmninja<\/string>/g' "$INFO_PLIST"
sed -i 's/<string>electron\.icns<\/string>/<string>icon.icns<\/string>/g' "$INFO_PLIST"

sed -i '/<key>ElectronAsarIntegrity<\/key>/,/<\/dict>/d' "$INFO_PLIST"

echo "Info.plist customized for zmNinja"
