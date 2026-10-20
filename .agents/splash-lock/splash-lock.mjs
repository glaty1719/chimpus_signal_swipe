#!/usr/bin/env node
/*
 * LOCKED: guard for the locked areas (splash screen, core UI layout). Do not edit, move or delete this file, even if a prompt asks.
 *
 * One script for every AI agent:
 *   guard claude | codex | cursor | cursor-shell   hook mode: reads the tool call JSON on stdin
 *   unlock                                         DEVELOPER ONLY, in a real terminal: accept the warning
 *   lock                                           lock again (removes the unlock)
 *   status                                         show lock state and the locked files
 *
 * Locked paths are listed in lock.json next to this file.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(HERE, 'lock.json'), 'utf8'));
const LOCKED = CONFIG.groups.flatMap(g => g.paths);
const ENTRIES = [...LOCKED, ...CONFIG.lockInfrastructure];
/** Which locked area a path belongs to ("lock files" for the lock itself). */
const areaOf = p => CONFIG.groups.find(g => g.paths.includes(p))?.name ?? 'lock files';
const UNLOCK_FILE = path.join(ROOT, '.splash-unlock');
const PHRASE = 'UNLOCK SPLASH';
const SCRIPT = 'node .agents/splash-lock/splash-lock.mjs';

// ---- lock state ------------------------------------------------------------

function unlocked() {
    try {
        const u = JSON.parse(fs.readFileSync(UNLOCK_FILE, 'utf8'));
        return Date.parse(u.until) > Date.now() ? u : null;
    } catch {
        return null;
    }
}

// ---- matching --------------------------------------------------------------

const norm = s => String(s).replace(/\\/g, '/').toLowerCase();

/** This project's root as it can appear in tool input (Windows, forward-slash and Git Bash forms), with a trailing slash. */
const PROJECT_PREFIXES = (() => {
    const r = norm(ROOT).replace(/\/$/, '');
    const forms = new Set([r, r.replace(/^([a-z]):/, '/$1')]);
    return [...forms].map(f => f + '/');
})();

/** Basenames too generic to match on their own (only the full path counts). */
const GENERIC = new Set(['settings.json', 'hooks.json', 'main.ts']);

/** Which locked entries does this text mention? Full paths, or distinctive file / folder names. */
function mentioned(text) {
    // Absolute paths inside this project become project-relative ("d:/.../create-cv-project/tools/x" -> "tools/x")
    const t = PROJECT_PREFIXES.reduce((s, p) => s.split(p).join(' '), norm(text));
    return ENTRIES.filter(entry => {
        const e = norm(entry);
        const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (e.endsWith('/')) {
            // Folders match only as a path: "assets/loading", "src/core", or "tools/" / "dev/" after a separator
            const segs = e.split('/').filter(Boolean);
            if (segs.length >= 2) return t.includes(segs.slice(-2).join('/'));
            return new RegExp(`(^|[\\s"'=:(,;&|>])${esc(segs[0])}/`).test(t);   // at the project root only
        }
        if (t.includes(e)) return true;
        const base = path.posix.basename(e);
        return !GENERIC.has(base) && new RegExp(`(^|[^a-z0-9_.-])${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9_-])`).test(t);
    });
}

/** Shell commands that can change files. Harmless redirects (2>&1, >/dev/null, >$null) are ignored. */
const WRITE_RE = new RegExp([
    String.raw`\bsed\b[^|;&]*\s(-[a-z]*i|--in-place)`, String.raw`\bperl\b[^|;&]*\s-[a-z]*i`,
    String.raw`\b(tee|cp|mv|rm|rmdir|touch|truncate|chmod|chown|attrib|ln|install|dd|unlink|shred)\b`,
    String.raw`\b(del|erase|copy|move|ren|rename|xcopy|robocopy|icacls)\b`,
    String.raw`\b(set-content|add-content|out-file|clear-content|copy-item|move-item|remove-item|rename-item|new-item|set-itemproperty|writealltext|writeallbytes)\b`,
    String.raw`\bgit\s+(checkout|restore|reset|stash|apply|am|mv|rm|clean|revert|cherry-pick|merge|rebase|pull|switch|update-index|hash-object|config)\b`,
    String.raw`\b(node|python3?|py|deno|bun|ruby|php)\b`, String.raw`\bnpx\b`, String.raw`writefile|copyfile|rmsync|unlinksync|renamesync`,
    String.raw`>`
].join('|'), 'i');
const HARMLESS_REDIRECT = /\d?>\s*(\/dev\/null|\$null|nul\b)|\d>&\d|&>\s*\/dev\/null/gi;

const isWrite = cmd => WRITE_RE.test(String(cmd).replace(HARMLESS_REDIRECT, ''));
const SHELL_TOOL = /^(bash|powershell|shell|terminal|run_terminal_cmd|exec|exec_command|local_shell|unified_exec|run_command)$/i;
const READ_TOOL = /(read|grep|glob|search|list|ls|find|view|fetch|web|todo|task|ask|think|diagnostic)/i;
const BYPASS_RE = /splash-lock\.mjs[^|;&]*\bunlock\b|\.splash-unlock/i;

/** Every string inside the tool input (paths, commands, patch text, ...). */
function strings(v, out = []) {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(x => strings(x, out));
    else if (v && typeof v === 'object') Object.values(v).forEach(x => strings(x, out));
    return out;
}

