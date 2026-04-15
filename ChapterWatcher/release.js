// Run: node release.js [nickname]
// Stop: Ctrl+C

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const PKG_PATH = path.join(__dirname, 'package.json');
const MODULES_PATH = path.join(__dirname, 'node_modules');

if (!fs.existsSync(PKG_PATH)) {
    fs.writeFileSync(PKG_PATH, JSON.stringify({
        dependencies: {'node-fetch': '^2.7.0', 'open': '^8.4.2'}
    }, null, 2));
}

if (!fs.existsSync(MODULES_PATH)) {
    console.log('Installing dependencies...');
    execSync('npm install', {cwd: __dirname, stdio: 'inherit'});
}

const fetch = require('node-fetch');
const open = require('open');
const rl = require('readline');

// ── Colors ────────────────────────────────────────────────────────────────────

let purple, green, cyan, yellow, red;
const bold = '\x1b[1m';
const reset = '\x1b[0m';

function applyTheme(name) {
    if (name === 'green') {
        purple = '\x1b[32m';
        cyan = '\x1b[32m';
        yellow = '\x1b[2;32m';
        green = '\x1b[32m';
        red = '\x1b[31m';
    } else if (name === 'purple') {
        purple = '\x1b[35m';
        cyan = '\x1b[36m';
        yellow = '\x1b[35m';
        green = '\x1b[32m';
        red = '\x1b[31m';
    } else if (name === 'blue') {
        purple = '\x1b[34m';
        cyan = '\x1b[34m';
        yellow = '\x1b[36m';
        green = '\x1b[32m';
        red = '\x1b[31m';
    } else if (name === 'white') {
        purple = '\x1b[0m';
        cyan = '\x1b[0m';
        yellow = '\x1b[0m';
        green = '\x1b[0m';
        red = '\x1b[0m';
    }
}

// ── State ─────────────────────────────────────────────────────────────────────

const STATE_FILE = path.join(__dirname, 'state.json');

