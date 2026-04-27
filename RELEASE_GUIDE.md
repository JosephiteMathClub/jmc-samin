# Josephite Math Club - Multi-Platform Distribution Guide

This guide covers how to package your website into a Mobile App (APK), a Desktop App (.exe), and manage them on GitHub using modern frameworks like Ionic (Capacitor) and Flutter.

---

## 1. Mobile App (Android APK)

You have two main options to create a mobile app: **Ionic (Capacitor)** or **Flutter**.

### Option A: Ionic / Capacitor (Recommended)
This approach wraps your existing Next.js website.

#### Fixing Common Errors locally:
1.  **"index.html" Error**:
    Next.js is a dynamic framework. Capacitor expects a static `index.html`. 
    - **Solution**: We have configured `capacitor.config.ts` to use a **Live URL** (`url: 'https://...'`). This tells the app to load your website directly, bypassing the need for a local `index.html`.
    - **Alternative**: You can use `output: 'export'` in `next.config.ts`, but this may break dynamic features like Supabase Auth listeners.

2.  **"Unable to launch Android Studio" Error**:
    - AI Studio (this environment) does not have Android Studio installed.
    - **Solution**: You must download the code to your own computer and install [Android Studio](https://developer.android.com/studio).
    - Once installed, run `npx cap open android`. If it still fails, manually open Android Studio and "Open Existing Project", selecting the `android/` folder in your project.

#### Local Setup Steps:
1.  Install dependencies: `npm install`
2.  Build the site: `npm run build`
3.  Sync Capacitor: `npx cap sync android`
4.  Build APK: Use Android Studio's **Build > Build APK(s)** menu.

---

### Option B: Flutter (Native Feel)
This involves creating a tiny native shell that loads your web app.

#### Steps (On your local computer):
1.  Install [Flutter SDK](https://docs.flutter.dev/get-started/install).
2.  Create a project: `flutter create jmc_mobile`
3.  Add WebView: `flutter pub add webview_flutter`
4.  Replace `lib/main.dart` with:
    ```dart
    import 'package:flutter/material.dart';
    import 'package:webview_flutter/webview_flutter.dart';

    void main() => runApp(const MaterialApp(home: JMCApp()));

    class JMCApp extends StatefulWidget {
      const JMCApp({super.key});
      @override
      State<JMCApp> createState() => _JMCAppState();
    }

    class _JMCAppState extends State<JMCApp> {
      late final WebViewController controller;

      @override
      void initState() {
        super.initState();
        controller = WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..loadRequest(Uri.parse('https://ais-pre-atrdtng4dlxlbcnpe6o546-118654560279.asia-southeast1.run.app'));
      }

      @override
      Widget build(BuildContext context) {
        return Scaffold(body: SafeArea(child: WebViewWidget(controller: controller)));
      }
    }
    ```
5.  Build APK: `flutter build apk --release`

---

## 2. Desktop App (Windows .exe)

### Using Electron:
1.  On your local machine: `npm install --save-dev electron electron-builder`
2.  Create `electron-main.js`:
    ```javascript
    const { app, BrowserWindow } = require('electron');
    function createWindow() {
      const win = new BrowserWindow({ width: 1280, height: 720, title: "Josephite Math Club" });
      win.loadURL('https://ais-pre-atrdtng4dlxlbcnpe6o546-118654560279.asia-southeast1.run.app');
    }
    app.whenReady().then(createWindow);
    ```
3.  Add to `package.json`: `"desktop-dist": "electron-builder -w"`
4.  Run: `npm run desktop-dist`

---

## 3. GitHub Releases (Publishing)

1.  Go to your GitHub repo -> **Releases** -> **Create a new release**.
2.  Use a tag like `v2.0.0`.
3.  Attach your generated files:
    - `JMC.apk` (from Android Studio or Flutter)
    - `JMC-Setup.exe` (from Electron)
4.  Click **Publish Release**.

---

## 4. Troubleshooting

### "TypeError: Failed to fetch"
This usually indicates a connection issue or a CSP block. We have relaxed security headers in `src/middleware.ts` to allow Supabase connections. Check your `.env` file to ensure `NEXT_PUBLIC_SUPABASE_URL` is set.

### Security & Deployment (Netlify)
If Netlify blocks your deploy due to **CVE-2025-55182**:
- We have upgraded `next` to `15.1.3` (patched).
- We have added an `.nvmrc` file set to `22` to satisfy `@capacitor/cli` requirements.
- Ensure your Netlify environment uses **Node 22+**.
