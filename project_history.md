# MaainHome - Emotional Project History

This document outlines the evolution of the **MaainHome** (formerly GoLocal Emotional) system, tracking its development from a basic concept to a multi-platform, local-first emotional connection solution.

## 🚀 How It Started
The project began with a clear objective: to build a **self-hosted, always-on, two-way video emotional connection system** for home use. The initial focus was on establishing reliable WebRTC-based communication between two points:
- **Home Station**: A dedicated video hub for the home.
- **Remote Viewer**: A web or mobile interface for remote access.

### Core Early Features (Phase 1)
- Two-way video and audio communication.
- WebRTC signaling server.
- Basic UI with a "Live Feed" indicator.
- Support for mute and camera toggling.

---

## 🛠 Version 1: Refinement and Stability
In Version 1, the focus shifted toward usability and making the system feel like a dedicated appliance.

### Key Milestones
- **UI Enhancements**: Added Picture-in-Picture (PiP) functionality for self-previews.
- **Full-Screen Optimization**: Modified the Home Station and Remote views to auto-fit full screens for a "kiosk" feel.
- **Persistence**: Implemented basic session management and persistent connection states.
- **Secure Access**: Integrated HTTPS for secure media access (camera/mic) on mobile devices.

---

## 🔝 Version 2: Scaling and Ecosystem
Version 2 represents the transition to a more robust, local-first architecture and a dedicated mobile experience.

### Major Additions
- **Local Hardware Migration**: 
    - Moved the backend signaling server from cloud hosting to it locally on a **Lenovo PC**.
    - Deployed the **Home Station** on a **Raspberry Pi 4GB** running in kiosk mode.
- **Secure Pairing System**: 
    - Introduced **QR Code** scanning for pairing Home Stations.
    - Introduced **.key file** imports for secure Android app pairing.
- **Android Application**: 
    - Developed a dedicated Android APK using **Capacitor**.
    - Implemented an **auto-update mechanism** to keep the app fresh without manual reinstalls.
- **Infrastructure**: 
    - Configured **Cloudflare Tunnels** for secure, public access to the local backend without port forwarding.
    - Set up **Vercel** for frontend hosting and **Render/Local** for the signaling hub.
- **Data Management**: Integrated **Supabase** for user profiles and secure key storage.

---

## ✅ Current Features & Capabilities
As of today, the system boasts:
- **High-Performance Video**: Low-latency WebRTC streams.
- **Robust Connectivity**: Auto-reconnect logic for WebSockets and signaling.
- **Native Experience**: A dedicated Android app and a Raspberry Pi kiosk station.
- **Enhanced Security**: 256-character secure keys and encrypted tunnels.
- **Modern UI**: A premium, dark-mode-first interface with glassmorphism touches.

---

## 📈 Future Roadmap
- Improved offline indicators and state management.
- Multi-device support for larger households.
- Advanced notification system for incoming calls.
