
'use strict';

var iconService = (function () {
    function getPath(a) {
        return {
            path: {
                16: "images/icons/16x16" + a + ".png",
                48: "images/icons/48x48" + a + ".png",
                128: "images/icons/128x128" + a + ".png"
            }
        }
    }

    function setPopup(popup) {
        chrome.browserAction.setPopup({popup: popup});
    }

    function setIcon(type) {
        chrome.browserAction.setIcon(getPath(type));
    }
    
    function setUpdate() {
        setPopup('');
        setIcon('new');
    }

    function setDefault() {
        setPopup('popup.html');
        showBadge('');
        setIcon('');
    }

    function setRec() {
        setIcon('rec');
    }

    function setPause() {
        setIcon('paused');
    }

    function showBadge(t) {
        chrome.browserAction.setBadgeText({text: t.toString()});
        chrome.browserAction.setBadgeBackgroundColor({color: '#000'});
    }

    return {
        setUpdate: setUpdate,
        setDefault: setDefault,
        setRec: setRec,
        setPause: setPause,
        showBadge: showBadge
    }
})();