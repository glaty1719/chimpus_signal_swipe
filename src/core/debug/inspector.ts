import type Phaser from 'phaser';
import type GUI from 'lil-gui';
import { walkScene, recordOffset, findUnnamed } from '../layout/offsets';
import { isLockedObject } from '../layout/locked';
import { showToast } from './toast';
import { runtime } from '../runtime';
import type { TextRole } from '../typography';

type Obj = Phaser.GameObjects.GameObject & Record<string, any>;
interface Rect { x: number; y: number; w: number; h: number }

/**
 * Select-widget mode (like Flutter DevTools): hover to highlight, click to select,
 * drag or use arrow keys to move, edit values in the panel.
 *
 * Drawn as DOM boxes over the canvas, so it survives scene restarts and never
 * interferes with Phaser's own input. While active, a transparent layer catches the pointer.
 */
/** Moves a text style's controls into `host`; returns a function that puts them back. */
export type BorrowTextStyle = (role: TextRole, host: HTMLElement) => () => void;

export function createInspector(
    game: Phaser.Game, gui: GUI, onChange: () => void, borrowTextStyle?: BorrowTextStyle, onSelect?: () => void
) {
    const canvas = game.canvas;

    // ---- DOM overlay -------------------------------------------------------
    const layer = document.createElement('div');
    layer.style.cssText = 'position:fixed;z-index:9990;display:none;cursor:crosshair;touch-action:none;';
    const hoverBox = document.createElement('div');
    hoverBox.style.cssText = 'position:absolute;border:2px solid #38bdf8;background:rgba(56,189,248,.15);pointer-events:none;display:none;';
    const selBox = document.createElement('div');
    selBox.style.cssText = 'position:absolute;border:2px solid #f43f5e;background:rgba(244,63,94,.12);pointer-events:none;display:none;';
    const tag = document.createElement('div');
    tag.style.cssText = 'position:absolute;background:#0f172a;color:#e2e8f0;font:12px/1.3 monospace;padding:3px 6px;border-radius:4px;pointer-events:none;display:none;white-space:nowrap;';
    layer.append(hoverBox, selBox, tag);
    document.body.appendChild(layer);

    // ---- geometry ----------------------------------------------------------
    const gameW = () => game.scale.width;
    const gameH = () => game.scale.height;
    const toGame = (cx: number, cy: number) => {
        const r = canvas.getBoundingClientRect();
        return { x: (cx - r.left) * (gameW() / r.width), y: (cy - r.top) * (gameH() / r.height) };
    };
    const scaleFactor = () => canvas.getBoundingClientRect().width / gameW();

    /** Bounds in game coordinates. Graphics have none; sized containers use their size. */
    function boundsOf(o: Obj): Rect | null {
        if (!o.visible && o.visible !== undefined) return null;
        if (typeof o.getWorldTransformMatrix !== 'function') return null;
        const m = o.getWorldTransformMatrix();
        if (o.type === 'Container' && o.width > 0 && o.height > 0) {
            const sx = Math.abs(m.scaleX), sy = Math.abs(m.scaleY);
            return { x: m.tx - (o.width * sx) / 2, y: m.ty - (o.height * sy) / 2, w: o.width * sx, h: o.height * sy };
        }
        if (typeof o.getBounds === 'function') {
            const b = o.getBounds();
            if (b.width > 0 && b.height > 0) return { x: b.x, y: b.y, w: b.width, h: b.height };
        }
        return null;
    }

    /** All objects under a point, topmost first. */
    function hitsAt(gx: number, gy: number): Obj[] {
        const hits: Obj[] = [];
        for (const scene of game.scene.getScenes(true)) {
            walkScene(scene, o => {
                const b = boundsOf(o as Obj);
                if (b && gx >= b.x && gx <= b.x + b.w && gy >= b.y && gy <= b.y + b.h) hits.push(o as Obj);
            });
        }
        return hits.reverse();   // later in the display list = drawn on top
    }

    /**
     * A click on a button's label should select the whole button: walk up to the OUTERMOST
     * named parent. Alt-click still drills into parts (playButton.label, card.emoji...).
     */
    function resolve(hit: Obj | undefined): Obj | null {
        if (!hit) return null;
        let best: Obj | null = null;
        for (let o: Obj | null = hit; o; o = (o.parentContainer as Obj) ?? null) {
            if (o.name) best = o;
        }
        return best ?? hit;
    }

    const label = (o: Obj) => {
        const b = boundsOf(o);
        const extra = o.type === 'Text' ? ` "${String(o.text).slice(0, 18)}"` : o.texture?.key ? ` [${o.texture.key}]` : '';
        const size = b ? ` ${Math.round(b.w)}×${Math.round(b.h)}` : '';
        return `${o.type}${o.name ? ` · ${o.name}` : ' · (unnamed)'}${extra}${size}`;
    };

    // ---- state -------------------------------------------------------------
    let active = false;
    let hover: Obj | null = null;
    let selected: Obj | null = null;
    let selFolder: GUI | null = null;
    let drag: { startX: number; startY: number; ox: number; oy: number } | null = null;

    function place(box: HTMLElement, b: Rect | null) {
        if (!b) { box.style.display = 'none'; return; }
        const f = scaleFactor();
        box.style.display = 'block';
        box.style.left = `${b.x * f}px`; box.style.top = `${b.y * f}px`;
        box.style.width = `${b.w * f}px`; box.style.height = `${b.h * f}px`;
    }

    function syncLayer() {
        const r = canvas.getBoundingClientRect();
        Object.assign(layer.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    }

    function frame() {
        if (!active) return;
        syncLayer();
        // A debug edit restarts the scene: keep the selection by finding the new object with the same name
        if (selected && !selected.scene) {
            const again = findSelectedAgain();
            if (again) select(again, true);
            else if (++missingFrames > 30) select(null);
        }
        if (hover && !hover.scene) hover = null;
        place(hoverBox, hover && hover !== selected ? boundsOf(hover) : null);
        const sb = selected ? boundsOf(selected) : null;
        place(selBox, sb);
        if (hover || selected) {
            const t = hover && hover !== selected ? hover : selected;
            const tb = t ? boundsOf(t) : null;
            if (t && tb) {
                const f = scaleFactor();
                tag.style.display = 'block';
                tag.textContent = label(t);
                tag.style.left = `${tb.x * f}px`;
                tag.style.top = `${Math.max(0, tb.y * f - 24)}px`;
            } else tag.style.display = 'none';
        } else tag.style.display = 'none';
        requestAnimationFrame(frame);
    }

    // ---- clipboard ---------------------------------------------------------
    const autoCopy = { on: true };


    async function copyText(text: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Clipboard API blocked (insecure origin / permissions): classic fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0;';
            document.body.appendChild(ta);
            ta.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch { /* ignore */ }
            ta.remove();
            return ok;
        }
    }

    /** One line you can paste to an AI: which game, which scene, which element, where it is. */
    function reference(o: Obj): string {
        const id = runtime.config.id;
        const b = boundsOf(o);
        const size = b ? `${Math.round(b.w)}×${Math.round(b.h)}` : 'no bounds';
        return `${id} · scene ${o.scene?.scene.key} · ${o.name || '(unnamed)'} (${o.type}, ${size}, at ${Math.round(o.x)},${Math.round(o.y)})`;
    }

    async function copyName(o: Obj) {
        if (!o.name) { showToast('Unnamed element: add .setName() in code first', true); return; }
        const ok = await copyText(o.name);
        showToast(ok ? `Copied: ${o.name}` : `Could not copy. Name: ${o.name}`, !ok);
    }

    // ---- selection panel ---------------------------------------------------
    let releaseStyles: (() => void)[] = [];
    /** Name and scene of the selection, to find it again after a scene restart. */
    let selectedRef: { name: string; scene: string } | null = null;
    let missingFrames = 0;

    function findSelectedAgain(): Obj | null {
        if (!selectedRef?.name) return null;
        const scene = game.scene.getScenes(true).find(sc => sc.scene.key === selectedRef!.scene);
        let found: Obj | null = null;
        if (scene) walkScene(scene, o => { if (!found && o.name === selectedRef!.name) found = o as Obj; });
        return found;
    }

    function select(o: Obj | null, reacquired = false) {
        selected = o;
        missingFrames = 0;
        selectedRef = o?.name && o.scene ? { name: o.name, scene: o.scene.scene.key } : null;
        // Give the borrowed style controls back before the Selected folder (their current parent) is destroyed
        releaseStyles.forEach(release => release());
        releaseStyles = [];
        selFolder?.destroy();
        selFolder = null;
        if (!o) return;
        if (autoCopy.on && !reacquired) void copyName(o);   // a click is a user gesture, so the clipboard allows it
        if (!reacquired) onSelect?.();

        const f = gui.addFolder('Selected');
        selFolder = f;
        inspectFolder.domElement.after(f.domElement);   // keep it right under the Inspect toggle
        const named = !!o.name;
        const locked = isLockedObject(o.name);
        const info = {
            type: o.type,
            name: o.name || '(unnamed)',
            detail: o.type === 'Text' ? String(o.text) : (o.texture?.key ?? ''),
            savable: locked ? '🔒 locked by core: position, size and depth are fixed' : named ? 'yes, saved as layout offset' : 'no: call setName() to save'
        };
        f.add(info, 'type').disable();
        f.add(info, 'name').disable();
        if (info.detail) f.add(info, 'detail').disable();
        f.add(info, 'savable').disable();

        // Text (or a button with a label): show which text style it uses. Styles are edited in Theme → text styles.
        const roles = textStylesOf(o);
        if (roles.length) {
            f.add({ textStyle: roles.map(r => r.label).join(', ') }, 'textStyle').name(roles.length > 1 ? 'text styles' : 'text style').disable();
            if (borrowTextStyle) {
                for (const role of [...new Set(roles.map(r => r.role))]) releaseStyles.push(borrowTextStyle(role, f.$children));
            }
        }

        const changed = () => { recordOffset(o); onChange(); };
        const lock = <T extends { disable(): T }>(c: T) => (locked ? c.disable() : c);
        if ('x' in o) { lock(f.add(o, 'x').step(1).listen().onChange(changed)); lock(f.add(o, 'y').step(1).listen().onChange(changed)); }
        if ('alpha' in o) f.add(o, 'alpha', 0, 1, 0.05).listen();
        if ('scaleX' in o) { lock(f.add(o, 'scaleX', 0.1, 4, 0.05).listen()); lock(f.add(o, 'scaleY', 0.1, 4, 0.05).listen()); }
        if ('angle' in o) lock(f.add(o, 'angle', -180, 180, 1).listen());
        // Depth (z-index) comes from UILayers in code; it is never edited here
        if ('depth' in o) f.add(o, 'depth').listen().disable();
        if ('visible' in o) f.add(o, 'visible').listen();
        f.add({ copyName: () => void copyName(o) }, 'copyName').name('Copy name');
        f.add({
            copyRef: async () => {
                const ok = await copyText(reference(o));
                showToast(ok ? `Copied reference:\n${reference(o)}` : 'Could not copy', !ok);
            }
        }, 'copyRef').name('Copy reference for AI');
        f.add({ clear: () => select(null) }, 'clear').name('Deselect (Esc)');
    }

    /** The text style of a text, or the styles of all texts inside a container (a button, a level card...). */
    function textStylesOf(o: any): { role: TextRole; label: string }[] {
        const own = o?.getData?.('textStyle') as TextRole | undefined;
        if (own) return [{ role: own, label: own }];
        if (o?.type !== 'Container') return [];
        const out: { role: TextRole; label: string }[] = [];
        const stack: any[] = [...(o.list ?? [])];
        while (stack.length) {
            const c = stack.shift();
            const r = c?.getData?.('textStyle') as TextRole | undefined;
            if (r) out.push({ role: r, label: `${r} ("${String(c.text).slice(0, 16)}")` });
            if (c?.type === 'Container') stack.push(...(c.list ?? []));
        }
        return out;
    }

    // ---- pointer -----------------------------------------------------------
    layer.addEventListener('pointermove', e => {
        const p = toGame(e.clientX, e.clientY);
        if (drag && selected) {
            selected.x = drag.ox + (p.x - drag.startX);
            selected.y = drag.oy + (p.y - drag.startY);
            recordOffset(selected);
            onChange();
            return;
        }
        hover = resolve(hitsAt(p.x, p.y)[0]);
    });
    layer.addEventListener('pointerdown', e => {
        const p = toGame(e.clientX, e.clientY);
        const hits = hitsAt(p.x, p.y);
        if (e.altKey && hits.length) {
            // Alt-click drills through every raw object under the pointer, children included
            const i = selected ? hits.indexOf(selected) : -1;
            select(hits[(i + 1) % hits.length]);
        } else {
            select(resolve(hits[0]));
        }
        if (selected && 'x' in selected && !isLockedObject(selected.name)) {
            drag = { startX: p.x, startY: p.y, ox: selected.x, oy: selected.y };
            layer.setPointerCapture(e.pointerId);
        }
        e.preventDefault();
    });
    const endDrag = () => { drag = null; };
    layer.addEventListener('pointerup', endDrag);
    layer.addEventListener('pointercancel', endDrag);
    layer.addEventListener('pointerleave', () => { if (!drag) hover = null; });

    // ---- keyboard ----------------------------------------------------------
    window.addEventListener('keydown', e => {
        const typing = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA';
        if (typing) return;
        if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey) { setActive(!active); return; }
        if (!active) return;
        if (e.key === 'Escape') { select(null); return; }
        if (selected && 'x' in selected && !isLockedObject(selected.name) && e.key.startsWith('Arrow')) {
            const step = e.shiftKey ? 10 : 1;
            if (e.key === 'ArrowLeft') selected.x -= step;
            if (e.key === 'ArrowRight') selected.x += step;
            if (e.key === 'ArrowUp') selected.y -= step;
            if (e.key === 'ArrowDown') selected.y += step;
            recordOffset(selected);
            onChange();
            e.preventDefault();
        }
    });

    function setActive(on: boolean) {
        if (on === active) return;
        active = on;
        layer.style.display = on ? 'block' : 'none';
        if (!on) { hover = null; drag = null; select(null); hoverBox.style.display = selBox.style.display = tag.style.display = 'none'; }
        else { syncLayer(); requestAnimationFrame(frame); }
        toggleState.inspect = on;
        toggleController?.updateDisplay();
    }

    // ---- panel toggle ------------------------------------------------------
    const toggleState = { inspect: false };
    const inspectFolder = gui.addFolder('Inspect');
    const toggleController = inspectFolder.add(toggleState, 'inspect').name('Select elements (I)').onChange((v: boolean) => setActive(v));
    inspectFolder.add(autoCopy, 'on').name('auto-copy name');
    inspectFolder.add({ hint: 'drag · arrows · Esc' }, 'hint').name('keys').disable();

    // ---- naming audit: every object must have a name ------------------------
    const naming = { unnamed: '…', highlight: false };
    inspectFolder.add(naming, 'unnamed').name('unnamed objects').listen().disable();
    inspectFolder.add(naming, 'highlight').name('highlight unnamed');

    const warnLayer = document.createElement('div');
    warnLayer.style.cssText = 'position:fixed;z-index:9989;pointer-events:none;display:none;';
    document.body.appendChild(warnLayer);

    function refreshNaming() {
        const list = findUnnamed(game);
        naming.unnamed = list.length ? `⚠ ${list.length} (call setName)` : '✓ all named';

        if (!naming.highlight) { warnLayer.style.display = 'none'; return; }
        const r = canvas.getBoundingClientRect();
        Object.assign(warnLayer.style, { display: 'block', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
        warnLayer.replaceChildren();
        const f = scaleFactor();
        for (const o of list) {
            const b = boundsOf(o);
            if (!b) continue;
            const box = document.createElement('div');
            box.style.cssText = `position:absolute;border:2px dashed #f59e0b;background:rgba(245,158,11,.15);left:${b.x * f}px;top:${b.y * f}px;width:${b.w * f}px;height:${b.h * f}px;`;
            warnLayer.appendChild(box);
        }
    }
    setInterval(refreshNaming, 400);

    return { setActive, folder: inspectFolder };
}
