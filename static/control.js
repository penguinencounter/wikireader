let keyHandlers = {};
let currentReaderContext = {
    wiki: null,
    page: null
};
function registerKeyHandler(key, handler) {
    keyHandlers[key] = keyHandlers[key]??[];  // new favorite operator
    keyHandlers[key].push(handler);
}

function popupOpen() {
    return document.querySelector('.overlay-popup.shown')??false;
}
function isInputFocused() {
    return !!document.querySelector('input:focus, textarea:focus');
}

// https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
const KEY_ALIAS = {
    Esc: 'Escape',
    OS: 'Super',
    Scroll: 'ScrollLock',
    Spacebar: ' ',
    Left: 'ArrowLeft',
    Up: 'ArrowUp',
    Right: 'ArrowRight',
    Down: 'ArrowDown',
    Del: 'Delete',
    Crsel: 'CrSel',
    Exsel: 'ExSel',
    Apps: 'ContextMenu',
    Nonconvert: 'NonConvert',
    AltGraph: 'ModeChange',
    MozHomeScreen: 'GoHome',
    MediaNextTrack: 'MediaTrackNext',
    MediaPreviousTrack: 'MediaTrackPrevious',
    FastFwd: 'MediaFastForward',
    VolumeUp: 'AudioVolumeUp',
    VolumeDown: 'AudioVolumeDown',
    VolumeMute: 'AudioVolumeMute',
    Live: 'TV',
    Zoom: 'ZoomToggle',
    SelectMedia: 'LaunchMediaPlayer',
    MediaSelect: 'LaunchMediaPlayer',
    Add: '+',
    Decimal: '.',
    Multiply: '*',
    Divide: '/',
    Subtract: '-'
}


const COMMAND_PARSERS = {
    gotoPageInterwiki: {
        match: /^(\w+)!([^#<>[\]{}|]+)$/,
        fmt: results => `Go to ${results[2]} on ${results[1]}`,
        requirements: ctx => true
    },
    gotoPage: {
        match: /^([^#<>[\]{}|]+)$/,
        requirements: ctx => !!ctx.wiki
    }
}


/*
command ctx = {
    wiki: string = current wiki or null,
    page: string = current page or null
}
*/


function handleCommand(input) {
    let results = [];
    for (let entry of Object.entries(COMMAND_PARSERS)) {
        let [name, parser] = entry;
        if (!parser.requirements(currentReaderContext)) {
            console.debug('Skipping', name, 'because requirements not met');
            continue;
        }
        let match = parser.match.exec(input);
        if (!match) continue;
        results.push({
            result: parser.fmt(match),
            command: name,
            data: match
        });
    }
    return results;
}


window.addEventListener('load', () => {
    setInterval(() => {
        let divCounter = document.getElementById('div-counter');
        let count = document.querySelectorAll('div').length;
        divCounter.innerHTML = count;
    }, 500)
    document.addEventListener('keydown', e => {
        let key = e.key;
        if (Object.keys(KEY_ALIAS).includes(e.key)) {
            key = KEY_ALIAS[e.key];
        }
        if (keyHandlers[key]) {
            keyHandlers[key].forEach(handler => handler(e));
        }
    })
    registerKeyHandler('Escape', e => {
        // Close popups
        let need_to_refocus = !!document.querySelector('.overlay-popup.shown *:focus');
        let result = document.querySelector('.overlay-popup.shown');
        if (result) {
            result.classList.remove('shown');
            if (need_to_refocus) {
                console.log('focusing .default-focus element:');
                document.activeElement?.blur && document.activeElement.blur();
                let defaultFocusTarget = document.querySelector('.default-focus:not(.hidden:not(.shown))');
                defaultFocusTarget = defaultFocusTarget??document.body;
                console.log(defaultFocusTarget);
                defaultFocusTarget.focus();
            }
            e.preventDefault();
            e.stopPropagation();
        } else {
            console.log('(No target for Escape key)')
        }
    })
    registerKeyHandler('l', e => {
        if (popupOpen()) return;
        if (isInputFocused()) return;
        document.getElementById('qp').classList.add('shown');
        console.log('opened quick panel');
        document.querySelector('#qp input.autofocus').focus();
        document.querySelectorAll('#qp input.autoclean').forEach(e => e.value = '');
        e.preventDefault();
        e.stopPropagation();
    })
})