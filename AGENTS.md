Inbox Management Agent
======================

The **Inbox Agent** is a built-in component of the ProtonMail Checker extension
(v3.2+) that provides live inbox summaries and quick management actions directly
from the browser action popup.


Overview
--------

When ProtonMail is open and the user is logged in, the Inbox Agent continuously
reads the visible email list from the ProtonMail page, caches the data in the
background service, and surfaces it in a popup whenever the extension icon is
clicked.

The agent also exposes a **Mark All Read** action that interacts with
ProtonMail's native toolbar to mark all currently visible messages as read.


Components
----------

### scripts/agent.js  (content script)

Runs inside every `https://mail.protonmail.com/*` page.

- Polls the ProtonMail DOM every **5 seconds** to extract the visible email
  list using a resilient multi-selector strategy that works across ProtonMail
  versions.
- For each email item it collects: `id`, `sender`, `subject`, `preview` (first
  150 characters), `isUnread`, and `time`.
- Sends the scraped list to the background script via
  `chrome.runtime.sendMessage({ action: 'emailData', emails: [...] })`.
- Stops polling automatically if the extension context is invalidated (e.g. the
  extension is reloaded while the tab is open).
- Listens for `markAllRead` messages forwarded by the background script and
  clicks ProtonMail's native "Mark all as read" toolbar button.

### scripts/background.js  (background service)

Persistent background page that acts as the message broker.

| Message received        | Action taken                                          |
|-------------------------|-------------------------------------------------------|
| `emailData`             | Caches the email list in `cachedEmails`               |
| `getEmailData`          | Returns `cachedEmails` to the popup                   |
| `markAllRead`           | Forwards the action to the agent in the active tab    |
| `openProtonMail`        | Opens or focuses the ProtonMail tab                   |
| `count`                 | Updates the icon badge (from `contentscript.js`)      |
| `notif`                 | Shows a desktop notification and/or plays a sound     |

### html/popup.html + scripts/popup.js + css/popup.css  (popup UI)

Opens when the user clicks the extension icon.

- Requests `getEmailData` from the background script on load.
- Renders a summary bar: *"5 email(s) visible — 3 unread"*.
- Renders a scrollable list of up to 15 emails; unread items appear in **bold**.
  Items with more than 15 emails show a *"+ N more emails in ProtonMail"*
  footer.
- **Mark All Read** button — sends `markAllRead` to the background script,
  which forwards it to the agent content script; the button provides visual
  feedback (Marking… → Done! / Failed).
- **Open ProtonMail** button — sends `openProtonMail` and closes the popup.


Message Flow
------------

```
[mail.protonmail.com page]
  agent.js
    │  every 5 s
    ├─► emailData ──────────────────────► background.js
    │                                         │ stores cachedEmails
    │
    └─► markAllRead ◄── tabs.sendMessage ◄────┤
          (DOM click)                         │
                                              │
[popup]                                       │
  popup.js                                    │
    ├─► getEmailData ──────────────────────► background.js ──► cachedEmails
    ├─► markAllRead  ──────────────────────► background.js ──► agent.js
    └─► openProtonMail ────────────────────► background.js ──► tab open/focus

[contentscript.js]
  ├─► count ────────────────────────────► background.js (badge update)
  └─► notif ────────────────────────────► background.js (notification / sound)
```


DOM Selectors Used by the Agent
--------------------------------

The agent tries each selector set in order and uses the first one that returns
results, making it resilient to ProtonMail UI changes.

**Email container rows**

| Priority | Selector                      | ProtonMail context          |
|----------|-------------------------------|-----------------------------|
| 1        | `[data-element-id]`           | Conversations / messages    |
| 2        | `.conversation-list-row`      | Conversation list view      |
| 3        | `.message-list-item`          | Message list view           |
| 4        | `.items-column-list--item`    | Column layout               |

**Per-item fields**

| Field    | Primary selector                              | Fallback                              |
|----------|-----------------------------------------------|---------------------------------------|
| Sender   | `.item-senderName`, `[data-testid=sender-name]` | `[class*="senderName"]`             |
| Subject  | `.item-subject`, `[data-testid=message-subject]` | `[class*="subject"]`               |
| Preview  | `.item-body`, `[data-testid=message-snippet]`  | `[class*="body"]`, `[class*="preview"]` |
| Unread   | `.unread` / `.conversation-is-unread` class   | Child `.unread` element               |
| Time     | `time`, `.item-date`, `[data-testid=message-date]` | —                               |

**Mark All Read button**

| Priority | Selector                              |
|----------|---------------------------------------|
| 1        | `[data-testid="toolbar:markread"]`    |
| 2        | `[title="Mark all as read"]`          |
| 3        | `[aria-label="Mark all as read"]`     |


Configuration
-------------

The Inbox Agent itself has no user-facing configuration. General notification
preferences (desktop notifications, sound, timeout) are set on the **Options**
page, which is accessible by right-clicking the extension icon and selecting
*Options*, or automatically shown on first install.

| localStorage key    | Type    | Default | Description                          |
|---------------------|---------|---------|--------------------------------------|
| `notif_desktop`     | boolean | false   | Show desktop notification on new mail |
| `notif_sound`       | boolean | false   | Play sound on new mail               |
| `notif_timeout`     | integer | 10      | Desktop notification duration (sec)  |


Permissions
-----------

The extension requests only the minimum permissions required:

| Permission      | Reason                                              |
|-----------------|-----------------------------------------------------|
| `notifications` | Display desktop notifications for new messages      |
| `tabs`          | Open / focus the ProtonMail tab; forward messages   |

No remote network requests are made by the extension itself. All data stays
within the browser.
