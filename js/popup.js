window.is_chrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor) && !/OPR/.test(navigator.userAgent);

$(document).ready(function () {

    $("button").on('click', function () {
        switch (this.name) {
            case 'capture-selected':
                chrome.runtime.sendMessage({operation: 'activate_capture', 'value': this.name});
                break;
        }

        if ($(this).data('closeWindow')) {
            window.close();
        }
    });

  
});