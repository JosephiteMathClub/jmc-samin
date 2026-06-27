# Linux Desktop Web App & Shortcut Guide

For Linux Mint, Ubuntu, Debian, and other desktop distributions, you do not need to compile or install a heavy custom desktop binary. Instead, you can leverage native browser capabilities or Linux Mint's built-in features to turn the **Josephite Math Club** web application into a fully-integrated, standalone desktop app with its own application window, taskbar icon, and system menu entry.

Below are the **three easiest ways** to set this up.

---

## Method 1: Linux Mint "Web Apps" (Recommended for Mint Users)
Linux Mint comes out of the box with a beautiful, built-in application called **Web Apps** (`mintwebapps`). This tool wraps any website into an isolated, lightweight desktop container.

1. **Open the Web Apps Manager:**
   - Press the `Super` (Windows) key on your keyboard to open the Application Menu.
   - Search for **"Web Apps"** and open it.

2. **Register the Josephite Math Club App:**
   - Click the **`+` (Add)** button in the toolbar.
   - Configure the following fields:
     - **Name:** `Josephite Math Club`
     - **Address:** `http://localhost:3000` *(or your production server URL)*
     - **Icon:** Click the search icon, or click the folder icon to browse your system. You can point to the project logo at:
       ```
       /path/to/josephite-math-club/public/logo.png
       ```
     - **Category:** `Education` or `Office`
     - **Browser:** Choose your preferred browser (e.g., Firefox, Chrome, or Chromium).
     - **Isolated Profile:** **Checked (Yes)**. *(This keeps cookies, login state, and database session tokens fully separated from your main browser profile.)*
     - **Navigation Bar:** **Unchecked (No)**. *(This hides address bars and back buttons, making it feel like a pristine native app.)*

3. **Launch the Application:**
   - Click **OK**.
   - You can now find the **Josephite Math Club** directly in your Linux Mint MintMenu under **Education** or **Office**.
   - Right-click the menu entry to **Add to panel** (taskbar) or **Add to desktop**.

---

## Method 2: Google Chrome & Chromium "Create Shortcut" (PWA Style)
If you are running Chrome, Chromium, Brave, or Vivaldi, you can leverage the Chromium platform's native web app feature to create a desktop shortcut.

1. **Navigate to the App:**
   - Open your browser and go to your server address (e.g., `http://localhost:3000` or your online URL).

2. **Generate the Desktop Shortcut:**
   - Click the **three-dot menu** in the top-right corner of your browser.
   - Navigate to **Save and share** ➔ **Create shortcut...** *(on older versions, this is under **More tools** ➔ **Create shortcut...**)*.
   - Name the shortcut: `Josephite Math Club`
   - **CRITICAL:** Check the box that says **"Open as window"**. This opens the application in a borderless window without standard browser bars.
   - Click **Create**.

3. **Enable Execution on the Linux Desktop:**
   - Go to your Linux Desktop. You will find a file named `chrome-xxxx.desktop` or `Josephite Math Club`.
   - Right-click the new shortcut icon on your desktop and select **Properties**.
   - Go to the **Permissions** tab.
   - Check the box for **"Allow executing file as program"** *(or right-click the file and click **"Allow Launching"** depending on your desktop environment)*.

---

## Method 3: Native Desktop Launcher (.desktop file)
If you prefer a manual, distro-agnostic launcher that works across any desktop environment (XFCE, Cinnamon, MATE, GNOME, KDE, etc.) with any browser installed:

1. **Create the file:**
   Create a new file on your desktop named `josephite-math-club.desktop` using your favorite text editor:
   ```bash
   nano ~/Desktop/josephite-math-club.desktop
   ```

2. **Add the launcher configuration:**
   Copy and paste the configuration below, replacing `/absolute/path/to` with your real directory path:

   ```ini
   [Desktop Entry]
   Version=1.0
   Type=Application
   Name=Josephite Math Club
   Comment=Official portal of the Josephite Math Club
   # Option A: Standalone App Window (Chromium / Chrome)
   Exec=chromium --app=http://localhost:3000
   # Option B: New Window (Firefox fallback - uncomment if using Firefox)
   # Exec=firefox --new-window http://localhost:3000
   Icon=/absolute/path/to/josephite-math-club/public/logo.png
   Terminal=false
   Categories=Education;Science;Math;
   StartupNotify=true
   ```

3. **Make the launcher executable:**
   In your terminal, execute:
   ```bash
   chmod +x ~/Desktop/josephite-math-club.desktop
   ```
   Now, simply double-click the icon on your desktop to instantly open the math club dashboard.