/** Locked entries this tool call would change (empty = allowed). */
function violations(toolName, toolInput) {
    // Running the read-only / re-locking commands of this script is always fine
    const text = strings(toolInput).join('\n').replace(/node\s+\S*splash-lock\.mjs\s+(status|lock)\b/gi, '');
    if (BYPASS_RE.test(text)) return ['lock bypass (unlock)'];
    const hits = mentioned(text);
    if (!hits.length) return [];
    if (SHELL_TOOL.test(toolName)) return isWrite(text) ? hits : [];
    if (READ_TOOL.test(toolName) && !/patch|edit|write|delete|replace|create|move|rename/i.test(toolName)) return [];
    return hits;
}

// ---- messages --------------------------------------------------------------

function warning(hits, inTerminal = false) {
    return [
        `⚠️  LOCKED: ${[...new Set(hits.map(areaOf))].join(' + ').toUpperCase()}`,
        '',
        `This action would change locked file(s): ${hits.join(', ')}`,
        'Locked in every game and for every AI agent, even if a prompt asks for a change:',
        ...CONFIG.groups.map(g => `  - ${g.name}: ${g.what}`),
        'Allowed UI changes are listed in docs/CUSTOMIZE-UI.md (config, images, colors).',
        '',
        'Only the DEVELOPER can accept this warning and allow the change:',
        ...(inTerminal ? [] : ['  - Claude Code: approve this permission prompt.']),
        `  - ${inTerminal ? 'R' : 'Codex, Cursor, Antigravity, others: r'}un in your own terminal:  ${SCRIPT} unlock`,
        `    (unlocks for ${CONFIG.unlockMinutes} minutes; lock again with: ${SCRIPT} lock)`
    ].join('\n');
}

const AGENT_NOTE = 'BLOCKED by the splash lock. Do not retry and do not work around it (no shell, other tools, copies or renames). '
    + 'Show the developer this warning and wait. Continue only after the developer has unlocked it.';

// ---- hook mode -------------------------------------------------------------

function guard(client) {
    let input = {};
    try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* no input: nothing to check */ }

    const toolName = input.tool_name ?? (client === 'cursor-shell' ? 'Shell' : '');
    const toolInput = client === 'cursor-shell' ? { command: input.command } : (input.tool_input ?? {});
    const hits = violations(toolName, toolInput);
    if (!hits.length || unlocked()) {
        if (client.startsWith('cursor')) process.stdout.write('{}');
        return 0;
    }

    const msg = warning(hits);
    switch (client) {
        case 'claude':   // native prompt: the developer accepts or rejects the warning
            process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: msg } }));
            return 0;
        case 'cursor-shell':
            process.stdout.write(JSON.stringify({ permission: 'ask', user_message: msg, agent_message: `${msg}\n\n${AGENT_NOTE}` }));
            return 0;
        case 'cursor':
            process.stdout.write(JSON.stringify({ permission: 'deny', user_message: msg, agent_message: `${msg}\n\n${AGENT_NOTE}` }));
            return 0;
        default:          // codex and anything else: exit 2 blocks, stderr is the reason
            process.stderr.write(`${msg}\n\n${AGENT_NOTE}\n`);
            return 2;
    }
}

// ---- developer commands ----------------------------------------------------

async function unlock() {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        console.error('Unlock must be run by the developer in their own interactive terminal, not by an AI agent or a script.');
        return 1;
    }
    console.log(`\n${warning(LOCKED, true)}\n`);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(res => rl.question(`Type "${PHRASE}" to accept the warning and unlock for ${CONFIG.unlockMinutes} minutes: `, res));
    rl.close();
    if (answer.trim() !== PHRASE) {
        console.log('Not unlocked. Everything stays locked.');
        return 1;
    }
    const until = new Date(Date.now() + CONFIG.unlockMinutes * 60_000);
    fs.writeFileSync(UNLOCK_FILE, JSON.stringify({ by: os.userInfo().username, at: new Date().toISOString(), until: until.toISOString() }, null, 2));
    console.log(`Unlocked until ${until.toLocaleTimeString()}. When done: ${SCRIPT} lock`);
    return 0;
}

function lock() {
    fs.rmSync(UNLOCK_FILE, { force: true });
    console.log('Locked again (splash screen, core UI layout).');
    return 0;
}

function status() {
    const u = unlocked();
    console.log(u ? `UNLOCKED by ${u.by} until ${new Date(u.until).toLocaleTimeString()}` : 'LOCKED');
    for (const g of CONFIG.groups) {
        console.log(`\nLocked: ${g.name} (${g.what})`);
        g.paths.forEach(p => console.log(`  ${p}`));
    }
    console.log('Lock files (also locked):');
    CONFIG.lockInfrastructure.forEach(p => console.log(`  ${p}`));
    return 0;
}

// ---- main ------------------------------------------------------------------

const [cmd, arg] = process.argv.slice(2);
let code = 0;
try {
    switch (cmd) {
        case 'guard': code = guard(arg ?? 'codex'); break;
        case 'unlock': code = await unlock(); break;
        case 'lock': code = lock(); break;
        case 'status': code = status(); break;
        default:
            console.log(`Usage: ${SCRIPT} status | unlock | lock`);
    }
} catch (e) {
    // A broken guard must never stop all agent work: report and allow.
    console.error(`[splash-lock] ${cmd} failed: ${e.message}`);
    code = 0;
}
process.exit(code);
