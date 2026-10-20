#!/usr/bin/env node
/**
 * Create or set up a CV game from this template.
 *
 *   npx github:ChimpVine-Games/cv-game-template                     → new folder, always the newest template
 *   npx github:ChimpVine-Games/cv-game-template --template v0.1.0   → new folder from a tagged version
 *   npm run setup                                                    → set up this copy in place
 *
 * Asks: project name, orientation, game ID. Flags skip the questions:
 *   --name <name>  --orientation landscape|portrait  --game-id <number>  --title <title>
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const REPO = 'ChimpVine-Games/cv-game-template';
const TEMPLATE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---- arguments -------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = name => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
};
const inPlace = argv.includes('--here');

// ---- helpers ---------------------------------------------------------------
const slugify = s => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const titleOf = slug => slug.split('-').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
const fail = msg => { console.error(`\n✖ ${msg}`); process.exit(1); };

/**
 * Line reader that works for typed answers and piped input alike
 * (rl.question() drops piped lines that arrive before the question is asked).
 */
function lineReader() {
    const rl = readline.createInterface({ input: process.stdin, terminal: false });
    const lines = [];
    const waiting = [];
    let closed = false;
    rl.on('line', line => (waiting.length ? waiting.shift()(line) : lines.push(line)));
    rl.on('close', () => { closed = true; while (waiting.length) waiting.shift()(''); });
    return {
        next: () => (lines.length ? Promise.resolve(lines.shift()) : closed ? Promise.resolve('') : new Promise(r => waiting.push(r))),
        close: () => rl.close()
    };
}

const color = (code, s) => `\x1b[${code}m${s}\x1b[0m`;
const cyan = s => color(36, s);
const dim = s => color(2, s);
const exitOnCtrlC = () => { process.stdout.write('\x1b[?25h\n'); process.exit(130); };

/** Interactive terminal: one readline per question, so the arrow-key picker can take over stdin in between. */
async function askTTY(label, def) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.on('SIGINT', exitOnCtrlC);
    try {
        const answer = await new Promise(resolve => rl.question(def !== undefined ? `? ${label} ${dim(`(${def})`)}: ` : `? ${label}: `, resolve));
        return answer.trim() || def;
    } finally {
        rl.close();
    }
}

/** Arrow-key picker (↑/↓ or j/k, Enter). Returns the chosen option's value. */
function selectTTY(label, options, index = 0) {
    const out = process.stdout;
    const n = options.length;
    return new Promise(resolve => {
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        out.write(`? ${label} ${dim('(↑/↓ then Enter)')}\n\x1b[?25l`);   // hide the cursor while picking

        const render = first => {
            if (!first) out.write(`\x1b[${n}A`);   // back to the first option line
            options.forEach((o, i) => {
                const hint = o.hint ? ' ' + dim(o.hint) : '';
                out.write(`\x1b[2K${i === index ? cyan(`❯ ${o.label}`) : `  ${o.label}`}${hint}\n`);
            });
        };
        const done = () => {
            process.stdin.off('keypress', onKey);
            process.stdin.setRawMode(false);
            process.stdin.pause();
            // collapse the list into one answered line
            out.write(`\x1b[${n + 1}A\x1b[0J? ${label}: ${cyan(options[index].label)}\n\x1b[?25h`);
            resolve(options[index].value);
        };
        const onKey = (_str, key = {}) => {
            if (key.ctrl && key.name === 'c') exitOnCtrlC();
            else if (key.name === 'up' || key.name === 'k') { index = (index - 1 + n) % n; render(false); }
            else if (key.name === 'down' || key.name === 'j') { index = (index + 1) % n; render(false); }
            else if (key.name === 'return' || key.name === 'enter') done();
        };
        process.stdin.on('keypress', onKey);
        render(true);
    });
}

/** Orientation and game ID currently in this project's game.config.ts. */
function currentValues() {
    try {
        const text = fs.readFileSync(path.join(process.cwd(), 'src/game/game.config.ts'), 'utf8');
        return {
            orientation: text.match(/^\s*orientation: '(landscape|portrait)',/m)?.[1],
            gameId: text.match(/^\s*gameId: (\d+),/m)?.[1]
        };
    } catch { return {}; }
}

