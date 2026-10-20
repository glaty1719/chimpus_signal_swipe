import GUI from 'lil-gui';
import { DEFAULT_TYPOGRAPHY, TYPOGRAPHY_PRESETS, type TextRole, type TypographyId } from '../typography';
import { BUTTON_STYLE_IDS, DEFAULT_BUTTON_STYLE, type ButtonStyleId } from '../ui/buttonStyles';
import type Phaser from 'phaser';
import { runtime } from '../runtime';
import { applyThemeTuning, defineTheme, type Theme } from '../theme';
import { resolveSettings, type SettingsValues, type Tuning } from '../settings';
import { GameEvents, SceneKeys } from '../events';
import { layoutStore } from '../layout/offsets';
import { GameDataManager } from '../services/GameDataManager';
import { createInspector, type BorrowTextStyle } from './inspector';
import { restyleTexts } from '../ui/text';
import { addTabs } from './tabs';
import { createSaveBar } from './saveBar';
import { createChangeMarks } from './changes';
import { rememberFolders } from './remember';
import { showToast } from './toast';
import { describeKey, openSaveDialog, type PendingChange } from './saveDialog';
import { storage } from '../services/storage';

const toHex = (n: number) => '#' + n.toString(16).padStart(6, '0');
const fromHex = (s: string) => parseInt(s.replace('#', ''), 16);

type Flat = Record<string, string | number | boolean>;

/** Every tunable value as flat "path -> value" pairs, so we can diff and build tuning.json. */
function snapshot(theme: Theme, settings: SettingsValues): Flat {
    const f: Flat = {};
    for (const [k, v] of Object.entries(settings)) f[`settings.${k}`] = v;
    for (const [k, v] of Object.entries(theme.fonts)) f[`theme.fonts.${k}`] = v;
    for (const [k, v] of Object.entries(theme.colors)) f[`theme.colors.${k}`] = v;
    for (const [role, s] of Object.entries(theme.typography)) {
        const p = `theme.typography.${role}`;
        f[`${p}.size`] = s.size;
        f[`${p}.weight`] = s.weight;
        f[`${p}.color`] = s.color;
        f[`${p}.stroke`] = s.stroke;
        f[`${p}.strokeThickness`] = s.strokeThickness;
        f[`${p}.letterSpacing`] = s.letterSpacing ?? 0;
        f[`${p}.shadow`] = !!s.shadow;
        if (s.shadow) f[`${p}.shadowColor`] = s.shadow.color;
    }
    // Layout offsets: only non-zero ones exist. '|' keeps names that contain dots safe.
    for (const [name, o] of Object.entries(layoutStore)) {
        if (o.dx) f[`layout|${name}|dx`] = o.dx;
        if (o.dy) f[`layout|${name}|dy`] = o.dy;
    }
    return f;
}

/** Only the values that differ from the code defaults, as nested tuning.json content. */
function buildTuning(defaults: Flat, current: Flat): Tuning {
    const out: any = {};
    for (const [path, value] of Object.entries(current)) {
        if (value === defaults[path]) continue;
        const parts = path.startsWith('layout|') ? path.split('|') : path.split('.');
        let node = out;
        for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]] ??= {};
        node[parts[parts.length - 1]] = value;
    }
    return out as Tuning;
}

const isColorKey = (key: string) => key.startsWith('theme.colors.') || /\.(color|stroke|shadowColor)$/.test(key);
const show = (v: string | number | boolean | undefined, key = '') =>
    v === undefined ? 'default' : typeof v === 'number' && isColorKey(key) ? toHex(v) : String(v);

/**
 * Debug panel. Loaded on demand (dynamic import) so players never download it.
 * Edits are a LIVE PREVIEW only. Nothing is stored until you press Save and confirm.
 */
