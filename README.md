Inbox Checker for ProtonMail
============================

Version 3.2 — Chrome Extension (Manifest v2)


Description
-----------

This Google Chrome extension monitors your ProtonMail inbox. It displays the
number of unread e-mails as a badge on the extension icon, shows desktop
notifications and plays a sound when new messages arrive, and provides an
**Inbox Agent** popup for quick inbox summaries and management actions.

The extension requires ProtonMail to be open at `https://mail.protonmail.com`
and fully logged in.


Features
--------

- **Unread badge** — Live count of unread messages shown on the extension icon,
  updated every 2 seconds.
- **Desktop notifications** — Optional system notification when a new message
  arrives (configurable timeout).
- **Sound alerts** — Optional audio notification for new messages.
- **Inbox Agent popup** — Click the extension icon to open a popup showing:
  - Total and unread message counts for the current view.
  - A scrollable list of up to 15 recent emails with sender, subject, preview
    text, and received time. Unread items are displayed in bold.
  - **Mark All Read** — marks all visible messages as read via ProtonMail's
    native toolbar.
  - **Open ProtonMail** — opens or focuses the ProtonMail tab.
- **Tab management** — The icon turns gray when no ProtonMail tab is open.
- **Options page** — Configure notification preferences after installation.


Usage
-----

1. Install the
   [ProtonMail Checker](https://chrome.google.com/webstore/detail/protonmail-checker/khohmflpainliicgcnenjnldnmffnaec)
   extension.
2. Open `https://mail.protonmail.com` and log into your ProtonMail account.
3. The extension icon badge will show your unread message count.
4. Click the extension icon to open the **Inbox Agent** popup.
5. Use the **Mark All Read** button to mark all visible messages as read, or
   **Open ProtonMail** to switch directly to your inbox.
6. Adjust notification preferences via the **Options** page
   (right-click the extension icon → *Options*).


File Structure
--------------

```
protonmail-checker/
├── manifest.json              Extension manifest (v2)
├── Makefile                   Build script — creates distributable ZIP
├── html/
│   ├── background.html        Background page container
│   ├── options.html           Notification settings page
│   └── popup.html             Inbox Agent popup UI
├── scripts/
│   ├── background.js          Core extension logic, message broker
│   ├── contentscript.js       Reads unread count from ProtonMail DOM
│   ├── agent.js               Inbox Agent — scrapes email list, handles actions
│   ├── options.js             Options page logic
│   └── popup.js               Popup rendering and interaction logic
├── css/
│   ├── options.css            Options page styles
│   └── popup.css              Inbox Agent popup styles
├── icons/                     Extension icons (48px, 128px, gray variant, SVG)
└── sounds/
    └── notif.mp3              New-message notification sound
```

See [AGENTS.md](AGENTS.md) for a detailed description of the Inbox Agent.


Build
-----

```bash
make all
# Creates ../protonmail-checker.zip ready for Chrome Web Store upload.
```
