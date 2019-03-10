
"use strict";
let xs, ys, ws, hs, scroll_crop = false, save_scroll = false, send_nimbus = false, send_slack = false,
send_google = false, send_print = false, copy_to_clipboard = false;
let screenshot = {
path: 'filesystem:chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/persistent/',
generated: false,
enableNpapi: false,
imgData: null,
button_video: null,
createMenu: function () {
    if (localStorage.showContentMenu === 'false') {
        chrome.contextMenus.removeAll()
    } else {
        let button_root = chrome.contextMenus.create({
            "title": chrome.i18n.getMessage("appNameMini"),
            "contexts": ["all"]
        });
        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("btnSelectedArea"),
            contexts: ["all"],
            parentId: button_root,
            onclick: screenshot.captureSelected.bind(screenshot)
        });
    }
},
setScreenName: function (cb) {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
        let info = {'url': tabs[0].url, 'title': tabs[0].title, 'time': getTimeStamp()};
        localStorage.pageinfo = JSON.stringify(info);
        cb && cb(info);
    });
},
fragmentsData: [],
captureSelected: function () {
    window.core.executeFile(['css/jquery.Jcrop.css', 'css/crop.css', 'js/jquery.js', 'js/jquery.Jcrop.js', 'js/content-core.js', 'js/content-crop.js'], function () {
        chrome.tabs.captureVisibleTab(null, {
            format: localStorage.format === 'jpg' ? 'jpeg' : 'png',
            quality: 100
        }, function (dataUrl) {
            localStorage.filePatch = dataUrl;
            window.core.sendMessage({operation: 'capture_selected', image: dataUrl})
        });
    });
},

captureDelayed: function () {
    timerContent.set(localStorage.delayedScreenshotTime || 3, 'capture_delayed');
},
init: function () {
    if (window.core.is_chrome) {
        screenshot.videoRecorder = videoRecorder;
    }
    screenshot.createMenu();
    screenshot.slack.init();
},
setWaterMark: function (canvas, cb) {
    core.checkWaterMark(function (check) {
        nimbusShare.checkPremium(function (err, premium) {
            console.log('check', check, 'premium', premium);
            if (err || !premium.capture) return cb && cb(canvas);
            if (!check) return cb && cb(canvas);
            core.getWaterMark(function (watermark) {
                let x, y, shift = 10;
                switch (localStorage.positionWatermark) {
                    case 'lt':
                        x = shift;
                        y = shift;
                        break;
                    case 'rt':
                        x = canvas.width - watermark.width - shift;
                        y = shift;
                        break;
                    case 'lb':
                        x = shift;
                        y = canvas.height - watermark.height - shift;
                        break;
                    case 'rb':
                        x = canvas.width - watermark.width - shift;
                        y = canvas.height - watermark.height - shift;
                        break;
                    case 'c':
                        x = Math.floor((canvas.width - watermark.width) / 2);
                        y = Math.floor((canvas.height - watermark.height) / 2);
                        break;
                }
                canvas.getContext('2d').drawImage(watermark, x, y, watermark.width, watermark.height);
                return cb && cb(canvas);
            });
        })
    })
},

