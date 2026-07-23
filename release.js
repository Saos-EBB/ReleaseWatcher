// Run: node release.js  (requires Node.js 18+)
const fs   = require('fs');
const path = require('path');
const rl   = require('readline');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');

const DATA = path.join(__dirname, 'mangas.json');

function openUrl(url) {
    exec(`xdg-open "${url}"`);
}

const R = '\x1b[0m', B = '\x1b[1m', G = '\x1b[32m', RE = '\x1b[31m', C = '\x1b[36m', Y = '\x1b[33m';

function load() { try { return JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch { return []; } }
function save(list) { fs.writeFileSync(DATA, JSON.stringify(list, null, 2)); }

function siteLabel(site) {
    if (site === 'tcb')       return B + Y + '[TCB]' + R;
    if (site === 'mangafire') return B + G + '[MF] ' + R;
    return '[?]  ';
}

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' };

// TCB: chapter URLs are /chapters/{id}/...-chapter-{num}, but the site
// reassigns {id} to later chapters over time (e.g. id 7995 pointed at chapter
// 1186, now points at 1188), so both guessing the next URL and reading "Next"
// off the saved page can end up chasing a stale reference. The homepage
// always lists each series' true latest chapter, so read that directly.
async function checkTCB(m) {
    const slugMatch = m.url.match(/\/chapters\/\d+\/(.+)-chapter-\d+/i);
    if (!slugMatch) return null;
    const res = await fetch('https://tcbonepiecechapters.com/', { signal: AbortSignal.timeout(10000), headers: UA });
    if (res.status !== 200) return null;
    const html = await res.text();
    const re = new RegExp(`href="(/chapters/\\d+/${slugMatch[1]}-chapter-(\\d+))"`, 'i');
    const match = html.match(re);
    if (!match) return null;
    const chapter = parseInt(match[2], 10);
    return chapter > m.chapter ? { url: new URL(match[1], res.url).href, chapter } : null;
}

// MangaFire chapter URLs use opaque numeric IDs (/chapter/6927219), not the chapter
// number, so the next chapter's URL can't be guessed by incrementing anymore. The site
// is also a client-rendered SPA behind a Cloudflare JS challenge — a plain fetch to its
// chapter-list API now gets rejected with 403 "Missing token". A real browser passes
// the challenge as a side effect of loading the page, so drive one with Puppeteer and
// capture the same JSON response the page's own JS receives.
function mangaFireTitleUrl(chapterUrl) {
    return chapterUrl.replace(/\/chapter\/\d+.*$/, '');
}

async function checkMangaFire(m, nextNum) {
    const browser = await puppeteer.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setUserAgent(UA['User-Agent']);
        const responsePromise = page.waitForResponse(
            (res) => /\/api\/titles\/[^/]+\/chapters/.test(res.url()),
            { timeout: 20000 }
        );
        await page.goto(mangaFireTitleUrl(m.url), { waitUntil: 'domcontentloaded', timeout: 20000 });
        const res = await responsePromise;
        if (res.status() !== 200) return null;
        const { items } = await res.json();
        const matches = (items || []).filter(c => c.language === 'en' && c.number === nextNum);
        if (!matches.length) return null;
        const chapter = matches.find(c => c.type === 'official') ?? matches[0];
        return { url: `${mangaFireTitleUrl(m.url)}/chapter/${chapter.id}`, chapter: chapter.number };
    } finally {
        await browser.close();
    }
}

// ponytail: real seam — two adapters exist today, justified
const SITES = { tcb: checkTCB, mangafire: checkMangaFire };

async function checkAll(list) {
    if (!list.length) { console.log(RE + 'No manga saved.' + R); return []; }
    console.log(C + 'Checking...\n' + R);
    const found = [];
    for (const m of list) {
        const checker = SITES[m.site];
        if (!checker) { console.log(RE + `  ✗ ${m.name}: unknown site '${m.site}'` + R); continue; }
        const nextNum = m.chapter + 1;
        try {
            const result = await checker(m, nextNum);
            if (result) {
                console.log(G + B + `  ✓ ${m.name}: Chapter ${result.chapter} is OUT!` + R);
                console.log(C + `    → ${result.url}` + R);
                found.push({ manga: m, url: result.url, chapter: result.chapter });
            } else {
                console.log(C + `  · ${m.name}: not yet  (currently at chapter ${m.chapter})` + R);
            }
        } catch (e) {
            console.log(RE + `  ✗ ${m.name}: ${e.message}` + R);
        }
    }
    return found;
}

const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
const ask   = (q) => new Promise(r => iface.question(q, a => r(a.trim())));

