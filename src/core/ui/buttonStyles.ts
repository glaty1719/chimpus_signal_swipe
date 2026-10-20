import Phaser from 'phaser';

/**
 * Button animation library ("warehouse"). Every project has all styles; each picks one in
 * game.config.ts: `buttonStyle: 'popSparkle'` (the default). Try them all at /dev/animation-lab.html (npm run dev).
 *
 * A style animates three independent layers, which ButtonMotion combines every frame:
 *   intro  entrance when the button appears
 *   idle   looping motion while nothing happens (float, breathe, sway)
 *   body   hover / press / release
 * Each layer has scaleX, scaleY, scale (sets both), y (offset in px) and angle (degrees).
 */
export interface MotionLayer { scaleX: number; scaleY: number; scale: number; y: number; angle: number }

export interface ButtonLayers {
    intro: MotionLayer;
    idle: MotionLayer;
    body: MotionLayer;
}

export interface ButtonStyle {
    name: string;
    feel: string;
    /** When the click action runs: on press ('down') or on release ('up'). */
    clickOn: 'down' | 'up';
    /** Delay in ms between release and the click action, so the release bounce is seen. */
    clickDelay: number;
    intro?(s: Phaser.Scene, b: ButtonLayers, delay: number): void;
    idle?(s: Phaser.Scene, b: ButtonLayers): void;
    over(s: Phaser.Scene, b: ButtonLayers): void;
    out(s: Phaser.Scene, b: ButtonLayers): void;
    down(s: Phaser.Scene, b: ButtonLayers): void;
    up(s: Phaser.Scene, b: ButtonLayers): void;
}

type Props = Record<string, unknown>;

/** Replace the layer's running tween with a new one. */
function to(s: Phaser.Scene, layer: MotionLayer, props: Props) {
    s.tweens.killTweensOf(layer);
    s.tweens.add({ targets: layer, ...props });
}

function chain(s: Phaser.Scene, layer: MotionLayer, steps: Props[]) {
    s.tweens.killTweensOf(layer);
    s.tweens.chain({ targets: layer, tweens: steps as Phaser.Types.Tweens.TweenBuilderConfig[] });
}

/** Intro: the intro layer starts at `from` and eases back to rest. */
function introFrom(s: Phaser.Scene, b: ButtonLayers, delay: number, from: Partial<Omit<MotionLayer, 'scale'>> & { scale?: number }, ease: string, duration: number) {
    const l = b.intro;
    s.tweens.killTweensOf(l);
    l.scaleX = from.scaleX ?? from.scale ?? 1;
    l.scaleY = from.scaleY ?? from.scale ?? 1;
    l.y = from.y ?? 0;
    l.angle = from.angle ?? 0;
    s.tweens.add({ targets: l, scaleX: 1, scaleY: 1, y: 0, angle: 0, ease, duration, delay });
}