download: function (dataURL) {
    //alert("download");
    let canvas = document.createElement('canvas');
    let screen = new Image();
    screen.onload = function () {
        canvas.width = screen.width;
        canvas.height = screen.height;

        canvas.getContext('2d').drawImage(screen, 0, 0);
        screenshot.setWaterMark(canvas, function (c) {
            let data_url = c.toDataURL('image/' + (localStorage.format === 'jpg' ? 'jpeg' : 'png'), localStorage.imageQuality / 100);
            if (window.is_firefox) {
                chrome.downloads.download({
                    url: window.URL.createObjectURL(core.dataURLtoBlob(data_url)),
                    filename: screenshot.getFileName(),
                    saveAs: localStorage.enableSaveAs !== 'false'
                })
            } else {
                chrome.downloads.download({
                    url: data_url,
                    filename: screenshot.getFileName(),
                    saveAs: localStorage.enableSaveAs !== 'false'
                });
            }
        });
    };
    screen.src = dataURL || localStorage.filePatch;
},
getFileName: function () {
    let s = localStorage.fileNamePatternScreenshot;
    let f = localStorage.format;
    let info = JSON.parse(localStorage.pageinfo);
    let url = document.createElement('a');
    url.href = info.url || '';
    s = s.replace(/\{url}/, info.url || '')
        .replace(/\{title}/, info.title || '')
        .replace(/\{domain}/, url.host || '')
        .replace(/\{date}/, info.time.split(' ')[0] || '')
        .replace(/\{time}/, info.time.split(' ')[1] || '')
        .replace(/\{ms}/, info.time.split(' ')[2] || '')
        .replace(/\{timestamp}/, info.time.split(' ')[3] || '');
    return s.replace(/[\*\|\\\:\"\<\>\?\/#]+/ig, '-') + ('.' + f);
}
};

function getTimeStamp() {
let y, m, d, h, M, s, mm, timestamp;
let time = new Date();
y = time.getFullYear();
m = time.getMonth() + 1;
d = time.getDate();
h = time.getHours();
M = time.getMinutes();
s = time.getSeconds();
mm = time.getMilliseconds();
timestamp = Date.now();
if (m < 10) m = '0' + m;
if (d < 10) d = '0' + d;
if (h < 10) h = '0' + h;
if (M < 10) M = '0' + M;
if (s < 10) s = '0' + s;
if (mm < 10) mm = '00' + mm;
else if (mm < 100) mm = '0' + mm;
return y + '.' + m + '.' + d + ' ' + h + ':' + M + ':' + s + ' ' + mm + ' ' + timestamp;
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('request', request);   
    switch (request.operation) {
        case 'set_screen':
            let image = new Image();
            image.onload = function () {
                let canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                ctx.drawImage(image, 0, 0);

                canvas = window.core.scaleCanvas(canvas);
                localStorage.filePatch = canvas.toDataURL('image/' + (localStorage.format === 'jpg' ? 'jpeg' : 'png'), localStorage.imageQuality / 100)
            };
            image.src = request.dataUrl;
            break;          
        case 'set_core_cap':
        // alert("set_core_cap");
            xs = request.xs;
            ys = request.ys;
            ws = request.ws;
            hs = request.hs;
            break;
        case 'get_crop_position':
        // alert("get_crop_position");

            sendResponse(localStorage.saveCropPosition === 'true' ? JSON.parse(localStorage.cropPosition) : {});
            break;        
        case 'get_info_screen':
        // alert("get_info_screen");

            sendResponse({format: localStorage.format, quality: localStorage.imageQuality});
            break;        
        case 'save_crop_position':
        // alert("save_crop_position");

            localStorage.cropPosition = JSON.stringify(request.position);
            break;
        case 'save_crop_scroll_position':
        // alert("save_crop_scroll_position");

            localStorage.cropScrollPosition = JSON.stringify(request.value);
            break;
        case 'save_position_video_camera':
        // alert("save_position_video_camera");

            localStorage.videoCameraPosition = JSON.stringify(request.position);
            break;
        case 'download_screen':
        // alert("download_screen");

            screenshot.download(request.dataUrl || localStorage.filePatch);
            break;
        case 'download_screen_content':
        // alert("download_screen_content");

            screenshot.setScreenName(function () {
                screenshot.download(request.dataUrl || localStorage.filePatch);
            });
            break;         
        case 'activate_capture':
            switch (request.value) {
                case 'capture-selected' :
                // alert("selected");

                    screenshot.captureSelected();
                    break;                
            }
            break;
        }
}
);



