

if (!window.EXT_HOTKEY_JS_INSERTED) {
    window.EXT_HOTKEY_JS_INSERTED = true;

    chrome.runtime.sendMessage({operation: 'get_hotkeys'}, function (response) {
        let hotkeys = JSON.parse(response.hotkeys);

        function sendToChrome(type) {
            chrome.runtime.sendMessage({operation: 'activate_hotkey', value: type});
        }

        window.addEventListener('keydown', function (e) {
            const k = e.keyCode;
            if (e.shiftKey && e.ctrlKey) {
                if (k === +hotkeys.entire) sendToChrome('entire');
                if (k === +hotkeys.fragment) sendToChrome('fragment');
                if (k === +hotkeys.selected) sendToChrome('selected');
                if (k === +hotkeys.scroll) sendToChrome('scroll');
                if (k === +hotkeys.visible) sendToChrome('visible');
                if (k === +hotkeys.window) sendToChrome('window');
            }
        }, false);
    });
}

// var event = new KeyboardEvent('keydown', {keyCode: "52", ctrlKey: true, shiftKey: true}); window.dispatchEvent(event);