// ProtonMail Inbox Agent
// Scrapes email data from the ProtonMail DOM and handles inbox management actions.

var agentEmailData = [];

function normalizeText(text) {
    return text ? text.trim().replace(/\s+/g, ' ') : '';
}

// Extract email list items from the ProtonMail page DOM
function scrapeEmails() {
    var emails = [];
    var path = window.location.pathname;

    if (!path.match(/^\/login/)) {
        // Try multiple selectors used across ProtonMail versions
        var containerSelectors = [
            '[data-element-id]',
            '.conversation-list-row',
            '.message-list-item',
            '.items-column-list--item'
        ];

        var items = null;
        for (var i = 0; i < containerSelectors.length; i++) {
            var found = document.querySelectorAll(containerSelectors[i]);
            if (found.length > 0) {
                items = found;
                break;
            }
        }

        if (items && items.length > 0) {
            items.forEach(function(item) {
                var email = {
                    id: item.getAttribute('data-element-id') || '',
                    sender: '',
                    subject: '',
                    preview: '',
                    isUnread: false,
                    time: ''
                };

                // Sender
                var senderEl = item.querySelector(
                    '.item-senderName, .senderName, .sender-name, [data-testid="sender-name"]'
                );
                if (!senderEl) {
                    senderEl = item.querySelector('[class*="senderName"], [class*="sender-name"]');
                }
                email.sender = senderEl ? normalizeText(senderEl.textContent) : '';

                // Subject
                var subjectEl = item.querySelector(
                    '.item-subject, .subject, [data-testid="message-subject"]'
                );
                if (!subjectEl) {
                    subjectEl = item.querySelector('[class*="subject"], [class*="Subject"]');
                }
                email.subject = subjectEl ? normalizeText(subjectEl.textContent) : '(No subject)';

                // Preview text
                var previewEl = item.querySelector(
                    '.item-body, .message-preview, [data-testid="message-snippet"]'
                );
                if (!previewEl) {
                    previewEl = item.querySelector('[class*="body"], [class*="preview"], [class*="snippet"]');
                }
                email.preview = previewEl
                    ? normalizeText(previewEl.textContent).substring(0, 150)
                    : '';

                // Unread status
                email.isUnread =
                    item.classList.contains('unread') ||
                    item.classList.contains('conversation-is-unread') ||
                    !!item.querySelector('.unread, [class*="unread"]');

                // Time
                var timeEl = item.querySelector('time, .item-date, [data-testid="message-date"]');
                email.time = timeEl
                    ? normalizeText(timeEl.getAttribute('title') || timeEl.textContent)
                    : '';

                if (email.sender || email.subject) {
                    emails.push(email);
                }
            });
        }
    }

    agentEmailData = emails;

    try {
        chrome.runtime.sendMessage({
            action: 'emailData',
            emails: emails
        });
    } catch (e) {
        // Extension context may have been invalidated; stop polling
        return;
    }

    setTimeout(scrapeEmails, 5000);
}

// Listen for management action requests forwarded from background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getEmails') {
        sendResponse({ emails: agentEmailData });
        return true;
    }

    if (request.action === 'markAllRead') {
        // Attempt to click the "Mark all as read" button in ProtonMail
        var btnSelectors = [
            '[data-testid="toolbar:markread"]',
            '[title="Mark all as read"]',
            '[aria-label="Mark all as read"]'
        ];
        var btn = null;
        for (var i = 0; i < btnSelectors.length; i++) {
            btn = document.querySelector(btnSelectors[i]);
            if (btn) { break; }
        }

        if (btn) {
            btn.click();
            sendResponse({ success: true });
        } else {
            sendResponse({
                success: false,
                message: 'Mark all read button not found. Please use ProtonMail directly.'
            });
        }
        return true;
    }
});

scrapeEmails();
