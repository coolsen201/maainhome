# MaainHome - Lenovo PC Setup Guide

Since you have the new Lenovo PC with a webcam and speakers, follow these steps to turn it into a dedicated **MaainHome Station**.

## 1. Prerequisites
- **Node.js**: Install the latest LTS version from [nodejs.org](https://nodejs.org/).
- **Git**: Ensure Git is installed to pull the latest code.
- **Chrome/Chromium**: Ensure a modern browser is installed for rendering (Electron uses its own, but having Chrome helps with testing permissions).

## 2. Installation Steps
Open your terminal (PowerShell or Bash) and run:

```bash
# 1. Clone the project
git clone [your-repo-url]
cd version2

# 2. Install dependencies
npm install

# 3. Build the application
npm run build
```

## 3. Configuration
Ensure your `.env` file in the `version2` folder is set correctly:
- `VITE_WS_URL`: Should point to your Cloudflare Tunnel (`wss://api.maahome.in/ws`).
- `VITE_SUPABASE_URL`: Your project URL.
- `VITE_SUPABASE_ANON_KEY`: Your project public key.

## 4. Creating a Secure Installer (Hiding Source Code)
To protect your source code and provide a simple "one-click" installation file for the client, use the build command:

```bash
# This creates a protected .exe (Windows) or .AppImage (Linux)
# Your source code will be hidden inside an ASAR archive.
npm run electron:build
```
The output file will be located in the `version2/dist/electron` folder. This is the **only** file you need to send to the client.

## 5. Running the Dedicated Station
If you are currently on the machine and want to test without installing:
- **Webcam**: The app will automatically request permission. Ensure the camera is plugged in before starting.
- **Speaker**: Ensure your volume is turned up!
- **Auto-Launch**: The app is already configured to automatically start whenever you turn on the PC.

## 💡 Pro Tip for "Instant Connection"
By default, the `main.js` is set to **Kiosk Mode**. To exit Kiosk mode during testing, press `Alt + F4` or `Ctrl + W`.
