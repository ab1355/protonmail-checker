// ProtonMail Inbox Agent - Popup Script

function sendMessage(message, callback) {
    chrome.runtime.sendMessage(message, callback || function() {});
}

// Build a summary object from the email list
function buildSummary(emails) {
    var unreadEmails = emails.filter(function(e) { return e.isUnread; });
    var senderCounts = {};
    emails.forEach(function(e) {
        if (e.sender) {
            senderCounts[e.sender] = (senderCounts[e.sender] || 0) + 1;
        }
    });
    return {
        total: emails.length,
        unread: unreadEmails.length,
        senders: senderCounts
    };
}

// Create a single email list item element
function createEmailItem(email) {
    var div = document.createElement('div');
    div.className = 'email-item' + (email.isUnread ? ' unread' : '');

    var senderEl = document.createElement('div');
    senderEl.className = 'email-sender';
    senderEl.textContent = email.sender || 'Unknown Sender';

    var subjectEl = document.createElement('div');
    subjectEl.className = 'email-subject';
    subjectEl.textContent = email.subject || '(No subject)';

    div.appendChild(senderEl);
    div.appendChild(subjectEl);

    if (email.preview) {
        var previewEl = document.createElement('div');
        previewEl.className = 'email-preview';
        previewEl.textContent = email.preview;
        div.appendChild(previewEl);
    }

    if (email.time) {
        var timeEl = document.createElement('div');
        timeEl.className = 'email-time';
        timeEl.textContent = email.time;
        div.appendChild(timeEl);
    }

    return div;
}

// Render the email list and summary in the popup
function renderEmails(emails) {
    var listEl = document.getElementById('email-list');
    var statsEl = document.getElementById('summary-stats');
    var noEmailsMsg = document.getElementById('no-emails-msg');

    if (!emails || emails.length === 0) {
        statsEl.textContent = 'No emails found in current view.';
        noEmailsMsg.style.display = 'block';
        return;
    }

    noEmailsMsg.style.display = 'none';

    var summary = buildSummary(emails);
    var unreadText = summary.unread > 0 ? summary.unread + ' unread' : 'all read';
    statsEl.textContent = summary.total + ' email(s) visible \u2014 ' + unreadText;

    // Remove any previously rendered items
    var existing = listEl.querySelectorAll('.email-item, .more-emails');
    existing.forEach(function(el) { el.remove(); });

    // Show up to 15 emails
    var display = emails.slice(0, 15);
    display.forEach(function(email) {
        listEl.appendChild(createEmailItem(email));
    });

    if (emails.length > 15) {
        var moreEl = document.createElement('p');
        moreEl.className = 'more-emails';
        moreEl.textContent = '+ ' + (emails.length - 15) + ' more emails in ProtonMail';
        listEl.appendChild(moreEl);
    }
}

// Wire up action buttons and load initial data
function initialize() {
    // Load stored email data from the background script
    sendMessage({ action: 'getEmailData' }, function(response) {
        if (chrome.runtime.lastError) {
            renderEmails([]);
            return;
        }
        renderEmails(response ? response.emails : []);
    });

    // Mark all read
    document.getElementById('btn-mark-read').addEventListener('click', function() {
        var btn = this;
        btn.disabled = true;
        btn.textContent = 'Marking\u2026';

        sendMessage({ action: 'markAllRead' }, function(response) {
            if (response && response.success) {
                btn.textContent = 'Done!';
                setTimeout(function() {
                    btn.disabled = false;
                    btn.textContent = 'Mark All Read';
                }, 2000);
            } else {
                btn.textContent = 'Failed';
                btn.title = (response && response.message)
                    || 'Could not mark all read \u2014 please use ProtonMail directly.';
                setTimeout(function() {
                    btn.disabled = false;
                    btn.textContent = 'Mark All Read';
                    btn.title = 'Mark all visible emails as read';
                }, 3000);
            }
        });
    });

    // Open ProtonMail
    document.getElementById('btn-open-protonmail').addEventListener('click', function() {
        sendMessage({ action: 'openProtonMail' });
        window.close();
    });
}

document.addEventListener('DOMContentLoaded', initialize);