export function openDebugPanel(game: Phaser.Game) {
    const { config, theme, settings } = runtime;
    const gui = new GUI({ title: `Debug · ${config.title}`, width: 280 });
    gui.domElement.style.zIndex = '9999';

    // What the code says (no tuning), and what was loaded when the panel opened
    // What the code says (no tuning) for the current typography set; changes when Look → typography changes
    let defaults = snapshot(defineTheme(config.theme, config.typography), resolveSettings(config.settings));
    let baseline = snapshot(theme, settings);
    let saveBar: ReturnType<typeof createSaveBar> | null = null;
    const marks = createChangeMarks();
    const hexOf = (key: string) => () => toHex((defaults[key] ?? 0) as number);
    const valueOf = (key: string) => () => defaults[key];

    const sessionChanges = () => {
        const now = snapshot(theme, settings);
        const keys = new Set([...Object.keys(now), ...Object.keys(baseline)]);   // a value reset to default disappears from `now`
        return [...keys].filter(k => now[k] !== baseline[k]).map(k => ({ key: k, from: baseline[k], to: now[k] }));
    };
    const refreshStatus = () => {
        const n = sessionChanges().length + lookChanges().length;
        saveBar?.update(n);
        const now = snapshot(theme, settings);
        marks.refresh(key => {
            if (key.startsWith('look.')) { const k = key.slice(5) as keyof typeof look; return look[k] !== fileLook[k] ? 'unsaved' : 'default'; }
            return now[key] !== baseline[key] ? 'unsaved' : now[key] !== defaults[key] ? 'custom' : 'default';
        });
    };

    /** Rebuild the current screen so edits show. The Game scene restarts through its own flow (UIScene included). */
    const restartScene = () => {
        for (const s of game.scene.getScenes(true)) {
            const key = s.scene.key;
            if (key === SceneKeys.UI || key === SceneKeys.GlobalUI) continue;
            if (key === SceneKeys.Game) s.events.emit(GameEvents.RESTART);
            else s.scene.restart();
        }
    };
    const preview = () => { refreshStatus(); restartScene(); };
    /** Text styles and fonts restyle the texts on screen in place, in real time (no screen restart). */
    const liveText = () => { restyleTexts(game); refreshStatus(); };

    // --- Look: try typography sets and button styles in the real game. These choices live in game.config.ts,
    // so Save writes them there (never to tuning.json: one place decides).
    const look = { typography: config.typography ?? DEFAULT_TYPOGRAPHY, buttonStyle: config.buttonStyle ?? DEFAULT_BUTTON_STYLE };
    const fileLook = { ...look };   // what game.config.ts says
    function lookChanges() {
        return (Object.keys(look) as (keyof typeof look)[])
            .filter(k => look[k] !== fileLook[k])
            .map(k => ({ key: k, from: fileLook[k], to: look[k] }));
    }
    const lookFolder = gui.addFolder('Look');
    const typoCtrl = lookFolder.add(look, 'typography', Object.keys(TYPOGRAPHY_PRESETS)).name('typography').onChange((id: TypographyId) => {
        // Swap the styles in place (the size controls stay bound to them), keep the saved size tweaks,
        // and do not count the new set's sizes as unsaved changes
        defaults = snapshot(defineTheme(config.theme, id), resolveSettings(config.settings));
        const fresh = defineTheme(config.theme, id).typography;
        for (const role of Object.keys(fresh) as TextRole[]) {
            Object.assign(theme.typography[role], fresh[role]);
            if (!fresh[role].shadow) delete theme.typography[role].shadow;
        }
        applyThemeTuning(theme, { text: config.tuning?.theme?.text, typography: config.tuning?.theme?.typography });
        const now = snapshot(theme, settings);
        for (const k of Object.keys(baseline)) if (k.startsWith('theme.typography.')) delete baseline[k];
        for (const k of Object.keys(now)) if (k.startsWith('theme.typography.')) baseline[k] = now[k];
        syncStyleControls();
        liveText();
    });
    const styleCtrl = lookFolder.add(look, 'buttonStyle', BUTTON_STYLE_IDS).name('button style').onChange((id: ButtonStyleId) => {
        config.buttonStyle = id;   // read when buttons are created, so the restart shows it
        refreshStatus();
        restartScene();
    });
    marks.track(typoCtrl, 'look.typography', () => fileLook.typography);
    marks.track(styleCtrl, 'look.buttonStyle', () => fileLook.buttonStyle);
    lookFolder.add({
        copy: () => {
            const lines = `    typography: '${look.typography}',\n    buttonStyle: '${look.buttonStyle}',`;
            console.log(`[debug] Paste into src/game/game.config.ts:\n${lines}`);
            navigator.clipboard?.writeText(lines)
                .then(() => showToast('Copied: paste into src/game/game.config.ts'))
                .catch(() => showToast('Could not copy: the lines are in the console', true, 3500));
        }
    }, 'copy').name('📋 Copy config lines');

    // --- Theme ---
    const t = gui.addFolder('Fonts & colors');
    const fonts = t.addFolder('fonts');
    for (const key of Object.keys(theme.fonts) as (keyof Theme['fonts'])[]) {
        marks.track(fonts.add(theme.fonts, key).onFinishChange(liveText), `theme.fonts.${key}`, valueOf(`theme.fonts.${key}`), true);
    }
    const colors = t.addFolder('colors');
    for (const key of Object.keys(theme.colors) as (keyof Theme['colors'])[]) {
        const proxy = { [key]: toHex(theme.colors[key]) };
        marks.track(colors.addColor(proxy, key).onFinishChange((v: string) => { theme.colors[key] = fromHex(v); preview(); }),
            `theme.colors.${key}`, hexOf(`theme.colors.${key}`), true);
    }
    // Text styles: every text using a style changes at once (core screens and the game's own addText calls)
    const styles = gui.addFolder('Text styles');
    const roleFolders = {} as Record<TextRole, GUI>;
    const styleProxies: { role: TextRole; proxy: { color: string; stroke: string; shadow: boolean; shadowColor: string } }[] = [];
    for (const role of Object.keys(theme.typography) as TextRole[]) {
        const s = theme.typography[role];
        s.letterSpacing ??= 0;
        const proxy = { color: toHex(s.color), stroke: toHex(s.stroke), shadow: !!s.shadow, shadowColor: toHex(s.shadow?.color ?? 0x000000) };
        styleProxies.push({ role, proxy });
        const rf = styles.addFolder(role);
        roleFolders[role] = rf;
        const p = `theme.typography.${role}`;
        marks.track(rf.add(s, 'size', 12, 160, 1).onChange(liveText), `${p}.size`, valueOf(`${p}.size`));
        marks.track(rf.add(s, 'weight', [300, 400, 500, 600, 700]).name('boldness').onChange(liveText), `${p}.weight`, valueOf(`${p}.weight`));
        marks.track(rf.addColor(proxy, 'color').name('text color').onChange((v: string) => { s.color = fromHex(v); liveText(); }), `${p}.color`, hexOf(`${p}.color`));
        marks.track(rf.addColor(proxy, 'stroke').name('outline color').onChange((v: string) => { s.stroke = fromHex(v); liveText(); }), `${p}.stroke`, hexOf(`${p}.stroke`));
        marks.track(rf.add(s, 'strokeThickness', 0, 24, 1).name('outline thickness').onChange(liveText), `${p}.strokeThickness`, valueOf(`${p}.strokeThickness`));
        marks.track(rf.add(s, 'letterSpacing', 0, 12, 0.5).name('letter spacing').onChange(liveText), `${p}.letterSpacing`, valueOf(`${p}.letterSpacing`));
        marks.track(rf.add(proxy, 'shadow').onChange((on: boolean) => {
            // Switching back on restores the set's own shadow (position and color) when it has one
            const setShadow = defineTheme(config.theme, look.typography).typography[role].shadow;
            if (on) s.shadow ??= setShadow ? { ...setShadow } : { x: 0, y: Math.max(2, Math.round(s.size * 0.08)), color: fromHex(proxy.shadowColor) };
            else delete s.shadow;
            proxy.shadowColor = toHex(s.shadow?.color ?? fromHex(proxy.shadowColor));
            liveText();
        }), `${p}.shadow`, () => !!defaults[`${p}.shadow`]);
        marks.track(rf.addColor(proxy, 'shadowColor').name('shadow color').onChange((v: string) => { if (s.shadow) s.shadow.color = fromHex(v); liveText(); }),
            `${p}.shadowColor`, hexOf(`${p}.shadowColor`));
        rf.close();
    }
    /** After the typography set changes, show its values in the controls. */
    function syncStyleControls() {
        for (const { role, proxy } of styleProxies) {
            const s = theme.typography[role];
            s.letterSpacing ??= 0;
            Object.assign(proxy, { color: toHex(s.color), stroke: toHex(s.stroke), shadow: !!s.shadow, shadowColor: toHex(s.shadow?.color ?? 0x000000) });
        }
        styles.controllersRecursive().forEach(c => c.updateDisplay());
    }
    /**
     * Inspector: while a text (or a button with a label) is selected, its style's controls sit inside the
     * Selected section. They are the same controls, so edits and Save work as usual. On deselect they go back.
     */
    const borrowTextStyle: BorrowTextStyle = (role, host) => {
        const f = roleFolders[role];
        if (!f) return () => { /* unknown style */ };
        const el = f.domElement, parent = el.parentElement, next = el.nextSibling;
        f.title(`${role} style (changes all ${role} texts)`);
        host.appendChild(el);
        f.open();
        return () => {
            f.title(role);
            if (parent) parent.insertBefore(el, next);
            f.close();
        };
    };

    // --- Save / discard (the only way anything is stored) ---
    // Writing tuning.json exists only under `npm run dev`. On a deployed build (?debug) the panel is preview-only.
    const canSave = import.meta.env.DEV;
    const saveAll = async () => {
        const allChanges = sessionChanges();
        const allLooks = lookChanges();
        if (!allChanges.length && !allLooks.length) return;

        // Review: pick which changes to write. Unticked ones stay unsaved.
        const colorOf = (key: string, v: unknown) => isColorKey(key) && typeof v === 'number' ? v : undefined;
        const pending: PendingChange[] = [
            ...allChanges.map(c => ({
                id: c.key, file: 'tuning.json' as const, label: describeKey(c.key),
                from: show(c.from, c.key), to: show(c.to, c.key),
                colors: isColorKey(c.key) ? { from: colorOf(c.key, c.from), to: colorOf(c.key, c.to) } : undefined
            })),
            ...allLooks.map(c => ({ id: `look.${c.key}`, file: 'game.config.ts' as const, label: `Look · ${c.key}`, from: c.from, to: c.to }))
        ];
        const picked = await openSaveDialog(pending);
        if (!picked?.length) return;
        const chosen = new Set(picked);
        const changes = allChanges.filter(c => chosen.has(c.key));
        const looks = allLooks.filter(c => chosen.has(`look.${c.key}`));
        const saved: string[] = [];

        if (changes.length) {
            // The file gets what was saved before, plus only the picked changes
            const now = snapshot(theme, settings);
            const target: Flat = { ...baseline };
            for (const c of changes) { if (now[c.key] === undefined) delete target[c.key]; else target[c.key] = now[c.key]; }
            const payload = buildTuning(defaults, target);
            try {
                const res = await fetch('/__studio/tuning', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', 'x-studio-tuning': '1' },
                    body: JSON.stringify(payload)
                });
                const body = await res.json().catch(() => ({}));
                if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
                for (const c of changes) { if (now[c.key] === undefined) delete baseline[c.key]; else baseline[c.key] = now[c.key]; }
                refreshStatus();
                saved.push('tuning.json');
                console.log('[debug] saved', body.file);
            } catch (e) {
                const json = JSON.stringify(payload, null, 2);
                console.log('[debug] tuning.json\n' + json);
                navigator.clipboard?.writeText(json).catch(() => { /* console has it */ });
                showToast(`Could not save tuning.json (${(e as Error).message}).\nIts content is on your clipboard: paste it into tuning.json.`, true, 6000);
            }
        }

        if (looks.length) {
            const update = Object.fromEntries(looks.map(c => [c.key, c.to]));
            try {
                const res = await fetch('/__studio/config-look', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', 'x-studio-tuning': '1' },
                    body: JSON.stringify(update)
                });
                const body = await res.json().catch(() => ({}));
                if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
                Object.assign(fileLook, update);
                refreshStatus();
                saved.push('game.config.ts');
                console.log('[debug] updated', Object.keys(update).join(', '), 'in', body.file);
            } catch (e) {
                const lines = looks.map(c => `    ${c.key}: '${c.to}',`).join('\n');
                console.log(`[debug] Paste into src/game/game.config.ts:\n${lines}`);
                navigator.clipboard?.writeText(lines).catch(() => { /* console has it */ });
                showToast(`Could not update game.config.ts (${(e as Error).message}).\nThe lines are on your clipboard: paste them into src/game/game.config.ts.`, true, 6000);
            }
        }
        if (saved.length) showToast(`Saved ✓ ${saved.join(' + ')}`);
    };

    const discardAll = () => {
        if (sessionChanges().length + lookChanges().length === 0 || confirm('Discard all unsaved changes and reload?')) window.location.reload();
    };

    // Sticky header: the Save row (status, Save, Discard) with the tab bar under it, pinned while the panel scrolls
    saveBar = createSaveBar({ canSave, onSave: () => void saveAll(), onDiscard: discardAll });
    gui.$children.prepend(saveBar.header);
    refreshStatus();

    // Select-widget mode: hover/click/drag any element on screen. Edits only preview until Save.
    let tabs: ReturnType<typeof addTabs> | null = null;
    const inspector = createInspector(game, gui, refreshStatus, borrowTextStyle, () => tabs?.show('inspect'));

    // --- Actions ---
    const actions = gui.addFolder('Actions');
    actions.add({ restart: restartScene }, 'restart').name('Restart scene');
    actions.add({
        menu: () => {
            for (const s of game.scene.getScenes(true)) {
                if (s.scene.key === SceneKeys.Game) s.events.emit(GameEvents.QUIT);
                else if (s.scene.key === SceneKeys.LevelSelection) s.scene.start(SceneKeys.MainMenu);
            }
        }
    }, 'menu').name('Go to menu');
    actions.add({ unlock: () => { GameDataManager.getInstance().unlockLevel(config.levelCount); restartScene(); } }, 'unlock').name('Unlock all levels');
    actions.add({ reset: () => { GameDataManager.getInstance().resetProgress(); restartScene(); } }, 'reset').name('Reset progress');
    actions.add({
        copy: () => {
            const json = JSON.stringify(buildTuning(defaults, snapshot(theme, settings)), null, 2);
            console.log('[debug] tuning.json\n' + json);
            navigator.clipboard?.writeText(json).catch(() => { /* console has it */ });
        }
    }, 'copy').name('Copy tuning JSON');

    // --- Info ---
    const info = { fps: '0', scene: '-', size: `${game.scale.width}x${game.scale.height}` };
    const i = gui.addFolder('Info');
    i.add(info, 'fps').listen().disable();
    i.add(info, 'scene').listen().disable();
    i.add(info, 'size').disable();

    // --- Tabs: one section at a time; Save stays on top of every tab ---
    tabs = addTabs(gui, saveBar.header, [
        { id: 'look', label: 'Look', folders: [lookFolder] },
        { id: 'text', label: 'Text', folders: [styles] },
        { id: 'colors', label: 'Colors', folders: [t] },
        { id: 'inspect', label: 'Inspect', folders: [inspector.folder] },
        { id: 'tools', label: 'Tools', folders: [actions, i] }
    ], { always: [saveBar.header], lateTab: 'inspect' });
    rememberFolders(gui);
    setInterval(() => {
        info.fps = game.loop.actualFps.toFixed(0);
        info.scene = game.scene.getScenes(true).map(s => s.scene.key).join(', ');
    }, 500);

    // Backtick shows/hides the panel; remembered across reloads
    let visible = storage.get('debugHidden') !== '1';
    gui.show(visible);
    if (!visible) console.info('[debug] panel hidden: press ` to show it');
    window.addEventListener('keydown', e => {
        if (e.key !== '`') return;
        visible = !visible;
        gui.show(visible);
        storage.set('debugHidden', visible ? '0' : '1');
    });

    window.addEventListener('beforeunload', e => {
        if (sessionChanges().length) { e.preventDefault(); e.returnValue = ''; }
    });
}