function loadState() {
    try {
        const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        if (!raw.settings) raw.settings = {intervalMinutes: 2, theme: 'purple'};
        if (!raw.entries) raw.entries = {};
        if (!raw.groups) raw.groups = {};
        // Migration: lastChapter → lastNumber
        let migrated = false;
        for (const e of Object.values(raw.entries)) {
            if (e.lastChapter !== undefined && e.lastNumber === undefined) {
                e.lastNumber = e.lastChapter;
                delete e.lastChapter;
                migrated = true;
            }
        }
        if (migrated) fs.writeFileSync(STATE_FILE, JSON.stringify(raw, null, 2));
        return raw;
    } catch {
        return {settings: {intervalMinutes: 2, theme: 'purple'}, entries: {}, groups: {}};
    }
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

applyTheme(loadState().settings.theme || 'purple');

// ── Spinner ───────────────────────────────────────────────────────────────────

const spinFrames = ['|', '/', '-', '\\'];
let spinnerTimer = null;
let spinFrameIdx = 0;
const activeWatchers = {};     // nickname → { nextNumber }
const allWatcherStates = {};   // nickname → ws object (for R-key immediate check)
const watcherIntervals = [];   // all setInterval IDs (for M/Q cleanup)

function buildSpinnerLine() {
    const names = Object.keys(activeWatchers);
    if (!names.length) return '';
    const parts = names.map(n =>
        `${bold}${n}${reset}${purple} (next: ${bold}${activeWatchers[n].nextNumber}${reset}${purple})`
    );
    return purple + spinFrames[spinFrameIdx % spinFrames.length] + ' watching: ' + parts.join(' | ') + reset;
}

const HINT_LINE = cyan + '  press R to check now · M for menu · Q to quit' + reset;

function startSpinner() {
    if (spinnerTimer) return;
    spinFrameIdx = 0;
    process.stdout.write(buildSpinnerLine() + '\n' + HINT_LINE + '\n');
    spinnerTimer = setInterval(() => {
        process.stdout.write('\x1b[2A\r' + buildSpinnerLine() + '\x1b[K\x1b[2B');
        spinFrameIdx++;
    }, 100);
}

function stopSpinner() {
    if (spinnerTimer) {
        clearInterval(spinnerTimer);
        spinnerTimer = null;
        process.stdout.write('\x1b[2A\r\x1b[J');
    }
}

// ── URL helpers ───────────────────────────────────────────────────────────────

function replaceLast(str, from, to) {
    const idx = str.lastIndexOf(from);
    if (idx === -1) return str;
    return str.slice(0, idx) + to + str.slice(idx + from.length);
}

function buildNextUrl(baseUrl, lastNumber) {
    return replaceLast(baseUrl, String(lastNumber), String(lastNumber + 1));
}

// ── Title extraction ──────────────────────────────────────────────────────────

function extractNumberFromTitle(title) {
    const matches = title.match(/\b(\d+)\b/g);
    return matches ? parseInt(matches[matches.length - 1], 10) : null;
}

// ── Watcher ───────────────────────────────────────────────────────────────────

async function checkForNewRelease(ws) {
    const usesNextUrl = !ws.method || ws.method === 'title-number' || ws.method === 'http-status';
    const url = usesNextUrl ? buildNextUrl(ws.url, ws.lastNumber) : ws.url;

    try {
        const response = await fetch(url);
        let found = false;
        let foundNumber = ws.lastNumber + 1;

        switch (ws.method) {
            case 'content-absent':
                found = response.ok && !(await response.text()).includes(ws.absentText);
                break;
            case 'content-present':
                found = response.ok && (await response.text()).includes(ws.presentText);
                break;
            case 'http-status':
                found = response.status === 200;
                break;
            default: { // title-number
                const html = await response.text();
                const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                if (!titleMatch) return false;
                const extracted = extractNumberFromTitle(titleMatch[1].trim());
                if (extracted !== null && extracted > ws.lastNumber) {
                    found = true;
                    foundNumber = extracted;
                }
                break;
            }
        }

        if (found) {
            stopSpinner();
            console.log(green + `✓ ${bold}${ws.nickname}${reset}${green}: #${bold}${foundNumber}${reset}${green} is out! Opening...` + reset);
            await open(url);
            ws.lastNumber = foundNumber;
            if (usesNextUrl) ws.url = url;
            const state = loadState();
            if (state.entries[ws.nickname]) {
                state.entries[ws.nickname].lastNumber = foundNumber;
                if (usesNextUrl) state.entries[ws.nickname].url = url;
                saveState(state);
            }
            if (activeWatchers[ws.nickname]) activeWatchers[ws.nickname].nextNumber = foundNumber + 1;
            return true;
        }
    } catch (err) {
        stopSpinner();
        console.error(red + `✗ ${bold}${ws.nickname}${reset}${red}: ${err.message}` + reset);
    }
    return false;
}

function startWatcher(nickname, url, lastNumber) {
    const state = loadState();
    const intervalMs = (state.settings.intervalMinutes || 2) * 60 * 1000;
    const entry = state.entries[nickname] || {};
    const ws = {
        nickname, url, lastNumber, method: entry.method || 'title-number',
        absentText: entry.absentText, presentText: entry.presentText
    };

    activeWatchers[nickname] = {nextNumber: lastNumber + 1};
    allWatcherStates[nickname] = ws;

    checkForNewRelease(ws).then(() => {
        if (activeWatchers[nickname]) activeWatchers[nickname].nextNumber = ws.lastNumber + 1;
        startSpinner();
    });

    const timer = setInterval(async () => {
        stopSpinner();
        await checkForNewRelease(ws);
        if (activeWatchers[nickname]) activeWatchers[nickname].nextNumber = ws.lastNumber + 1;
        startSpinner();
    }, intervalMs);

    watcherIntervals.push(timer);
}

// ── Watcher-mode keyboard control ─────────────────────────────────────────────

function cleanupWatchers() {
    stopSpinner();
    watcherIntervals.forEach(t => clearInterval(t));
    watcherIntervals.length = 0;
    for (const k in activeWatchers) delete activeWatchers[k];
    for (const k in allWatcherStates) delete allWatcherStates[k];
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdin.removeAllListeners('data');
}

async function checkAll() {
    stopSpinner();
    await Promise.all(
        Object.values(allWatcherStates).map(ws =>
            checkForNewRelease(ws).then(() => {
                if (activeWatchers[ws.nickname]) activeWatchers[ws.nickname].nextNumber = ws.lastNumber + 1;
            })
        )
    );
    startSpinner();
}

function enterWatcherMode() {
    closeIface();
    if (!process.stdin.isTTY) return;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let checkBusy = false;
    process.stdin.on('data', async key => {
        const k = key.toLowerCase();
        if (k === 'r') {
            if (checkBusy) return;
            checkBusy = true;
            await checkAll();
            checkBusy = false;
        } else if (k === 'm') {
            cleanupWatchers();
            mainMenu().catch(err => {
                console.error(red + err.message + reset);
                process.exit(1);
            });
        } else if (k === 'q' || key === '\u0003') {
            cleanupWatchers();
            console.log(green + 'Goodbye! 🏴‍☠️' + reset);
            process.exit(0);
        }
    });
}

// ── readline helpers ──────────────────────────────────────────────────────────

let iface = null;

function getIface() {
    if (!iface) iface = rl.createInterface({input: process.stdin, output: process.stdout});
    return iface;
}

function closeIface() {
    if (iface) {
        iface.close();
        iface = null;
    }
}

function ask(prompt) {
    return new Promise(resolve => getIface().question(prompt, answer => resolve(answer.trim())));
}

function resolveByIdxOrName(input, keys) {
    const idx = parseInt(input, 10);
    if (!isNaN(idx) && idx >= 1 && idx <= keys.length) return keys[idx - 1];
    return input;
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function clearScreen() {
    process.stdout.write('\x1b[2J\x1b[H');
}

function printHeader() {
    console.log(purple + bold + '══════════════════════════════════════' + reset);
    console.log(purple + bold + '        RELEASE WATCHER 🏴‍☠️        ' + reset);
    console.log(purple + bold + '══════════════════════════════════════' + reset);
    console.log();
}

// Prints a numbered list from a plain-object map.
// formatFn(key, value, maxKeyLen) → string (already colored, appended after [N] prefix)
// Returns false if empty.
function printList(map, formatFn, numbered = true) {
    const keys = Object.keys(map);
    if (!keys.length) return false;
    const maxLen = Math.max(...keys.map(k => k.length));
    keys.forEach((k, i) => {
        const prefix = numbered ? `${bold}[${i + 1}]${reset}${cyan} ` : '';
        console.log(cyan + '  ' + prefix + formatFn(k, map[k], maxLen) + reset);
    });
    return true;
}

function printEntries(entries) {
    const ok = printList(entries, (k, e, ml) =>
        `${bold}${k.padEnd(ml)}${reset}${cyan}   last: ${bold}${e.lastNumber}${reset}${cyan}   url: ${e.url}`
    );
    if (!ok) {
        console.log(red + '  No entries saved.' + reset);
        return false;
    }
    return true;
}

function printGroups(groups) {
    const ok = printList(groups, (k, g) =>
        `${bold}${k}${reset}${cyan}  →  ${g.length ? g.join(', ') : '(empty)'}`
    );
    if (!ok) {
        console.log(cyan + '  No groups saved yet.' + reset);
        return false;
    }
    return true;
}

async function pressEnter() {
    await ask(cyan + 'Press Enter to continue...' + reset);
}

// ── Menu runner ───────────────────────────────────────────────────────────────
// options: [{ label, action }]  — last entry is always treated as Back.
// Pressing 'b' or choosing the last option returns undefined (exit loop).
// Any truthy value returned by action() propagates up immediately.

async function runMenu(title, options) {
    while (true) {
        clearScreen();
        printHeader();
        if (title) {
            console.log(cyan + '  ' + title + reset);
            console.log();
        }
        options.forEach((o, i) =>
            console.log(yellow + `  ${bold}[${i + 1}]${reset}${yellow} ${o.label}` + reset)
        );
        console.log();
        const choice = await ask(yellow + '> ' + reset);
        clearScreen();
        printHeader();
        const idx = parseInt(choice, 10) - 1;
        if (choice.toLowerCase() === 'b' || idx === options.length - 1) return undefined;
        if (idx >= 0 && idx < options.length - 1) {
            const result = await options[idx].action();
            if (result) return result;
        } else {
            console.log(red + `Unknown option "${choice}".` + reset);
            await pressEnter();
        }
    }
}

// ── [1] Add new ───────────────────────────────────────────────────────────────

async function menuAddNew() {
    const state = loadState();

    let nickname;
    while (true) {
        nickname = await ask(yellow + 'Nickname: ' + reset);
        if (!nickname) console.log(red + 'Nickname cannot be empty. Try again.' + reset);
        else if (state.entries[nickname]) console.log(red + `Nickname "${nickname}" already exists. Try again.` + reset);
        else break;
    }

    clearScreen();
    printHeader();
    console.log(yellow + `  ${bold}[1]${reset}${yellow} Title number check (default)` + reset);
    console.log(yellow + `  ${bold}[2]${reset}${yellow} Content absent check` + reset);
    console.log(yellow + `  ${bold}[3]${reset}${yellow} Content present check` + reset);
    console.log(yellow + `  ${bold}[4]${reset}${yellow} HTTP status check` + reset);
    console.log();
    const mc = await ask(yellow + '> ' + reset);
    const method = {
        '1': 'title-number',
        '2': 'content-absent',
        '3': 'content-present',
        '4': 'http-status'
    }[mc] || 'title-number';

    const needsNumber = method === 'title-number' || method === 'http-status';
    const urlRegex = needsNumber ? /^https?:\/\/.+\d+/ : /^https?:\/\/.+/;
    const urlErr = needsNumber
        ? 'Invalid URL. Must start with http(s):// and contain a number in the path. Try again.'
        : 'Invalid URL. Must start with http(s)://. Try again.';

    let url;
    while (true) {
        url = await ask(yellow + 'URL of current chapter/episode: ' + reset);
        if (urlRegex.test(url)) break;
        console.log(red + urlErr + reset);
    }

    let lastNumber;
    while (true) {
        const raw = await ask(yellow + 'Current number: ' + reset);
        lastNumber = parseInt(raw, 10);
        if (!isNaN(lastNumber) && raw !== '') break;
        console.log(red + `"${raw}" is not a valid number. Try again.` + reset);
    }

    const entry = {url, lastNumber, method};
    if (method === 'content-absent')
        entry.absentText = await ask(yellow + 'Text that means "not yet released": ' + reset);
    else if (method === 'content-present')
        entry.presentText = await ask(yellow + 'Text that means "released": ' + reset);

    state.entries[nickname] = entry;
    saveState(state);

    console.log(green + `Saved! Starting watcher for ${bold}${nickname}${reset}${green}...` + reset);
    closeIface();
    startWatcher(nickname, url, lastNumber);
    return true;
}

// ── [2] Watch submenu ─────────────────────────────────────────────────────────

function launchWatchers(nicknames) {
    closeIface();
    const state = loadState();
    for (const name of nicknames) {
        const e = state.entries[name];
        startWatcher(name, e.url, e.lastNumber);
    }
    return true;
}

async function watchResumeSingle() {
    const state = loadState();
    if (!printEntries(state.entries)) {
        await pressEnter();
        return false;
    }
    console.log();
    const selected = [];
    while (true) {
        const raw = await ask(yellow + 'Enter nickname or index: ' + reset);
        const nickname = resolveByIdxOrName(raw, Object.keys(state.entries));
        if (!state.entries[nickname]) {
            console.log(red + `Nickname '${bold}${nickname}${reset}${red}' not found.` + reset);
            await pressEnter();
            return false;
        }
        if (!selected.includes(nickname)) selected.push(nickname);
        if ((await ask(yellow + 'Add another? (y/n): ' + reset)).toLowerCase() !== 'y') break;
    }
    return launchWatchers(selected);
}

async function watchGroup() {
    const state = loadState();
    if (!printGroups(state.groups)) {
        await pressEnter();
        return false;
    }
    console.log();
    const groupName = resolveByIdxOrName(await ask(yellow + 'Enter group name or index: ' + reset), Object.keys(state.groups));
    if (!state.groups[groupName]) {
        console.log(red + `Group '${bold}${groupName}${reset}${red}' not found.` + reset);
        await pressEnter();
        return false;
    }
    const members = state.groups[groupName].filter(n => state.entries[n]);
    if (!members.length) {
        console.log(red + 'No valid entries in this group.' + reset);
        await pressEnter();
        return false;
    }
    console.log(cyan + `Watching group ${bold}${groupName}${reset}${cyan} (${members.length} entr${members.length === 1 ? 'y' : 'ies'})...` + reset);
    return launchWatchers(members);
}

async function watchAll() {
    const state = loadState();
    const keys = Object.keys(state.entries);
    if (!keys.length) {
        console.log(red + 'No entries saved.' + reset);
        await pressEnter();
        return false;
    }
    console.log(cyan + `Watching all ${bold}${keys.length}${reset}${cyan} entr${keys.length === 1 ? 'y' : 'ies'}...` + reset);
    return launchWatchers(keys);
}

async function watchMenu() {
    return runMenu(null, [
        {label: 'Resume single', action: watchResumeSingle},
        {label: 'Watch group', action: watchGroup},
        {label: 'Watch all', action: watchAll},
        {
            label: 'Back', action: async () => {
            }
        },
    ]);
}

// ── [3] Manage → Entries submenu ──────────────────────────────────────────────

async function entriesListAll() {
    const state = loadState();
    console.log();
    if (!printList(state.entries, (k, e, ml) =>
        `${bold}${k.padEnd(ml)}${reset}${cyan}   last: ${bold}${e.lastNumber}${reset}${cyan}   url: ${e.url}`, false
    )) console.log(red + '  No entries saved.' + reset);
    console.log();
    await pressEnter();
}

async function entriesEdit() {
    const state = loadState();
    if (!printEntries(state.entries)) {
        await pressEnter();
        return;
    }
    console.log();
    const nickname = resolveByIdxOrName(await ask(yellow + 'Which nickname to edit? (name or index): ' + reset), Object.keys(state.entries));
    if (!state.entries[nickname]) {
        console.log(red + `Nickname '${bold}${nickname}${reset}${red}' not found.` + reset);
        await pressEnter();
        return;
    }

    await runMenu(`Editing: ${bold}${nickname}${reset}`, [
        {
            label: 'Update URL', action: async () => {
                const method = state.entries[nickname].method || 'title-number';
                const needsNum = method === 'title-number' || method === 'http-status';
                const urlRegex = needsNum ? /^https?:\/\/.+\d+/ : /^https?:\/\/.+/;
                console.log(cyan + state.entries[nickname].url + reset);
                let newUrl;
                while (true) {
                    newUrl = await ask(yellow + 'New URL: ' + reset);
                    if (urlRegex.test(newUrl)) break;
                    console.log(red + 'Invalid URL. Must start with http:// or https:// and contain a number in the path. Try again.' + reset);
                }
                state.entries[nickname].url = newUrl;
                saveState(state);
                console.log(green + 'Saved!' + reset);
                await pressEnter();
            }
        },
        {
            label: 'Update chapter/episode number', action: async () => {
                const method = state.entries[nickname].method || 'title-number';
                console.log(cyan + String(state.entries[nickname].lastNumber) + reset);
                const oldNumber = state.entries[nickname].lastNumber;
                let num;
                while (true) {
                    const raw = await ask(yellow + 'New number: ' + reset);
                    num = parseInt(raw, 10);
                    if (!isNaN(num) && raw !== '') break;
                    console.log(red + `"${raw}" is not a valid number.` + reset);
                }
                state.entries[nickname].lastNumber = num;
                if (method === 'title-number' || method === 'http-status') {
                    const newUrl = replaceLast(state.entries[nickname].url, String(oldNumber), String(num));
                    state.entries[nickname].url = newUrl;
                    console.log(cyan + newUrl + reset);
                }
                saveState(state);
                console.log(green + 'Saved!' + reset);
                await pressEnter();
            }
        },
        {
            label: 'Rename nickname', action: async () => {
                const newName = await ask(yellow + 'New nickname: ' + reset);
                state.entries[newName] = state.entries[nickname];
                delete state.entries[nickname];
                for (const g of Object.keys(state.groups)) {
                    const idx = state.groups[g].indexOf(nickname);
                    if (idx !== -1) state.groups[g][idx] = newName;
                }
                saveState(state);
                console.log(green + `Renamed to ${bold}${newName}${reset}${green}.` + reset);
                await pressEnter();
                return 'done'; // exit runMenu (nickname no longer exists)
            }
        },
        {
            label: 'Back', action: async () => {
            }
        },
    ]);
}

async function entriesDelete() {
    const state = loadState();
    if (!printEntries(state.entries)) {
        await pressEnter();
        return;
    }
    console.log();
    const nickname = resolveByIdxOrName(await ask(yellow + 'Which nickname to delete? (name or index): ' + reset), Object.keys(state.entries));
    if (!state.entries[nickname]) {
        console.log(red + `Nickname '${bold}${nickname}${reset}${red}' not found.` + reset);
        await pressEnter();
        return;
    }
    const confirm = (await ask(red + `Delete ${bold}${nickname}${reset}${red}? (y/n): ` + reset)).toLowerCase();
    if (confirm === 'y') {
        delete state.entries[nickname];
        for (const g of Object.keys(state.groups))
            state.groups[g] = state.groups[g].filter(n => n !== nickname);
        saveState(state);
        console.log(green + `Deleted ${bold}${nickname}${reset}${green}.` + reset);
    }
    await pressEnter();
}

async function entriesMenu() {
    return runMenu(null, [
        {label: 'List all', action: entriesListAll},
        {label: 'Edit entry', action: entriesEdit},
        {label: 'Delete entry', action: entriesDelete},
        {
            label: 'Back', action: async () => {
            }
        },
    ]);
}

// ── [3] Manage → Groups submenu ───────────────────────────────────────────────

async function groupsList() {
    const state = loadState();
    console.log();
    printGroups(state.groups);
    console.log();
    await pressEnter();
}

async function groupsCreate() {
    const state = loadState();
    const name = await ask(yellow + 'Group name: ' + reset);
    if (state.groups[name]) {
        console.log(red + `Group '${bold}${name}${reset}${red}' already exists.` + reset);
        await pressEnter();
        return;
    }
    if (!Object.keys(state.entries).length) {
        console.log(red + 'No entries saved. Add entries first.' + reset);
        await pressEnter();
        return;
    }
    printEntries(state.entries);
    console.log();
    const members = [];
    while (true) {
        const raw = await ask(yellow + 'Add entry (nickname or index, or "done" to finish): ' + reset);
        if (raw.toLowerCase() === 'done') break;
        const input = resolveByIdxOrName(raw, Object.keys(state.entries));
        if (!state.entries[input]) {
            console.log(red + `Nickname '${bold}${input}${reset}${red}' not found.` + reset);
            continue;
        }
        if (!members.includes(input)) {
            members.push(input);
            console.log(green + `  Added ${bold}${input}${reset}${green}.` + reset);
        }
    }
    state.groups[name] = members;
    saveState(state);
    console.log(green + `Group ${bold}${name}${reset}${green} saved.` + reset);
    await pressEnter();
}

async function groupsEdit() {
    const state = loadState();
    if (!printGroups(state.groups)) {
        await pressEnter();
        return;
    }
    console.log();
    const name = resolveByIdxOrName(await ask(yellow + 'Which group to edit? (name or index): ' + reset), Object.keys(state.groups));
    if (!state.groups[name]) {
        console.log(red + `Group '${bold}${name}${reset}${red}' not found.` + reset);
        await pressEnter();
        return;
    }

    await runMenu(`Group: ${bold}${name}${reset}${cyan}  →  ${state.groups[name].length ? state.groups[name].join(', ') : '(empty)'}`, [
        {
            label: 'Add entry', action: async () => {
                printEntries(state.entries);
                console.log();
                const input = resolveByIdxOrName(await ask(yellow + 'Nickname to add (name or index): ' + reset), Object.keys(state.entries));
                if (!state.entries[input]) console.log(red + `Nickname '${bold}${input}${reset}${red}' not found.` + reset);
                else if (state.groups[name].includes(input)) console.log(red + `'${input}' is already in this group.` + reset);
                else {
                    state.groups[name].push(input);
                    saveState(state);
                    console.log(green + `Added ${bold}${input}${reset}${green}.` + reset);
                }
                await pressEnter();
            }
        },
        {
            label: 'Remove entry', action: async () => {
                if (!state.groups[name].length) {
                    console.log(red + 'Group is empty.' + reset);
                    await pressEnter();
                    return;
                }
                state.groups[name].forEach((n, i) => console.log(cyan + `  ${bold}[${i + 1}]${reset}${cyan} ${n}` + reset));
                console.log();
                const input = resolveByIdxOrName(await ask(yellow + 'Nickname to remove (name or index): ' + reset), state.groups[name]);
                const idx = state.groups[name].indexOf(input);
                if (idx === -1) console.log(red + `'${input}' is not in this group.` + reset);
                else {
                    state.groups[name].splice(idx, 1);
                    saveState(state);
                    console.log(green + `Removed ${bold}${input}${reset}${green}.` + reset);
                }
                await pressEnter();
            }
        },
        {
            label: 'Rename group', action: async () => {
                const newName = await ask(yellow + 'New group name: ' + reset);
                state.groups[newName] = state.groups[name];
                delete state.groups[name];
                saveState(state);
                console.log(green + `Renamed to ${bold}${newName}${reset}${green}.` + reset);
                await pressEnter();
                return 'done'; // exit runMenu (name no longer exists)
            }
        },
        {
            label: 'Back', action: async () => {
            }
        },
    ]);
}

async function groupsDelete() {
    const state = loadState();
    if (!printGroups(state.groups)) {
        await pressEnter();
        return;
    }
    console.log();
    const name = resolveByIdxOrName(await ask(yellow + 'Which group to delete? (name or index): ' + reset), Object.keys(state.groups));
    if (!state.groups[name]) {
        console.log(red + `Group '${bold}${name}${reset}${red}' not found.` + reset);
        await pressEnter();
        return;
    }
    const confirm = (await ask(red + `Delete group ${bold}${name}${reset}${red}? (y/n): ` + reset)).toLowerCase();
    if (confirm === 'y') {
        delete state.groups[name];
        saveState(state);
        console.log(green + `Deleted ${bold}${name}${reset}${green}.` + reset);
    }
    await pressEnter();
}

async function groupsMenu() {
    return runMenu(null, [
        {label: 'List groups', action: groupsList},
        {label: 'Create group', action: groupsCreate},
        {label: 'Edit group', action: groupsEdit},
        {label: 'Delete group', action: groupsDelete},
        {
            label: 'Back', action: async () => {
            }
        },
    ]);
}

// ── [3] Manage submenu ────────────────────────────────────────────────────────

async function manageMenu() {
    return runMenu(null, [
        {label: 'Entries', action: entriesMenu},
        {label: 'Groups', action: groupsMenu},
        {
            label: 'Back', action: async () => {
            }
        },
    ]);
}

// ── [4] Settings submenu ──────────────────────────────────────────────────────

async function settingsMenu() {
    while (true) {
        const state = loadState();
        clearScreen();
        printHeader();
        console.log(yellow + `  ${bold}[1]${reset}${yellow} Change check interval ` +
            cyan + `(current: ${bold}${state.settings.intervalMinutes}${reset}${cyan} min)` + reset);
        console.log(yellow + `  ${bold}[2]${reset}${yellow} Change theme ` +
            cyan + `(current: ${bold}${state.settings.theme || 'purple'}${reset}${cyan})` + reset);
        console.log(yellow + `  ${bold}[3]${reset}${yellow} Back` + reset);
        console.log();

        const choice = await ask(yellow + '> ' + reset);

        if (choice === '1') {
            clearScreen();
            printHeader();
            let minutes;
            while (true) {
                const raw = await ask(yellow + `Interval in minutes (current: ${state.settings.intervalMinutes}): ` + reset);
                minutes = parseFloat(raw);
                if (!isNaN(minutes) && minutes > 0) break;
                console.log(red + 'Please enter a number greater than 0.' + reset);
            }
            state.settings.intervalMinutes = minutes;
            saveState(state);
            console.log(green + `Saved! New interval: ${bold}${minutes}${reset}${green} minutes.` + reset);
            await pressEnter();
        } else if (choice === '2') {
            clearScreen();
            printHeader();
            console.log(yellow + `  ${bold}[1]${reset}${yellow} Green` + reset);
            console.log(yellow + `  ${bold}[2]${reset}${yellow} Purple` + reset);
            console.log(yellow + `  ${bold}[3]${reset}${yellow} Blue` + reset);
            console.log(yellow + `  ${bold}[4]${reset}${yellow} White (no color)` + reset);
            console.log();
            const sub = await ask(yellow + '> ' + reset);
            if (sub.toLowerCase() !== 'b') {
                const themeName = {'1': 'green', '2': 'purple', '3': 'blue', '4': 'white'}[sub];
                if (themeName) {
                    applyTheme(themeName);
                    state.settings.theme = themeName;
                    saveState(state);
                    console.log(green + `Theme set to ${bold}${themeName}${reset}${green}.` + reset);
                } else {
                    console.log(red + `Unknown option "${sub}".` + reset);
                }
            }
        } else if (choice === '3' || choice.toLowerCase() === 'b') {
            return;
        } else {
            console.log(red + `Unknown option "${choice}".` + reset);
            await pressEnter();
        }
    }
}

// ── Main menu ─────────────────────────────────────────────────────────────────

async function mainMenu() {
    while (true) {
        clearScreen();
        printHeader();
        console.log(yellow + `  ${bold}[1]${reset}${yellow} Add new` + reset);
        console.log(yellow + `  ${bold}[2]${reset}${yellow} Watch` + reset);
        console.log(yellow + `  ${bold}[3]${reset}${yellow} Manage` + reset);
        console.log(yellow + `  ${bold}[4]${reset}${yellow} Settings` + reset);
        console.log(yellow + `  ${bold}[b]${reset}${yellow} Exit` + reset);
        console.log();

        const choice = await ask(yellow + '> ' + reset);
        clearScreen();
        printHeader();

        let watcherMode = false;
        if (choice === '1') watcherMode = await menuAddNew();
        else if (choice === '2') watcherMode = await watchMenu();
        else if (choice === '3') await manageMenu();
        else if (choice === '4') await settingsMenu();
        else if (choice.toLowerCase() === 'b') {
            closeIface();
            console.log(green + 'Goodbye! 🏴‍☠️' + reset);
            process.exit(0);
        } else {
            console.log(red + `Unknown option "${choice}".` + reset);
            await pressEnter();
        }

        if (watcherMode) {
            enterWatcherMode();
            return;
        }
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────

const arg = process.argv[2];

if (arg) {
    const state = loadState();
    const entry = state.entries[arg];
    if (!entry) {
        console.error(red + `Nickname '${bold}${arg}${reset}${red}' not found. Run ${bold}node release.js${reset}${red} without arguments to add it.` + reset);
        process.exit(1);
    }
    printHeader();
    console.log(cyan + `Starting watcher for ${bold}${arg}${reset}${cyan} from #${bold}${entry.lastNumber}${reset}${cyan}...` + reset);
    startWatcher(arg, entry.url, entry.lastNumber);
    enterWatcherMode();
} else {
    mainMenu().catch(err => {
        console.error(red + err.message + reset);
        process.exit(1);
    });
}