async function ask() {
    const tty = !!(process.stdin.isTTY && process.stdout.isTTY);
    const piped = tty ? null : lineReader();
    const q = async (label, def) => {
        if (tty) return askTTY(label, def);
        process.stdout.write(def !== undefined ? `? ${label} (${def}): ` : `? ${label}: `);
        const answer = (await piped.next()).trim();
        process.stdout.write(`${answer}\n`);   // echo piped answers
        return answer || def;
    };
    // Re-running setup in place: the current values are the defaults, so Enter keeps them
    const current = inPlace ? currentValues() : {};
    try {
        let name = flag('name') ?? (inPlace ? path.basename(process.cwd()) : undefined);
        if (!flag('name')) name = await q('Project name', name);
        if (!name || !slugify(name)) fail('A project name is required (letters and numbers).');

        let orientation = flag('orientation');
        if (!orientation) {
            const def = current.orientation ?? 'landscape';
            orientation = tty
                ? await selectTTY('Orientation', [
                    { label: 'Landscape', hint: '1920 × 1080', value: 'landscape' },
                    { label: 'Portrait', hint: '1080 × 1920', value: 'portrait' }
                ], def === 'portrait' ? 1 : 0)
                : await q('Orientation, landscape or portrait', def);
        }
        orientation = orientation.toLowerCase();
        if (orientation === 'l') orientation = 'landscape';
        if (orientation === 'p') orientation = 'portrait';
        if (!['landscape', 'portrait'].includes(orientation)) fail(`Orientation must be "landscape" or "portrait", got "${orientation}".`);

        const gameIdRaw = flag('game-id') ?? await q('ChimpVine game ID (number)', current.gameId ?? '0');
        const gameId = Number(gameIdRaw);
        if (!Number.isInteger(gameId) || gameId < 0) fail(`Game ID must be a whole number, got "${gameIdRaw}".`);

        const title = flag('title') ?? titleOf(slugify(name));
        // Folder keeps the given casing but never spaces: "Grade3 Smart Sorter" → Grade3-Smart-Sorter
        const folder = name.trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
        return { folder, slug: slugify(name), title, orientation, gameId };
    } finally {
        piped?.close();
    }
}

/** Copy only the files git tracks: no node_modules, dist or other local junk. */
function copyTemplate(dest) {
    if (fs.existsSync(path.join(TEMPLATE_ROOT, '.git'))) {
        const files = execFileSync('git', ['ls-files', '-z'], { cwd: TEMPLATE_ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
        for (const f of files) {
            fs.mkdirSync(path.dirname(path.join(dest, f)), { recursive: true });
            fs.copyFileSync(path.join(TEMPLATE_ROOT, f), path.join(dest, f));
        }
        return;
    }
    fail('The template copy is not a git checkout.');   // unreachable: the npx copy hands over to a fresh clone
}

/** Replace exactly one match, or stop with a clear message (the template changed shape). */
function replaceOnce(file, pattern, replacement) {
    const text = fs.readFileSync(file, 'utf8');
    if (!pattern.test(text)) fail(`Could not find ${pattern} in ${path.basename(file)}. Was the file edited by hand?`);
    fs.writeFileSync(file, text.replace(pattern, replacement));
}

function apply(dir, a) {
    const q = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    // Identity block in the game config
    const config = path.join(dir, 'src/game/game.config.ts');
    replaceOnce(config, /^(\s*id: )'[^']*',/m, `$1'${a.slug}',`);
    replaceOnce(config, /^(\s*gameId: )\d+,/m, `$1${a.gameId},`);
    replaceOnce(config, /^(\s*title: )'[^']*',/m, `$1'${q(a.title)}',`);
    replaceOnce(config, /^(\s*orientation: )'(landscape|portrait)',/m, `$1'${a.orientation}',`);

    // package.json: the game is a normal project, not the template command
    const pkgFile = path.join(dir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
    pkg.name = a.slug;
    pkg.version = '0.1.0';
    delete pkg.bin;
    delete pkg.files;
    fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 4) + '\n');

    const lockFile = path.join(dir, 'package-lock.json');
    if (fs.existsSync(lockFile)) {
        const lock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
        lock.name = a.slug;
        lock.version = '0.1.0';
        if (lock.packages?.['']) {
            lock.packages[''].name = a.slug;
            lock.packages[''].version = '0.1.0';
            delete lock.packages[''].bin;
        }
        fs.writeFileSync(lockFile, JSON.stringify(lock, null, 4) + '\n');
    }

    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    replaceOnce(path.join(dir, 'index.html'), /<title>[^<]*<\/title>/, `<title>${esc(a.title)}</title>`);
    const readme = path.join(dir, 'README.md');
    replaceOnce(readme, /^# .*$/m, `# ${a.title}`);
    // "How to create a game from the template" is noise inside a game
    fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replace(/\r?\n<!-- template-only -->[\s\S]*?<!-- \/template-only -->\r?\n/, ''));
    // Template-maintenance docs are not part of a game
    for (const f of ['CREATE-A-GAME.md', 'PROJECT_CONTEXT.md']) fs.rmSync(path.join(dir, 'docs', f), { force: true });
    const docs = path.join(dir, 'docs');
    if (fs.existsSync(docs) && !fs.readdirSync(docs).length) fs.rmdirSync(docs);
}

// ---- npx launcher ----------------------------------------------------------
/**
 * npx caches github: packages and does not re-check them, so the copy npx runs can be old.
 * When run from that cache (not a git checkout), this script only downloads the newest template
 * (or the version asked for) and hands over to that copy's own setup. "@latest" without flags.
 */
function npxRef() {
    // npx writes the spec it was given into its cache folder: github:ORG/REPO#ref
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(TEMPLATE_ROOT, '..', '..', 'package.json'), 'utf8'));
        const spec = Object.values(pkg.dependencies ?? {}).find(s => String(s).includes(REPO));
        return spec?.split('#')[1];
    } catch { return undefined; }
}