var global = "undefined" != typeof chrome ? chrome : "undefined" != typeof browser ? browser : void 0, NP = {
    init: function() {
        global.browserAction.onClicked.addListener(this.inject), global.runtime.onMessage.addListener(function(e, t, n) {
            if ("take_screen_shot" === e.method) screenshot.captureSelected();
            /*NP.screenShot(n);*/ else if ("get_pixel_color" === e.method) {
                var a = e.point;
                NP.getPixelColor(a, n);
            } else "save_data" === e.method ? NP.saveData(e.config) : "get_data" === e.method ? NP.getData(n) : "open_options" === e.method && chrome.runtime.openOptionsPage();
            return !0;
        });
    },
    getPixelColor: function(r, c) {
        global.tabs.captureVisibleTab(null, null, function(e) {
            var o = document.createElement("canvas"), i = o.getContext("2d"), l = new Image();
            document.documentElement.appendChild(o), l.src = e, l.onload = function() {
                o.width = l.naturalWidth, o.height = l.naturalHeight, i.drawImage(l, 0, 0);
                var e = i.getImageData(0, 0, o.width, o.height), t = 4 * (r.y * e.width + r.x), n = e.data;
                if ("function" == typeof c) {
                    var a = {
                        r: n[t],
                        g: n[t + 1],
                        b: n[t + 2],
                        a: n[t + 3]
                    };
                    document.documentElement.removeChild(o), c(a);
                }
            };
        });
    },
    saveData: function(e) {
        try {
            localStorage.setItem("config", JSON.stringify(e));
        } catch (e) {}
    },
    getData: function(e) {
        var t = localStorage.getItem("config"), n = null;
        try {
            n = JSON.parse(t);
        } catch (e) {}
        e(n);
    },
    inject: function() {
        global.tabs.insertCSS(null, {
            file: "/css/main.min.css"
        }, function() {
            if (global.extension.lastError) {
                global.extension.lastError.message;
                try {
                    alert("We are sorry, but the page you are viewing is not supported. Please try another page.");
                } catch (e) {}
            }
            global.tabs.executeScript(null, {
                file: "/js/inject.js"
            });
        });
    },
    screenShot: function(i) {

       // alert();
        // global.tabs.captureVisibleTab(function(a) {
        //     var o = global.extension.getURL("screen.html");
        //     global.tabs.query({}, function(e) {
        //         var t;
        //         if (e && e.length) for (var n = e.length - 1; 0 <= n; n--) if (e[n].url === o) {
        //             t = e[n];
        //             break;
        //         }
        //         t ? global.tabs.update(t.id, {
        //             active: !0
        //         }, Function.prototype.bind.call(NP.updateScreenshot, NP, a, i, 0)) : global.tabs.create({
        //             url: o
        //         }, Function.prototype.bind.call(NP.updateScreenshot, NP, a, i, 0));
        //     });
        // });
    },
    updateScreenshot: function(t, n) {
        var a = arguments[2];
        null == a && (a = 0), 10 < a || global.runtime.sendMessage({
            method: "update_url",
            url: t
        }, function(e) {
            e && e.success || window.setTimeout(Function.prototype.bind.call(NP.updateScreenshot, NP, t, n, ++a), 300);
        });
    }
};
if (!localStorage.mainMenuItem) {
    localStorage.mainMenuItem = JSON.stringify({
        "selected": true,
    });
} else {
    let mainMenuItem = JSON.parse(localStorage.mainMenuItem);
    mainMenuItem.selected = mainMenuItem.area;
    delete mainMenuItem.area;
    localStorage.mainMenuItem = JSON.stringify(mainMenuItem);
}
localStorage.format = localStorage.format || 'png';
localStorage.fileNamePatternScreenshot = localStorage.fileNamePatternScreenshot || 'screenshot-{domain}-{date}-{time}';
localStorage.fileNamePatternScreencast = localStorage.fileNamePatternScreencast || 'screencast-{domain}-{date}-{time}';
window.onload = function () {
    screenshot.init();
};

NP.init();