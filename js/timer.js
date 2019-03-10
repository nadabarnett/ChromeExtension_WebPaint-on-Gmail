

var timerContent = (function () {

    var tab_id_list = [];

    function set(countdown, type, popup) {
        chrome.browserAction.setPopup({popup: popup || ''});

        chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
            if (tab_id_list.indexOf(tabs[0].id) === -1) {
                tab_id_list.push(tabs[0].id);
                insert(tabs[0].id, function (tab_id) {
                    chrome.tabs.sendMessage(tab_id, {operation: 'content_start_timer', countdown: countdown, type: type});
                });
            } else {
                chrome.tabs.sendMessage(tabs[0].id, {operation: 'content_start_timer', countdown: countdown, type: type});
            }
        });
    }

    function insert(tad_id, cb) {
        chrome.tabs.insertCSS(tad_id, {file: "css/timer.css"});

        chrome.tabs.executeScript(tad_id, {file: "js/jquery.js"}, function () {
            chrome.tabs.executeScript(tad_id, {file: "js/progressbar.js"}, function () {
                chrome.tabs.executeScript(tad_id, {file: "js/timer_content.js"}, function () {
                    cb && cb(tad_id);
                });
            });
        });
    }

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab_id_list.indexOf(tabId) !== -1) {
            chrome.browserAction.setPopup({popup: 'popup.html'});
            tab_id_list.splice(tab_id_list.indexOf(tabId), 1);
        }
    });

    return {
        set: set
    }
})();
