#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

xcconfig="$repo_root/app/ios/debug.xcconfig"
pbxproj="$repo_root/app/ios/App/App.xcodeproj/project.pbxproj"

expected_bundle_id="com.scrappykin.ios.dev"
expected_display_name="Scrappy Kin (Dev)"

if [[ ! -f "$xcconfig" ]]; then
  echo "Missing debug.xcconfig at $xcconfig" >&2
  exit 1
fi

if [[ ! -f "$pbxproj" ]]; then
  echo "Missing project.pbxproj at $pbxproj" >&2
  exit 1
fi

if command -v rg > /dev/null 2>&1; then
  grep_cmd=(rg -n -F)
else
  grep_cmd=(grep -nF)
fi

if ! "${grep_cmd[@]}" "PRODUCT_BUNDLE_IDENTIFIER = ${expected_bundle_id}" "$xcconfig" > /dev/null; then
  echo "debug.xcconfig missing dev bundle id (${expected_bundle_id})" >&2
  exit 1
fi

if ! "${grep_cmd[@]}" "PRODUCT_NAME = \"${expected_display_name}\"" "$xcconfig" > /dev/null; then
  echo "debug.xcconfig missing dev product name (${expected_display_name})" >&2
  exit 1
fi

if ! "${grep_cmd[@]}" "INFOPLIST_KEY_CFBundleDisplayName = \"${expected_display_name}\"" "$xcconfig" > /dev/null; then
  echo "debug.xcconfig missing CFBundleDisplayName (${expected_display_name})" >&2
  exit 1
fi

if "${grep_cmd[@]}" "com.scrappykin.ios.dev" "$pbxproj" > /dev/null; then
  echo "project.pbxproj should not hardcode dev bundle id" >&2
  exit 1
fi

echo "iOS config checks passed"