async function cmdAdd(list) {
    const name = await ask('Name (e.g. One Piece): ');
    if (!name) { console.log(RE + 'Name cannot be empty.' + R); return; }
    console.log(Y + '  [1] TCB (tcbscans)' + R);
    console.log(Y + '  [2] MangaFire' + R);
    const siteChoice = await ask('Site (1/2): ');
    const site = siteChoice === '1' ? 'tcb' : siteChoice === '2' ? 'mangafire' : null;
    if (!site) { console.log(RE + 'Invalid choice.' + R); return; }
    const url = await ask('Current chapter URL: ');
    if (!/^https?:\/\/.+\d/.test(url)) { console.log(RE + 'Invalid URL – must start with http(s):// and contain a chapter number.' + R); return; }
    const raw = await ask('Current chapter number: ');
    const chapter = parseInt(raw, 10);
    if (isNaN(chapter)) { console.log(RE + 'Not a valid number.' + R); return; }
    list.push({ name, site, url, chapter });
    save(list);
    console.log(G + `Saved "${name}" (${site === 'tcb' ? 'TCB' : 'MangaFire'}) at chapter ${chapter}.` + R);
}

async function cmdDelete(list) {
    if (!list.length) { console.log(RE + 'Nothing to delete.' + R); return; }
    const raw = await ask('Number to delete: ');
    const idx = parseInt(raw, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= list.length) { console.log(RE + 'Invalid number.' + R); return; }
    const [removed] = list.splice(idx, 1);
    save(list);
    console.log(G + `Deleted "${removed.name}".` + R);
}

async function cmdUpdate(list) {
    if (!list.length) { console.log(RE + 'Nothing to update.' + R); return; }
    const rawIdx = await ask('Number to update: ');
    const idx = parseInt(rawIdx, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= list.length) { console.log(RE + 'Invalid number.' + R); return; }
    const m = list[idx];
    const rawChapter = await ask(`New chapter number for "${m.name}" (current: ${m.chapter}): `);
    const chapter = parseInt(rawChapter, 10);
    if (isNaN(chapter)) { console.log(RE + 'Not a valid number.' + R); return; }
    m.chapter = chapter;
    save(list);
    console.log(G + `Updated "${m.name}" to chapter ${chapter}.` + R);
}

async function cmdCheck(list) {
    const found = await checkAll(list);
    for (const { manga, url, chapter } of found) {
        manga.chapter = chapter;
        manga.url = url;
        openUrl(url);
    }
    if (found.length) save(list);
}

const COMMANDS = { a: cmdAdd, d: cmdDelete, n: cmdUpdate, c: cmdCheck };

async function main() {
    console.log('\n' + B + RE +
        ' ███████╗██╗   ██╗ ██████╗██╗  ██╗\n' +
        ' ██╔════╝██║   ██║██╔════╝██║ ██╔╝\n' +
        ' █████╗  ██║   ██║██║     █████╔╝ \n' +
        ' ██╔══╝  ██║   ██║██║     ██╔═██╗ \n' +
        ' ██║     ╚██████╔╝╚██████╗██║  ██╗\n' +
        ' ╚═╝      ╚═════╝  ╚═════╝╚═╝  ╚═╝\n' +
        '\n' +
        ' ███████╗██████╗  ██████╗ ██╗██╗      ███████╗██████╗ ███████╗\n' +
        ' ██╔════╝██╔══██╗██╔═══██╗██║██║      ██╔════╝██╔══██╗██╔════╝\n' +
        ' ███████╗██████╔╝██║   ██║██║██║      █████╗  ██████╔╝███████╗\n' +
        ' ╚════██║██╔═══╝ ██║   ██║██║██║      ██╔══╝  ██╔══██╗╚════██║\n' +
        ' ███████║██║     ╚██████╔╝██║███████╗ ███████╗██║  ██║███████║\n' +
        ' ╚══════╝╚═╝      ╚═════╝ ╚═╝╚══════╝ ╚══════╝╚═╝  ╚═╝╚══════╝\n' + R);

    while (true) {
        const list = load();
        console.log('\n' + B + C + '─── MANGA WATCHER ───' + R);
        if (list.length) {
            list.forEach((m, i) => {
                console.log(C + `  [${i + 1}] ${siteLabel(m.site)} ${B}${m.name}${R}${C}  –  Chapter ${m.chapter}` + R);
            });
        } else {
            console.log(C + '  (no manga saved)' + R);
        }
        console.log(Y + '\n  [a] Add  [d] Delete  [n] Update chapter  [c] Check all  [q] Quit\n' + R);

        const cmd = (await ask(Y + '> ' + R)).toLowerCase();
        if (cmd === 'q') { iface.close(); process.exit(0); }
        if (COMMANDS[cmd]) await COMMANDS[cmd](list);
    }
}

main().catch(e => { console.error(e.message); process.exit(1); });