function idleLoop(s: Phaser.Scene, b: ButtonLayers, props: Props) {
    s.tweens.add({ targets: b.idle, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', ...props });
}

export const BUTTON_STYLES = {
    jellyPop: {
        name: 'Jelly Pop',
        feel: 'Squishes flat when pressed, wobbles back like jelly.',
        clickOn: 'up', clickDelay: 180,
        intro: (s, b, d) => introFrom(s, b, d, { scale: 0 }, 'Elastic.easeOut', 1100),
        over: (s, b) => to(s, b.body, { scale: 1.08, duration: 380, ease: 'Back.easeOut' }),
        out: (s, b) => to(s, b.body, { scale: 1, duration: 380, ease: 'Back.easeOut' }),
        down: (s, b) => to(s, b.body, { scaleX: 1.18, scaleY: 0.82, duration: 180, ease: 'Quad.easeOut' }),
        up: (s, b) => to(s, b.body, { scaleX: 1.08, scaleY: 1.08, duration: 800, ease: 'Elastic.easeOut', easeParams: [1.1, 0.35] })
    },
    candyBounce: {
        name: 'Candy Bounce',
        feel: 'Drops in and bounces; press squashes, release springs up and lands.',
        clickOn: 'up', clickDelay: 200,
        intro: (s, b, d) => introFrom(s, b, d, { y: -260 }, 'Bounce.easeOut', 1000),
        over: (s, b) => to(s, b.body, { scale: 1.1, duration: 320, ease: 'Back.easeOut' }),
        out: (s, b) => to(s, b.body, { scale: 1, duration: 320, ease: 'Back.easeOut' }),
        down: (s, b) => to(s, b.body, { scaleX: 1.14, scaleY: 0.8, duration: 160, ease: 'Quad.easeOut' }),
        up: (s, b) => chain(s, b.body, [
            { scaleX: 0.9, scaleY: 1.18, duration: 170, ease: 'Quad.easeOut' },
            { scaleX: 1.1, scaleY: 1.1, duration: 500, ease: 'Bounce.easeOut' }
        ])
    },
    softBreathe: {
        name: 'Soft Breathe',
        feel: 'Calm, slow pulse while idle. Smooth, gentle press. The most subtle.',
        clickOn: 'up', clickDelay: 150,
        intro: (s, b, d) => introFrom(s, b, d, { scale: 0.6 }, 'Sine.easeOut', 800),
        idle: (s, b) => idleLoop(s, b, { scale: 1.045, duration: 1200 }),
        over: (s, b) => to(s, b.body, { scale: 1.07, duration: 350, ease: 'Sine.easeOut' }),
        out: (s, b) => to(s, b.body, { scale: 1, duration: 350, ease: 'Sine.easeInOut' }),
        down: (s, b) => to(s, b.body, { scale: 0.93, duration: 180, ease: 'Sine.easeOut' }),
        up: (s, b) => to(s, b.body, { scale: 1.07, duration: 450, ease: 'Back.easeOut' })
    },
    rubberBand: {
        name: 'Rubber Band',
        feel: 'Stretches like rubber when released. Bold and very bouncy.',
        clickOn: 'up', clickDelay: 250,
        intro: (s, b, d) => introFrom(s, b, d, { scaleX: 1.5, scaleY: 0.2 }, 'Elastic.easeOut', 1100),
        over: (s, b) => to(s, b.body, { scale: 1.05, duration: 280, ease: 'Sine.easeOut' }),
        out: (s, b) => to(s, b.body, { scale: 1, duration: 280, ease: 'Sine.easeOut' }),
        down: (s, b) => to(s, b.body, { scaleX: 1.25, scaleY: 0.75, duration: 170, ease: 'Quad.easeOut' }),
        up: (s, b) => chain(s, b.body, [
            [0.75, 1.25], [1.15, 0.85], [0.95, 1.05], [1.05, 0.95], [1.05, 1.05]
        ].map(([scaleX, scaleY]) => ({ scaleX, scaleY, duration: 130, ease: 'Sine.easeInOut' })))
    },
    popSparkle: {
        name: 'Pop & Sparkle',
        feel: 'Squashes like candy on press, then stretches, pops big and settles with a bouncy wobble.',
        clickOn: 'up', clickDelay: 260,
        intro: (s, b, d) => introFrom(s, b, d, { scale: 0 }, 'Back.easeOut', 650),
        over: (s, b) => to(s, b.body, { scale: 1.08, duration: 110, ease: 'Sine.easeOut' }),
        out: (s, b) => to(s, b.body, { scale: 1, duration: 110, ease: 'Sine.easeOut' }),
        down: (s, b) => to(s, b.body, { scaleX: 1.1, scaleY: 0.84, duration: 160, ease: 'Quad.easeOut' }),
        up: (s, b) => chain(s, b.body, [
            { scaleX: 0.92, scaleY: 1.14, duration: 110, ease: 'Quad.easeOut' },
            { scaleX: 1.22, scaleY: 1.22, duration: 150, ease: 'Back.easeOut' },
            { scaleX: 1.08, scaleY: 1.08, duration: 520, ease: 'Elastic.easeOut', easeParams: [1, 0.55] }
        ])
    },
    gummySway: {
        name: 'Gummy Sway',
        feel: 'Lifts on hover, squishes down and springs up like a gummy. No tilting.',
        clickOn: 'up', clickDelay: 200,
        intro: (s, b, d) => introFrom(s, b, d, { scaleX: 1.2, scaleY: 0 }, 'Back.easeOut', 800),
        over: (s, b) => to(s, b.body, { scale: 1.07, y: -6, duration: 380, ease: 'Back.easeOut' }),
        out: (s, b) => to(s, b.body, { scale: 1, y: 0, duration: 380, ease: 'Sine.easeOut' }),
        down: (s, b) => to(s, b.body, { scaleX: 1.1, scaleY: 0.85, y: 6, duration: 180, ease: 'Quad.easeOut' }),
        up: (s, b) => chain(s, b.body, [
            { scaleX: 0.94, scaleY: 1.14, y: -12, duration: 190, ease: 'Quad.easeOut' },
            { scaleX: 1.07, scaleY: 1.07, y: -6, duration: 420, ease: 'Back.easeOut' }
        ])
    }
} satisfies Record<string, ButtonStyle>;

// Styles are shared by every game: no code may change them at runtime
for (const style of Object.values(BUTTON_STYLES)) Object.freeze(style);
Object.freeze(BUTTON_STYLES);

export type ButtonStyleId = keyof typeof BUTTON_STYLES;
export const BUTTON_STYLE_IDS = Object.keys(BUTTON_STYLES) as ButtonStyleId[];
export const DEFAULT_BUTTON_STYLE: ButtonStyleId = 'popSparkle';
