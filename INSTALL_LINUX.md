# Linux Mint & Debian Distros Deployment Guide

This repository contains a fully automated, interactive installer script (`install.sh`) to easily deploy, build, and run the **Josephite Math Club** web platform locally or on a private server running Linux Mint, Ubuntu, Debian, Pop!_OS, or other distributions.

---

## 🚀 One-Step Automated Installation

Open your terminal in the project root folder and execute the installer:

```bash
chmod +x install.sh
./install.sh
```

### What the installer does:
1. **Detects your Linux distribution** (such as Linux Mint).
2. **Installs core dependencies** (`git`, `Node.js v20 LTS`, `npm`) if they are missing.
3. **Launches an interactive setup wizard** to configure database credentials, admin settings, and SMTP configurations.
4. **Builds the Next.js production files** using highly optimized compilation settings.
5. **Registers a Systemd Service** (`josephite-math-club.service`) to ensure the application starts automatically when the system boots and restarts if any errors occur.
6. **Installs a Global CLI Shortcut (`jmc`)** in `/usr/local/bin` so you can interact with the app directly from your terminal.

---

## ⚡ Instant Terminal Launch (`jmc`)

Once installed, you can launch the application or check its server status from ANY directory in your terminal simply by typing:

```bash
jmc
```

Running this command will:
- Instantly verify whether the background `josephite-math-club` daemon is online, offline, or experiencing any configuration issues.
- Automatically launch your system's default web browser (Firefox, Chromium, Chrome, etc.) directly to your active local server (e.g. `http://localhost:3000`).

---

## 🛠️ Service Management Controls

If you elected to install the background systemd service during the installation wizard, you can manage the application daemon with the following system commands:

### Check Server Status
Verify if the background server is running cleanly:
```bash
sudo systemctl status josephite-math-club
```

### Start the Server
```bash
sudo systemctl start josephite-math-club
```

### Stop the Server
```bash
sudo systemctl stop josephite-math-club
```

### Restart the Server
Restart the service (e.g., after updating files or environmental configurations):
```bash
sudo systemctl restart josephite-math-club
```

### View Live Execution Logs
View console messages, database transactions, or QR scanning events in real-time:
```bash
sudo journalctl -u josephite-math-club -f
```

---

## 💻 Manual Setup (Alternate Approach)

If you prefer not to use systemd or wish to run the server inside a temporary foreground shell session:

### 1. Configure the Environment
Copy the example configuration to a local environment file and fill in your Supabase database keys and email settings:
```bash
cp .env.example .env
nano .env
```

### 2. Install Packages & Compile Build
```bash
npm install
npm run build
```

### 3. Start Web Portal
```bash
# Start on the default port (3000) or specify custom PORT
PORT=3000 npm run start
```

---

## 🌍 Accessing the Application

Once successfully started, open your favorite web browser (e.g., Firefox, Chromium) and navigate to:
- **Local host:** `http://localhost:3000`
- **From another device on your Local Network (Wi-Fi/Ethernet):** `http://<your-linux-ip-address>:3000`
  > *Tip: You can find your current Linux system IP address by running `hostname -I` in your terminal.*
