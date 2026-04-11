#!/bin/bash
# Patches react-native-css-interop's stringify function to prevent crash
# when traversing React Navigation context objects during NativeWind upgrade warnings.
# This is a known NativeWind bug: printUpgradeWarning() calls stringify(originalProps)
# which does deep traversal and throws when encountering NavigationContainerRefContext.

RENDER_COMPONENT="node_modules/react-native-css-interop/dist/runtime/native/render-component.js"

if [ -f "$RENDER_COMPONENT" ]; then
  # Check if already patched
  if grep -q "Unserializable" "$RENDER_COMPONENT"; then
    echo "[patch] react-native-css-interop already patched, skipping."
    exit 0
  fi

  # Patch printUpgradeWarning to wrap in try/catch
  sed -i 's/function printUpgradeWarning(warning, originalProps) {/function printUpgradeWarning(warning, originalProps) { try {/' "$RENDER_COMPONENT"
  sed -i '/console.log(`CssInterop upgrade warning/a\    } catch (e) { /* stringify can crash traversing navigation context */ }' "$RENDER_COMPONENT"

  # Patch stringify to handle unserializable values
  sed -i 's/if (!(value !== null \&\& typeof value === "object"))/if (typeof value === "function") { return "[Function]"; } if (!(value !== null \&\& typeof value === "object"))/' "$RENDER_COMPONENT"
  sed -i 's/newValue\[entry\[0\]\] = replace(entry\[0\], entry\[1\]);/try { newValue[entry[0]] = replace(entry[0], entry[1]); } catch(e) { newValue[entry[0]] = "[Unserializable]"; }/' "$RENDER_COMPONENT"

  echo "[patch] react-native-css-interop patched successfully."
else
  echo "[patch] render-component.js not found, skipping."
fi
