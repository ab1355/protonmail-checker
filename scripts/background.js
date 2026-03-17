// Email data received from the inbox agent content script
var cachedEmails = [];

// Open a new tab or activate the first ProtonMail tab
function openProtonMail() {
    chrome.tabs.query(
        {url: 'https://mail.protonmail.com/*'},
        function(tab_list) {
            if (tab_list.length == 0) {
                chrome.tabs.create({url: 'https://mail.protonmail.com/inbox'});
            } else {
                chrome.tabs.update(tab_list[0].id, {active: true});
            }
        }
    );
}


// Listen for messages from the Content Scripts and Popup
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action && request.action == 'count') {
            // Change the extension icon and badge
            setIcon(request.color, request.count, request.tooltip);

        } else if (request.action && request.action == 'notif') {
            // Show notification if supported
            if (Notification && localStorage.getItem('notif_desktop') == 'true') {
                // Create a simple text notification
                var n = new Notification(request.title, request.opts);

                setTimeout(
                    n.close.bind(n),
                    (localStorage.getItem('notif_timeout') || 10) * 1000);
            } else {
                console.log('Desktop notifications not supported!');
            }

            // Play sound
            if (localStorage.getItem('notif_sound') == 'true') {
                    try {
                        var sound = new Audio('sounds/notif.mp3');
                        sound.play();
                    } catch(e) {
                        console.log('Sound error!')
                    }
            }

        } else if (request.action && request.action == 'emailData') {
            // Store email data sent by the inbox agent content script
            cachedEmails = request.emails || [];

        } else if (request.action && request.action == 'getEmailData') {
            // Popup requesting the latest stored email data
            sendResponse({emails: cachedEmails});
            return true;

        } else if (request.action && request.action == 'openProtonMail') {
            // Popup requesting to open / switch to ProtonMail
            openProtonMail();

        } else if (request.action && request.action == 'markAllRead') {
            // Forward the mark-all-read action to the ProtonMail content script
            chrome.tabs.query(
                {url: 'https://mail.protonmail.com/*'},
                function(tab_list) {
                    if (tab_list.length > 0) {
                        chrome.tabs.sendMessage(
                            tab_list[0].id,
                            {action: 'markAllRead'},
                            function(response) {
                                sendResponse(response || {success: false});
                            }
                        );
                    } else {
                        sendResponse({success: false, message: 'No ProtonMail tab open.'});
                    }
                }
            );
            return true;
        }
    }
);


// Set the extension icon and badge
function setIcon(color, count, tooltip) {
    var icon = '';
    var badge_color = '#FF0000';

    if (color == 'gray') {
        icon = 'g';
        badge_color = '#D0D0D0';
    }

    chrome.browserAction.setIcon({path: 'icons/icon-48' + icon + '.png'});
    chrome.browserAction.setTitle({title: tooltip});
    chrome.browserAction.setBadgeText({text: count.toString()});
    chrome.browserAction.setBadgeBackgroundColor({color: badge_color});
}


// Change the extension icon and badge when there is no ProtonMail tab open
function checkTabs() {
    chrome.tabs.query(
        {url: 'https://mail.protonmail.com/*'},
        function(array) {
            var found = false;

            for (var i=0; i<array.length; i++) {
                var url = array[i].url;

                if (url.match(/^https:\/\/mail\.protonmail\.com\/(account|appearance|archive|compose|contacts|labels|login|login\/unlock|security|settings)$/) ||
                    url.match(/^https:\/\/mail\.protonmail\.com\/(drafts|inbox|label|m|outbox|sent|spam|starred|trash)(\/.*|)$/) ||
                    url.match(/^https:\/\/mail\.protonmail\.com\/(search|label)\?.*/)) {

                    found = true;
                    break;
                }
            }

            if (! found) {
                setIcon('gray', 'X', 'No ProtonMail tab found');
            }
        }
    );

    // Check for the open tab every 2 seconds
    setTimeout(checkTabs, 2000);
}


// Show options after installation
function install_notice() {
    if (localStorage.getItem('install_time')) {
        return;
    }

    var now = new Date().getTime();
    localStorage.setItem('install_time', now);
    chrome.tabs.create({url: '../html/options.html'});
}


install_notice();
checkTabs();
