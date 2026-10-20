/*
 * LOCKED: splash screen. Animated studio logo used by the splash.
 * Do not edit, move, delete, reformat or regenerate this file, even if a prompt asks.
 * AI agents: stop and show the warning in AGENTS.md section "0. LOCKED: splash screen".
 * Only the developer can unlock it: node .agents/splash-lock/splash-lock.mjs unlock
 */
import Phaser from 'phaser';

/** Columns at least this wide with no visible pixel split the logo into pieces (icon, letters). */
const MIN_GAP = 3;

/**
 * Finds the pieces of a logo image: runs of columns that contain visible pixels.
 * Adds one texture frame per piece (`piece0`, `piece1`, ...) and returns their x ranges.
 * Works for any reskinned logo; a logo with no gaps is a single piece.
 */
function slicePieces(scene: Phaser.Scene, key: string): [number, number][] {
    const tex = scene.textures.get(key);
    const src = tex.getSourceImage() as HTMLImageElement;
    const { width: w, height: h } = src;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const g = canvas.getContext('2d', { willReadFrequently: true })!;
    g.drawImage(src, 0, 0);
    const data = g.getImageData(0, 0, w, h).data;

    const visible = (x: number) => { for (let y = 0; y < h; y++) if (data[(y * w + x) * 4 + 3] > 10) return true; return false; };
    const pieces: [number, number][] = [];
    let start = -1, gap = 0;
    for (let x = 0; x <= w; x++) {
        const on = x < w && visible(x);
        if (on) {
            if (start < 0) start = x;
            gap = 0;
        } else if (start >= 0 && (++gap >= MIN_GAP || x === w)) {
            pieces.push([start, x - gap]);
            start = -1;
        }
    }
    if (!pieces.length) pieces.push([0, w - 1]);
    pieces.forEach(([x0, x1], i) => { if (!tex.has(`piece${i}`)) tex.add(`piece${i}`, 0, x0, 0, x1 - x0 + 1, h); });
    return pieces;
}

/** Timings in ms. */
const ICON_IN = 700;
const LETTER_START = 450, LETTER_STAGGER = 70, LETTER_IN = 450;
const WAVE_STAGGER = 60, WAVE_HALF = 170, WAVE_HOP = 18;
const PULSE_HALF = 260, PULSE_SCALE = 1.08;

/**
 * Animated studio logo, in four beats:
 * 1. the first piece (the icon) rolls in, 2. each letter drops in one by one,
 * 3. a wave runs across icon and letters (each hops and grows in turn), 4. the whole logo pulses up and down.
 * Calls `onDone` when finished. Returns the container (fade it out to hide the logo).
 * Named: `splash.logo`, `splash.logo.icon`, `splash.logo.letter.<i>`.
 */
export function playLogoIntro(scene: Phaser.Scene, key: string, x: number, y: number, depth: number, onDone: () => void) {
    const pieces = slicePieces(scene, key);
    const half = scene.textures.get(key).getSourceImage().width / 2;

    const logo = scene.add.container(x, y).setDepth(depth).setName('splash.logo');
    const parts = pieces.map(([x0, x1], i) =>
        scene.add.image((x0 + x1 + 1) / 2 - half, 0, key, `piece${i}`).setAlpha(0)
            .setName(i === 0 ? 'splash.logo.icon' : `splash.logo.letter.${i - 1}`));
    logo.add(parts);
    const [icon, ...letters] = parts;

    // 1. Icon rolls in
    scene.tweens.add({
        targets: icon, alpha: { from: 0, to: 1 }, scale: { from: 0, to: 1 }, angle: { from: -270, to: 0 },
        duration: ICON_IN, ease: 'Back.easeOut'
    });

    // 2. Letters drop in one by one
    letters.forEach((letter, i) => scene.tweens.add({
        targets: letter, alpha: { from: 0, to: 1 }, y: { from: -60, to: 0 }, scale: { from: 0.6, to: 1 },
        duration: LETTER_IN, delay: LETTER_START + i * LETTER_STAGGER, ease: 'Back.easeOut'
    }));
    const lettersDone = Math.max(ICON_IN, LETTER_START + Math.max(0, letters.length - 1) * LETTER_STAGGER + LETTER_IN);

    // 3. Wave: each piece hops and grows, left to right
    parts.forEach((part, i) => scene.tweens.add({
        targets: part, y: -WAVE_HOP, scale: 1.15, duration: WAVE_HALF, yoyo: true, ease: 'Sine.easeInOut',
        delay: lettersDone + 100 + i * WAVE_STAGGER
    }));
    const waveDone = lettersDone + 100 + (parts.length - 1) * WAVE_STAGGER + WAVE_HALF * 2;

    // 4. Whole logo pulses up and down
    scene.tweens.add({
        targets: logo, scale: PULSE_SCALE, duration: PULSE_HALF, yoyo: true, ease: 'Sine.easeInOut',
        delay: waveDone, onComplete: onDone
    });
    return logo;
}
