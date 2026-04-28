# Josephite Math Club - Multi-Platform Distribution Guide

This guide covers how to package your website into a Mobile App (APK), a Desktop App (.exe), and manage them on GitHub using Ionic (Capacitor).

---

## 1. Mobile App (Android APK) - Android Studio Guide

If you built the app and only got a `debug.apk`, or if you are seeing `invalid source release: 21`, follow these steps.

### Step 1: Preparation
Before opening Android Studio, ensure the native bridge is synced:
```bash
npx cap sync android
```

### Step 2: Fixing 'Invalid Source Release: 21'
Most modern projects now require **Java 21**. If your Android Studio is older (like Flamingo or Giraffe), it might default to Java 11 or 17.

1.  **Open Android Studio** (select the `android` folder).
2.  Go to **File > Settings** (Windows) or **Android Studio > Settings** (Mac).
3.  Go to **Build, Execution, Deployment > Build Tools > Gradle**.
4.  Change **Gradle JDK** to **21**. If not there, click "Download JDK" and pick version 21.
5.  Go to **File > Project Structure > Modules**. Ensure **Source Compatibility** and **Target Compatibility** are both set to `$Java_21` or `21`.

### Step 3: How to Preview the App (Run on Device/Emulator)
If clicking "Run" just says "Execution finished" without showing the app, it's because you haven't selected a **Target Device**.

#### Option A: Use an Emulator (Virtual Phone)
1.  Open the **Device Manager** (usually a phone icon in the top right or `Tools > Device Manager`).
2.  Click **Create Device**.
3.  Select a phone (e.g., Pixel 7), click **Next**.
4.  Pick a System Image (e.g., **API 34** or later), click **Next** and **Finish**.
5.  Once created, click the **Play** button next to the device to start the emulator.
6.  Now, in the top toolbar, ensure your emulator is selected in the device dropdown and click the green **Run** button.

#### Option B: Use your Physical Phone (Best Results)
1.  On your phone, go to **Settings > About Phone** and tap **Build Number** 7 times to enable "Developer Options".
2.  Go to **Developer Options** and enable **USB Debugging**.
3.  Connect your phone to your computer via USB.
4.  In Android Studio, select your phone from the device dropdown at the top and click **Run**.

### Step 4: Generating the SHAREABLE App (Signed Release APK)
Do **not** use the standard "Build APK" menu for sharing. Use this instead:

1.  Top Menu: **Build > Generate Signed Bundle / APK...**
2.  Choose **APK** and click **Next**.
3.  **Key Store**: Click **Create new...**. Choose a path (e.g., your Desktop), set a password, and fill in the "Alias" and "Validity" (leave at 25). Fill in your name.
4.  Click **Next**.
5.  **Build Variant**: Select **release**. 
6.  **Signature Versions**: Check both **V1** and **V2** (if visible).
7.  Click **Finish**.
8.  **Where is it?**: Once the progress bar at the bottom finishes, a popup will say "APK(s) generated successfully". Click **Locate**. The file will be named `app-release.apk`.

---

## 2. Desktop App (Windows .exe)

### Using Electron:
1.  On your local machine: `npm install --save-dev electron electron-builder`
2.  Create `electron-main.js`:
    ```javascript
    const { app, BrowserWindow } = require('electron');
    function createWindow() {
      const win = new BrowserWindow({ width: 1280, height: 720, title: "Josephite Math Club" });
      win.loadURL('https://jmc-sjs.org');
    }
    app.whenReady().then(createWindow);
    ```
3.  Add to `package.json`: `"desktop-dist": "electron-builder -w"`
4.  Run: `npm run desktop-dist`

---

## 3. GitHub Releases (Publishing)

1.  Go to your GitHub repo -> **Releases** -> **Create a new release**.
2.  Use a tag like `v2.0.0`.
3.  Attach your generated `app-release.apk` (Android) and `JMC-Setup.exe` (Windows).
4.  Click **Publish Release**.

---

## 4. Troubleshooting

### "TypeError: Failed to fetch"
This usually indicates a connection issue or a CSP block. Check your `.env` file to ensure `NEXT_PUBLIC_SUPABASE_URL` is set correctly.

### "App crashes immediately on launch" (Common Fixes)
1.  **Crucial: index.html inside www**: 
    Even though we use a Live URL, Capacitor **must** find a folder named `www` with a file named `index.html` in it to start its engine. If it's missing, the app will crash instantly.
    - **Fix**: Run `mkdir www` on your computer. Inside `www`, create `index.html` with:
      ```html
      <!DOCTYPE html><html><head><title>JMC</title></head><body>Loading...</body></html>
      ```
    - Run `npx cap sync android`.

2.  **Permissions & Cleartext**:
    If your app loads but stays white or crashes, it might be blocking the website.
    - Open `android/app/src/main/AndroidManifest.xml`.
    - Find the `<application>` tag and add `android:usesCleartextTraffic="true"`:
      ```xml
      <application
          ...
          android:usesCleartextTraffic="true">
      ```

3.  **Check Logcat**: 
    This is the "Console" for Android. 
    - Open **Logcat** at the bottom of Android Studio.
    - Search for `Capacitor` or `WebView`.
    - If you see `net::ERR_CLEARTEXT_NOT_PERMITTED` or `net::ERR_CONNECTION_REFUSED`, the URL is wrong or blocked.

4.  **Nuclear Option (Fresh Start)**:
    If nothing works, the native files might be corrupted.
    - Delete the `android` folder.
    - Run `npx cap add android` then `npx cap sync android`.
This is a persistent Gradle corruption error. If deleting the project's `.gradle` folder didn't work, follow these steps:
1.  **Clear Global Gradle Cache**:
    - **Windows**: Go to `C:\Users\<YourUsername>\.gradle` and delete the `caches` folder.
    - **Mac/Linux**: Go to `~/.gradle` and delete the `caches` folder.
2.  **Invalidate Android Studio Caches**: 
    - Inside Android Studio, go to **File > Invalidate Caches...**.
    - Check all boxes and click **Invalidate and Restart**.
3.  **Correct the wrapper**: If you are using the terminal, run `gradlew clean` (Windows) or `./gradlew clean` (Mac) after doing the above.

### "Execution failed for task :capacitor-android:compileDebugJavaWithJavac"
If you see an error mentioning `JdkImageTransform` or `jlink.exe` and you have **JDK 26** installed:
1.  **Downgrade your JDK**: You **cannot** use JDK 26 for Android development yet.
2.  **Use JDK 21**: In Android Studio, go to *Settings > Build, Execution, Deployment > Build Tools > Gradle* and change the **Gradle JDK** to **21**.
3.  Ensure you do **not** have a global environment variable pointing to JDK 26 (JAVA_HOME).

### Security & Deployment (Netlify)
If Netlify blocks your deploy due to **CVE-2025-55182**:
- We have upgraded `next` to `15.1.3` (patched).
- We have added an `.nvmrc` file set to `22` to satisfy requirements.
