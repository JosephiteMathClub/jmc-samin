# Josephite Math Club - Mobile App Strategy (PWA & APK)

We have transitioned from Capacitor to a **Progressive Web App (PWA)** strategy. This is more lightweight, faster, and follows modern web standards.

## 1. What is a PWA?
A PWA allows users to "Install" the Josephite Math Club website directly to their home screen on Android and iOS. 
- **iOS**: Open the site in Safari -> Tap Share -> "Add to Home Screen".
- **Android**: Open the site in Chrome -> Tap "Install App" or "Add to Home Screen".

## 2. Generating a Specific APK (for GitHub Releases)

If you still want a standalone **APK** file that users can download and install manually, we recommend using **Google's Bubblewrap CLI**. Bubblewrap takes your PWA and converts it into a **Trusted Web Activity (TWA)**, which is essentially a lightweight Android app "shell".

### Steps to generate APK locally:

1.  **Install Bubblewrap**:
    ```bash
    npm install -g @bubblewrap/cli
    ```

2.  **Initialize the Project**:
    Inside your project folder (or a new one), run:
    ```bash
    bubblewrap init --manifest=website_url/manifest.json
    ```
    *(Replace the URL with your final production URL when ready)*

3.  **Build the APK**:
    ```bash
    bubblewrap build
    ```
    This will generate an `app-release-signed.apk` that you can upload to your GitHub Releases.

## 3. Benefits of this approach
- **Stays Updated**: Since it's a PWA, any changes you make to the website are reflected in the installed app instantly without users needing to download a new APK.
- **Better Performance**: Leaner and faster than Capacitor for simple web-to-app conversions.
- **Cross-Platform**: Works on everything with a modern browser.

## 4. Local Development
To test the PWA locally:
1. Run `npm run build`
2. Run `npm run start`
3. Open Chrome and check the Application tab in DevTools to see the Manifest and Service Worker status.
