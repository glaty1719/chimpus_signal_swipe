import Phaser from 'phaser';
import { attachButtonMotion, type ButtonMotionOptions } from './buttonMotion';

/**
 * Standard motion. Durations and easings come from the project rules:
 *   scene fade 300ms · modal pop-in ~560ms (grow past full size, soft squash, settle) · pop-out ~290ms
 *   button motion lives in the button styles (buttonStyles.ts)
 */
export const Motion = Object.freeze({
    FADE_MS: 300,
    MODAL_IN_MS: 560,
    MODAL_OUT_MS: 290,
    DIM_MS: 250
} as const);

/** Call at the top of a scene's create(). */
export function fadeIn(scene: Phaser.Scene) {
    scene.cameras.main.fadeIn(Motion.FADE_MS, 0, 0, 0);
}

/** Fade to black, then start another scene. Ignores repeated calls while fading. */
export function fadeToScene(scene: Phaser.Scene, key: string, data?: object) {
    const cam = scene.cameras.main;
    if (cam.fadeEffect.isRunning) return;
    cam.fadeOut(Motion.FADE_MS, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(key, data));
}

type Poppable = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.AlphaSingle;

/** Candy pop-in: grows from small past full size, does a soft squash, then settles (~MODAL_IN_MS). */
export function popIn(scene: Phaser.Scene, target: Poppable) {
    scene.tweens.killTweensOf(target);
    target.setScale(0.4).setAlpha(0);
    scene.tweens.chain({
        targets: target,
        tweens: [
            { scaleX: 1.08, scaleY: 1.08, alpha: 1, duration: 230, ease: 'Cubic.easeOut' },
            { scaleX: 1.03, scaleY: 0.95, duration: 120, ease: 'Sine.easeInOut' },
            { scaleX: 1, scaleY: 1, duration: 210, ease: 'Back.easeOut' }
        ]
    });
}

/** Pop-out: a tiny breath in, then shrinks away and fades (~MODAL_OUT_MS), then onComplete (usually destroy). */
export function popOut(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, onComplete: () => void) {
    scene.tweens.killTweensOf(target);
    scene.tweens.chain({
        targets: target,
        tweens: [
            { scaleX: 1.05, scaleY: 1.05, duration: 90, ease: 'Sine.easeOut' },
            { scaleX: 0.6, scaleY: 0.6, alpha: 0, duration: 200, ease: 'Cubic.easeIn' }
        ],
        onComplete
    });
}

type Scalable = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;

/**
 * Button animation on `target`, with input on `hitTarget`, in the project's button style
 * (`buttonStyle` in game.config.ts; styles live in buttonStyles.ts). Every core button uses this,
 * so all buttons in a game move the same way. The button's own scale is kept (e.g. a level card drawn at 0.8).
 */
export function addButtonFeedback(
    hitTarget: Phaser.GameObjects.GameObject,
    target: Scalable,
    onClick: () => void,
    opts: ButtonMotionOptions = {}
) {
    return attachButtonMotion(hitTarget, target, onClick, opts);
}
