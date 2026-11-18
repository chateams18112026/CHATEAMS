# CHATEAMS v2.0 (Production Edition)

Open-source Cloud Messenger, Voice & Video Calling, 24h Status, and Takeaways app for Android (`.apk`), iOS/Android PWA, and Web.

## What's New in v2.0 (Production)
- **Outer App Icon Guaranteed (`apply-icons.js`)**: Automatically replaces default Capacitor launcher icons and bumps `versionCode 200` during `npx cap sync` / `npx cap add` and in GitHub Actions (`.github/workflows/build-apk.yml`).
- **Clean 3-Action Chat Header**: Opening any chat displays the full Contact/Group Name clearly on the left and ONLY **Voice Call (`📞`)**, **Video Call (`📹`)**, and **Options (`⋮`)** on the right (with Search, Mute, Wallpaper, Vanish Mode, Floating Chat Head, Manage Members, Theme, and Settings organized inside `⋮`).
- **Zero Demo / Trial Clutter**: Removed all simulated bot replies (`"Super clean in CHATEAMS! ⚡"`, app hints), removed `"Trial Version"` badges, and removed all demo contacts (`Priya Sundaram`, `Karthik Raja`, `Weekend Updates`).
- **Google Cloud Account Sync (Uninstall-Safe)**: Connect Firebase Firestore / Realtime Database (or paste a 1-click Friends Cloud Sync Code) in `⚙️ Settings → Account` so all messages, groups, and Takeaways are tied to your Gmail ID and automatically restore on reinstall.
- **Live WebRTC Voice & Video Calling**: Real outgoing ringing (`Ringing...` up to 45s without fake auto-connect) that connects only when the recipient taps **Answer**.
- **GitHub OTA Update Checker (`⚙️ Settings → 🔄 Update`)**: Checks `version.json` on GitHub and lets you update the app in one tap while keeping all chats safe.
