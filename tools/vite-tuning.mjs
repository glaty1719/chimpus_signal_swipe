import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_TOP = new Set(['settings', 'theme', 'layout']);
const MAX_BYTES = 100 * 1024;
const CONFIG_FILE = 'src/game/game.config.ts';
const LOOK_KEYS = new Set(['typography', 'buttonStyle']);

/**
 * Dev-server only. Lets the debug panel write tuning.json into the game folder, and update the
 * typography / buttonStyle lines in src/game/game.config.ts.
 *  - exists only under `vite` (dev), never in a production build
 *  - writes exactly one fixed file; the browser cannot choose the path
 *  - requires a custom header, so a random web page cannot trigger it cross-origin
 */
export function studioTuning({ file = 'tuning.json' } = {}) {
    // Files this plugin just wrote: their change must not reload the page (the debug panel already shows the
    // values, and a reload would throw away the changes the developer chose not to save yet)
    const selfWrites = new Map();
    const markWrite = f => selfWrites.set(path.normalize(f), Date.now());

    return {
        name: 'studio-tuning',
        apply: 'serve',
        handleHotUpdate(ctx) {
            const key = path.normalize(ctx.file);
            const at = selfWrites.get(key);
            if (at !== undefined && Date.now() - at < 3000) {
                selfWrites.delete(key);
                return [];   // handled: no reload
            }
        },
        configureServer(server) {
            const target = path.resolve(server.config.root, file);

            server.middlewares.use('/__studio/tuning', (req, res) => {
                const send = (code, body) => {
                    res.statusCode = code;
                    res.setHeader('content-type', 'application/json');
                    res.end(JSON.stringify(body));
                };
                if (req.method !== 'POST') return send(405, { ok: false, error: 'POST only' });
                if (req.headers['x-studio-tuning'] !== '1') return send(403, { ok: false, error: 'missing header' });

                let raw = '';
                req.on('data', chunk => {
                    raw += chunk;
                    if (raw.length > MAX_BYTES) { req.destroy(); }
                });
                req.on('end', () => {
                    try {
                        const json = JSON.parse(raw);
                        if (typeof json !== 'object' || json === null || Array.isArray(json)) throw new Error('expected an object');
                        for (const key of Object.keys(json)) {
                            if (!ALLOWED_TOP.has(key)) throw new Error(`unexpected key "${key}"`);
                        }
                        markWrite(target);
                        fs.writeFileSync(target, JSON.stringify(json, null, 4) + '\n');
                        console.log(`[studio-tuning] wrote ${target}`);
                        send(200, { ok: true, file });
                    } catch (e) {
                        send(400, { ok: false, error: String(e.message ?? e) });
                    }
                });
            });

            // The debug panel's "Look" choices live in game.config.ts. This rewrites only the
            // `typography: '...'` and `buttonStyle: '...'` lines there (same protections as above).
            const configFile = path.resolve(server.config.root, CONFIG_FILE);
            server.middlewares.use('/__studio/config-look', (req, res) => {
                const send = (code, body) => {
                    res.statusCode = code;
                    res.setHeader('content-type', 'application/json');
                    res.end(JSON.stringify(body));
                };
                if (req.method !== 'POST') return send(405, { ok: false, error: 'POST only' });
                if (req.headers['x-studio-tuning'] !== '1') return send(403, { ok: false, error: 'missing header' });

                let raw = '';
                req.on('data', chunk => {
                    raw += chunk;
                    if (raw.length > 1024) { req.destroy(); }
                });
                req.on('end', () => {
                    try {
                        const json = JSON.parse(raw);
                        if (typeof json !== 'object' || json === null || Array.isArray(json)) throw new Error('expected an object');
                        let text = fs.readFileSync(configFile, 'utf8');
                        for (const [key, value] of Object.entries(json)) {
                            if (!LOOK_KEYS.has(key)) throw new Error(`unexpected key "${key}"`);
                            if (typeof value !== 'string' || !/^[A-Za-z0-9_]{1,40}$/.test(value)) throw new Error(`invalid value for ${key}`);
                            const line = new RegExp(`^([ \\t]*)${key}:[ \\t]*'[^'\\n]*',?[ \\t]*$`, 'gm');
                            const found = text.match(line)?.length ?? 0;
                            if (found !== 1) throw new Error(`expected one "${key}: '...'," line in ${CONFIG_FILE}, found ${found}`);
                            text = text.replace(line, (_m, indent) => `${indent}${key}: '${value}',`);
                        }
                        markWrite(configFile);
                        fs.writeFileSync(configFile, text);
                        console.log(`[studio-tuning] updated ${Object.keys(json).join(', ')} in ${configFile}`);
                        send(200, { ok: true, file: CONFIG_FILE });
                    } catch (e) {
                        send(400, { ok: false, error: String(e.message ?? e) });
                    }
                });
            });
        }
    };
}
