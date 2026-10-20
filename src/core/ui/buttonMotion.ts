import Phaser from 'phaser';
import { runtime } from '../runtime';
import { BUTTON_STYLES, DEFAULT_BUTTON_STYLE, type ButtonLayers, type ButtonStyle, type ButtonStyleId, type MotionLayer } from './buttonStyles';

type Target = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;

/** One animation layer. `scale` sets both axes. */
class Layer implements MotionLayer {
    scaleX = 1;
    scaleY = 1;
    y = 0;
    angle = 0;
    get scale() { return this.scaleX; }
    set scale(v: number) { this.scaleX = this.scaleY = v; }
}

/** Buttons created in the same frame play their intros one after another. */
const INTRO_STAGGER_MS = 90, INTRO_BASE_MS = 100, INTRO_MAX_STEPS = 8;
const introCounters = new WeakMap<Phaser.Scene, { frame: number; n: number }>();

function nextIntroDelay(scene: Phaser.Scene) {
    const frame = scene.game.loop.frame;
    let c = introCounters.get(scene);
    if (!c || c.frame !== frame) introCounters.set(scene, c = { frame, n: 0 });
    return INTRO_BASE_MS + Math.min(c.n++, INTRO_MAX_STEPS) * INTRO_STAGGER_MS;
}

export function resolveButtonStyle(style?: ButtonStyleId | ButtonStyle): ButtonStyle {
    if (typeof style === 'object') return style;
    const id = style ?? runtime.config?.buttonStyle ?? DEFAULT_BUTTON_STYLE;
    return BUTTON_STYLES[id] ?? BUTTON_STYLES[DEFAULT_BUTTON_STYLE];
}

export interface ButtonMotionOptions {
    /** Style id or object. Default: `config.buttonStyle`, else 'popSparkle'. */
    style?: ButtonStyleId | ButtonStyle;
    /** Play the style's entrance animation. Default true. */
    intro?: boolean;
}

/**
 * Animates `target` with a button style and runs `onClick` (input comes from `hitTarget`).
 * Effects are applied as offsets on top of the target's own position, angle and scale,
 * so code (or the debug inspector) can still move and scale the button.
 * Returns a function that replays the intro.
 */
export function attachButtonMotion(hitTarget: Phaser.GameObjects.GameObject, target: Target, onClick: () => void, opts: ButtonMotionOptions = {}) {
    const scene = target.scene;
    const style = resolveButtonStyle(opts.style);
    const intro = new Layer(), idle = new Layer(), body = new Layer();
    const applied = { sx: 1, sy: 1, y: 0, angle: 0 };
    target.setData('buttonMotion', applied);   // read by layout/locked.ts pinObject

    // The clickable area stays at the button's resting size and place while it squashes, grows or lifts.
    // Otherwise a pointer near the edge falls out mid-press (lost click) and hover flickers on/off.
    const hitArea = (hitTarget.input?.hitArea instanceof Phaser.Geom.Rectangle) ? hitTarget.input.hitArea : null;
    const restArea = hitArea ? Phaser.Geom.Rectangle.Clone(hitArea) : null;
    const restWorldScaleY = (hitTarget as unknown as { getWorldTransformMatrix?(): Phaser.GameObjects.Components.TransformMatrix })
        .getWorldTransformMatrix?.().scaleY || 1;

    const apply = () => {
        if (!target.active) return;
        const sx = Math.max(intro.scaleX * idle.scaleX * body.scaleX, 1e-4);
        const sy = Math.max(intro.scaleY * idle.scaleY * body.scaleY, 1e-4);
        const y = intro.y + idle.y + body.y;
        const angle = intro.angle + idle.angle + body.angle;
        target.setScale(target.scaleX / applied.sx * sx, target.scaleY / applied.sy * sy);
        target.y += y - applied.y;
        target.angle += angle - applied.angle;
        Object.assign(applied, { sx, sy, y, angle });

        if (hitArea && restArea) {
            // Undo hover / press / idle motion only; during the intro the button is simply not fully clickable yet
            const fx = idle.scaleX * body.scaleX, fy = idle.scaleY * body.scaleY;
            const w = restArea.width / fx, h = restArea.height / fy;
            const shift = (idle.y + body.y) / (restWorldScaleY * sy);
            hitArea.setTo(restArea.centerX - w / 2, restArea.centerY - h / 2 - shift, w, h);
        }
    };

    const layers: ButtonLayers = { intro, idle, body };

    scene.events.on(Phaser.Scenes.Events.UPDATE, apply);

    let pressed = false;
    let pending: Phaser.Time.TimerEvent | null = null;
    const fire = () => { pending = null; if (target.active) onClick(); };

    hitTarget.on('pointerover', () => style.over(scene, layers));
    hitTarget.on('pointerout', () => { pressed = false; style.out(scene, layers); });
    hitTarget.on('pointerdown', () => {
        pressed = true;
        style.down(scene, layers);
        if (style.clickOn === 'down') onClick();
    });
    hitTarget.on('pointerup', () => {
        if (!pressed) return;
        pressed = false;
        style.up(scene, layers);
        if (style.clickOn === 'up' && !pending) pending = scene.time.delayedCall(style.clickDelay, fire);
    });

    target.once(Phaser.GameObjects.Events.DESTROY, () => {
        scene.events.off(Phaser.Scenes.Events.UPDATE, apply);
        pending?.remove(false);
        scene.tweens.killTweensOf([intro, idle, body]);
    });

    style.idle?.(scene, layers);
    const playIntro = (delay = 0) => { style.intro?.(scene, layers, delay); apply(); };
    if (opts.intro !== false) playIntro(nextIntroDelay(scene));
    return playIntro;
}
