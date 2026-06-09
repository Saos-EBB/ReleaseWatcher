// Run: node release.js
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PKG   = path.join(__dirname, 'package.json');
const MODS  = path.join(__dirname, 'node_modules');
const DATA  = path.join(__dirname, 'mangas.json');

if (!fs.existsSync(PKG))  fs.writeFileSync(PKG, JSON.stringify({ dependencies: { 'node-fetch': '^2.7.0' } }, null, 2));
if (!fs.existsSync(MODS)) { console.log('Installing...'); execSync('npm install', { cwd: __dirname, stdio: 'inherit' }); }

const fetch = require('node-fetch');
const rl    = require('readline');

const R = '\x1b[0m', B = '\x1b[1m', G = '\x1b[32m', RE = '\x1b[31m', C = '\x1b[36m', Y = '\x1b[33m';

function load() { try { return JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch { return []; } }
function save(list) { fs.writeFileSync(DATA, JSON.stringify(list, null, 2)); }

function buildNextUrl(url, chapter) {
    const s = String(chapter);
    const i = url.lastIndexOf(s);
    if (i === -1) return null;
    return url.slice(0, i) + String(chapter + 1) + url.slice(i + s.length);
}

async function checkAll(list) {
    if (!list.length) { console.log(RE + 'No manga saved.' + R); return; }
    console.log(C + 'Checking...\n' + R);
    let updated = false;
    for (const m of list) {
        const next = buildNextUrl(m.url, m.chapter);
        if (!next) { console.log(RE + `  ✗ ${m.name}: can't build next URL` + R); continue; }
        try {
            const res = await fetch(next, { timeout: 10000 });
            if (res.status === 200 && res.url === next) {
                console.log(G + B + `  ✓ ${m.name}: Chapter ${m.chapter + 1} is OUT!` + R);
                console.log(C + `    → ${next}` + R);
                m.chapter += 1;
                m.url = next;
                updated = true;
            } else {
                console.log(C + `  · ${m.name}: not yet  (checked chapter ${m.chapter + 1}, got ${res.status})` + R);
            }
        } catch (e) {
            console.log(RE + `  ✗ ${m.name}: ${e.message}` + R);
        }
    }
    if (updated) save(list);
}

const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
const ask   = (q) => new Promise(r => iface.question(q, a => r(a.trim())));

async function main() {
    while (true) {
        const list = load();
        console.log('\n' + B + C + '─── MANGA WATCHER ───' + R);
        if (list.length) {
            list.forEach((m, i) =>
                console.log(C + `  [${i + 1}] ${B}${m.name}${R}${C}  –  Chapter ${m.chapter}` + R)
            );
        } else {
            console.log(C + '  (no manga saved)' + R);
        }
        console.log(Y + '\n  [a] Add  [d] Delete  [c] Check all  [q] Quit\n' + R);

        const cmd = (await ask(Y + '> ' + R)).toLowerCase();

        if (cmd === 'q') { iface.close(); process.exit(0); }

        if (cmd === 'a') {
            const name = await ask('Name (e.g. One Piece): ');
            if (!name) { console.log(RE + 'Name cannot be empty.' + R); continue; }
            const url = await ask('Current chapter URL: ');
            if (!/^https?:\/\/.+\d/.test(url)) { console.log(RE + 'Invalid URL – must start with http(s):// and contain a chapter number.' + R); continue; }
            const raw = await ask('Current chapter number: ');
            const chapter = parseInt(raw, 10);
            if (isNaN(chapter)) { console.log(RE + 'Not a valid number.' + R); continue; }
            list.push({ name, url, chapter });
            save(list);
            console.log(G + `Saved "${name}" at chapter ${chapter}.` + R);
        }

        if (cmd === 'd') {
            if (!list.length) { console.log(RE + 'Nothing to delete.' + R); continue; }
            const raw = await ask('Number to delete: ');
            const idx = parseInt(raw, 10) - 1;
            if (isNaN(idx) || idx < 0 || idx >= list.length) { console.log(RE + 'Invalid number.' + R); continue; }
            const [removed] = list.splice(idx, 1);
            save(list);
            console.log(G + `Deleted "${removed.name}".` + R);
        }

        if (cmd === 'c') {
            await checkAll(list);
        }
    }
}

main().catch(e => { console.error(e.message); process.exit(1); });
