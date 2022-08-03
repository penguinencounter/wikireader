let currentReaderContext = {
    wiki: 'https://en.wikipedia.org',
    page: 'WP:Sandbox'
};
let registeredWikis = {
    'wp': 'https://en.wikipedia.org'
}

let keyHandlers = {};
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
    goHome: {
        match: /^%h(?:ome)?$/,
        fmt: () => `Go to WikiReader home`,
        requirements: () => true
    },
    gotoPageInterwiki: {
        match: /^%goto (\w+)!([^#<>[\]{}|]+)$/,
        fmt: results => `Go to ${results[2]} on ${results[1]}`,
        requirements: () => true
    },
    gotoPage: {
        match: /^%goto ([^#<>[\]{}|]+)$/,
        fmt: results => `Go to ${results[1]}`,
        requirements: ctx => !!ctx.wiki
    },
    section: {
        match: /^#(.+)$/,
        fmt: results => `Go to section ${results[1]}`,
        requirements: ctx => !!ctx.page
    }
}
const RESULT_PROVIDERS = {
    searchResults: {
        
    }
}

for (let testidx = 0; testidx < 20; testidx++) {
    COMMAND_PARSERS['test' + testidx] = {
        match: /test/,
        fmt: () => `Test ${testidx}`,
        requirements: () => true
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


function updateCmdPromptOut(resultData) {
    let outputContainer = document.querySelector('#qp .item-list-container');
    outputContainer.innerHTML = '';
    outputContainer.setAttribute('data-selected-idx', (0).toString());
    let hoverSelector = e => {
        let idx = +e.currentTarget.getAttribute('data-idx');
        updateCmdPromptSelection(idx, false);
        e.preventDefault();
        e.stopPropagation();
    }
    let createItem = (data, id, selected) => {
        let item = document.createElement('div');
        if (selected) {
            item.classList.add('selected');
        }
        item.setAttribute('data-idx', id.toString());
        item.addEventListener('mousemove', hoverSelector);

        let mainText = document.createElement('div');
        mainText.classList.add('text-mbig');
        mainText.innerHTML = data.result;
        item.appendChild(mainText);
        let tagText = document.createElement('div');
        tagText.classList.add('debug');
        tagText.innerHTML = data.command;
        item.appendChild(tagText);
        return item;
    }
    let i = 0;
    for (let result of resultData) {
        let item = createItem(result, i, i === 0);
        outputContainer.appendChild(item);
        i++;
    }
    if (resultData.length === 0) {
        let item = createItem({result: 'Invalid command', command: '', data: null}, 0, true);
        outputContainer.appendChild(item);
    }
}
function updateCmdPromptSelection(idx, autoscroll) {
    autoscroll = autoscroll??true;
    let outputContainer = document.querySelector('#qp .item-list-container');
    idx = idx??+outputContainer.getAttribute('data-selected-idx');
    outputContainer.setAttribute('data-selected-idx', idx.toString());
    let items = document.querySelectorAll('#qp .item-list-container > div');
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('selected');
    }
    if (idx < items.length) {
        items[idx].classList.add('selected');
        if (autoscroll) items[idx].scrollIntoView({block: "end", inline: "nearest", behavior: "smooth"});
    } else {
        console.warn('Invalid index', idx, 'for', items.length, 'items in command prompt');
        items[0].classList.add('selected');
    }
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
    registerKeyHandler('ArrowDown', e => {
        if (document.querySelector('#qp.shown')) {
            let count = document.querySelectorAll('#qp .item-list-container > div').length;
            let idx = +document.querySelector('#qp .item-list-container').getAttribute('data-selected-idx');
            idx = (idx + 1) % count;
            updateCmdPromptSelection(idx);
            e.preventDefault();
            e.stopPropagation();
        }
    })
    registerKeyHandler('ArrowUp', e => {
        if (document.querySelector('#qp.shown')) {
            let count = document.querySelectorAll('#qp .item-list-container > div').length;
            let idx = +document.querySelector('#qp .item-list-container').getAttribute('data-selected-idx');
            idx = idx - 1;
            idx += idx < 0 ? count : 0;
            updateCmdPromptSelection(idx);
            e.preventDefault();
            e.stopPropagation();
        }
    })
    updateCmdPromptOut([]);
    document.querySelector('#qp input').addEventListener('input', e => {
        let input = e.target.value;
        let results = handleCommand(input);
        updateCmdPromptOut(results);
    })
})