function launchLatest() {
    const ref = flag('template') ?? npxRef();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-game-'));
    const src = path.join(tmp, 'template');
    const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_SSH_COMMAND: 'ssh -o BatchMode=yes' };
    const clone = url => {
        fs.rmSync(src, { recursive: true, force: true });
        return spawnSync('git', ['clone', '--quiet', '--depth', '1', ...(ref ? ['--branch', ref] : []), url, src], { env, encoding: 'utf8' });
    };

    process.stdout.write(dim(`Fetching ${ref ? `template ${ref}` : 'the latest template'}...`) + '\n');
    let r = clone(`git@github.com:${REPO}.git`);
    if (r.status !== 0) r = clone(`https://github.com/${REPO}.git`);
    if (r.status !== 0) {
        fail(`Could not download ${REPO}${ref ? ` (${ref})` : ''}.\n` +
            `  Check that git is installed and that you can access the repo (SSH key, or run: gh auth setup-git).\n` +
            `  ${(r.error?.message ?? r.stderr ?? '').trim()}`);
    }

    const args = argv.filter((a, i) => a !== '--template' && argv[i - 1] !== '--template');
    const run = spawnSync(process.execPath, [path.join(src, 'tools', 'setup.mjs'), ...args], { stdio: 'inherit' });
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* temp folder, left for the OS */ }
    process.exit(run.status ?? 1);
}

if (!inPlace && !fs.existsSync(path.join(TEMPLATE_ROOT, '.git'))) launchLatest();

// ---- main ------------------------------------------------------------------
console.log(inPlace ? '\nCV game setup\n' : '\nCreate a CV game\n');
const answers = await ask();

let dir = process.cwd();
if (!inPlace) {
    dir = path.resolve(process.cwd(), answers.folder);
    if (fs.existsSync(dir) && fs.readdirSync(dir).length) fail(`Folder "${answers.folder}" already exists and is not empty.`);
    copyTemplate(dir);
}
apply(dir, answers);

const template = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).cvTemplate;
console.log(`
✔ ${answers.title}  (${answers.orientation}, game ID ${answers.gameId}, template ${template})
${inPlace ? '' : `  created in ${dir}\n`}
Next:
${inPlace ? '' : `  cd ${answers.folder}\n`}  npm ci
  npm run dev

Read AGENTS.md before writing code. Your game lives in src/game/.
`);
