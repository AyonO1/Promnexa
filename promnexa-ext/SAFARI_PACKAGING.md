# Safari Packaging Guide for Promnexa

This document outlines the step-by-step procedure for converting and packaging Promnexa for Safari on macOS and iOS using Xcode and Apple's `safari-web-extension-converter`.

---

## Prerequisites

1. **macOS Sonoma (14.0+)** or **macOS Sequoia (15.0+)**
2. **Xcode 15+** installed from the Mac App Store
3. **Apple Developer Account** (for code signing and distribution)
4. Built Promnexa extension directory: `.output/chrome-mv3`

---

## Step 1: Build the Chrome MV3 Extension

In the `promnexa-ext` directory, generate the standard Manifest V3 build:

```bash
npm run build
```

This creates the unbundled extension files in:
```
promnexa-ext/.output/chrome-mv3/
```

---

## Step 2: Convert Extension Using Safari Converter

Run Apple's built-in conversion tool from Terminal on macOS:

```bash
xcrun safari-web-extension-converter .output/chrome-mv3 \
  --app-name "Promnexa" \
  --bundle-identifier "com.promnexa.app" \
  --swift
```

When prompted:
- Select **Swift** as the primary language.
- Xcode will generate a macOS & iOS container application in the directory.

---

## Step 3: Configure Xcode Project

1. Open the generated `Promnexa.xcodeproj` in Xcode.
2. Under **Signing & Capabilities**:
   - Select your Team.
   - Verify Bundle Identifier: `com.promnexa.app` and `com.promnexa.app.Extension`.
   - Enable **App Sandbox** for both targets.
3. In the Extension target's `Info.plist`, ensure:
   - `NSExtensionPointIdentifier`: `com.apple.Safari.web-extension`
   - `NSExtensionPrincipalClass`: `SafariWebExtensionHandler`

---

## Step 4: Test in Safari (Development Mode)

1. Open **Safari** on macOS.
2. Go to **Safari > Settings > Advanced**.
3. Check **Show features for web developers** (or **Show Develop menu in menu bar**).
4. In the **Develop** menu, check **Allow Unsigned Extensions**.
5. In Xcode, select the **Promnexa (macOS)** scheme and click **Run (⌘R)**.
6. The container app will launch. In Safari > Settings > Extensions, enable **Promnexa**.

---

## Step 5: Distribute to Mac App Store

1. In Xcode, set scheme to **Any Mac (Apple Silicon, Intel)**.
2. Select **Product > Archive**.
3. In the Xcode Organizer:
   - Click **Distribute App**.
   - Select **App Store Connect**.
   - Upload the build and submit for review.
