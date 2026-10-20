import Phaser from 'phaser';
import { isLockedObject } from './locked';

/**
 * Layout offsets. Any display object with a name (obj.setName('playButton')) can be
 * moved in the debug inspector and saved to tuning.json as an offset from its coded position:
 *
 *   { "layout": { "playButton": { "dx": 40, "dy": -120 } } }
 *
 * This module is tiny and always active, so saved offsets also apply in the shipped game.
 */
export interface LayoutOffset { dx: number; dy: number }
export type LayoutMap = Record<string, LayoutOffset>;

/** Live offsets by object name. Starts from tuning.json; the inspector edits it in debug mode. */
export const layoutStore: LayoutMap = {};

export function initLayout(initial: LayoutMap = {}) {
    for (const k of Object.keys(layoutStore)) delete layoutStore[k];
    for (const [k, v] of Object.entries(initial)) layoutStore[k] = { dx: v.dx ?? 0, dy: v.dy ?? 0 };
}

type Obj = Phaser.GameObjects.GameObject & { x?: number; y?: number };

/** Visit every object in a scene, including children of containers. Parents come before children. */
export function walkScene(scene: Phaser.Scene, visit: (o: Obj, depth: number) => void) {
    const go = (list: Phaser.GameObjects.GameObject[], depth: number) => {
        for (const o of list) {
            visit(o as Obj, depth);
            const children = (o as Phaser.GameObjects.Container).list;
            if (o.type === 'Container' && Array.isArray(children)) go(children, depth + 1);
        }
    };
    go(scene.children.list, 0);
}

/** Remember each named object's coded position, then apply its saved offset. */
export function applyLayout(scene: Phaser.Scene) {
    walkScene(scene, o => {
        if (!o.name || o.x === undefined) return;
        o.setData('baseX', o.x);
        o.setData('baseY', o.y);
        if (isLockedObject(o.name)) {
            if (layoutStore[o.name]) console.warn(`[layout-lock] "${o.name}" is locked by core: its saved layout offset is ignored. Remove it from tuning.json.`);
            return;
        }
        const off = layoutStore[o.name];
        if (off) { o.x! += off.dx; (o as any).y += off.dy; }
    });
}

/**
 * Where a named object should sit at rest: its coded position plus any saved offset.
 * Use this instead of a hardcoded coordinate when code repositions an object itself
 * (e.g. a card that returns to center), so saved layout offsets are respected.
 */
export function homePosition(o: Obj): { x: number; y: number } {
    const bx = o.getData('baseX') as number | undefined;
    const by = o.getData('baseY') as number | undefined;
    // Called during create(), before the layout pass has run: the object is still at its coded
    // position, and applyLayout() will add the offset right after. Adding it here too would double it.
    if (bx === undefined || by === undefined) return { x: o.x as number, y: (o as any).y as number };
    const off = o.name ? layoutStore[o.name] : undefined;
    return { x: bx + (off?.dx ?? 0), y: by + (off?.dy ?? 0) };
}

// ---- naming audit -----------------------------------------------------------

const describe = (o: any) =>
    o.type === 'Text' ? `Text "${String(o.text).slice(0, 20)}"` : o.texture?.key ? `${o.type} [${o.texture.key}]` : String(o.type);

export interface NameAudit { scene: string; unnamed: string[]; duplicates: string[] }

/** Every object must have a name (setName) so it can be referred to by people and AI. */
export function auditNames(scene: Phaser.Scene): NameAudit {
    const unnamed: string[] = [];
    const counts = new Map<string, number>();
    walkScene(scene, o => {
        if (!o.name) unnamed.push(describe(o));
        else counts.set(o.name, (counts.get(o.name) ?? 0) + 1);
    });
    const duplicates = [...counts].filter(([, n]) => n > 1).map(([name]) => name);
    return { scene: scene.scene.key, unnamed, duplicates };
}

/** Live unnamed objects across the active scenes (the inspector highlights these). */
export function findUnnamed(game: Phaser.Game): Obj[] {
    const out: Obj[] = [];
    for (const scene of game.scene.getScenes(true)) walkScene(scene, o => { if (!o.name) out.push(o); });
    return out;
}

/**
 * Re-apply offsets every time any scene finishes its create(), including restarts.
 * With `audit` (debug mode) it also reports unnamed or duplicate-named objects.
 */
export function hookLayout(game: Phaser.Game, audit = false) {
    game.events.once(Phaser.Core.Events.READY, () => {
        for (const scene of game.scene.scenes) {
            scene.events.on(Phaser.Scenes.Events.CREATE, () => {
                applyLayout(scene);
                if (!audit) return;
                const a = auditNames(scene);
                if (a.unnamed.length) console.warn(`[names] scene "${a.scene}": ${a.unnamed.length} unnamed object(s). Add .setName('...'):\n  - ${a.unnamed.join('\n  - ')}`);
                if (a.duplicates.length) console.warn(`[names] scene "${a.scene}": duplicate names (layout offsets apply to all of them): ${a.duplicates.join(', ')}`);
            });
        }
    });
}

/** Record an object's current position as an offset (used by the inspector while dragging). */
export function recordOffset(o: Obj) {
    if (!o.name || o.x === undefined || isLockedObject(o.name)) return false;
    const bx = o.getData('baseX'), by = o.getData('baseY');
    if (bx === undefined || by === undefined) return false;
    const dx = Math.round(o.x - bx), dy = Math.round((o as any).y - by);
    if (dx === 0 && dy === 0) delete layoutStore[o.name];
    else layoutStore[o.name] = { dx, dy };
    return true;
}
