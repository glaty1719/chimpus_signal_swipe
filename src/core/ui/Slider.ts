import Phaser from 'phaser';
import { runtime } from '../runtime';

/**
 * Slider motion. Movements ease in and out (slow start, slow end) for a soft feel;
 * the handle pops on release like the buttons.
 */
const SliderMotion = {
    EASE: 'Sine.easeInOut',
    HOVER_SCALE: 1.15, HOVER_MS: 150,
    GRAB_SCALE: 1.3, GRAB_MS: 160,
    GLIDE_MS: 320,
    INTRO_MS: 700, INTRO_DELAY_MS: 120,
    /**
     * Wave: the handle swells when it sets off and shrinks as it nears its goal.
     * WAVE_MAX: extra size at the start of a full-size trip (0.7 = 1.7x). A trip of WAVE_FULL_TRIP value units or more
     * makes a full wave; shorter trips make smaller ones. While dragging, size follows speed (WAVE_PER_SPEED per px/ms).
     * WAVE_RISE / WAVE_FALL: how fast it swells up / calms down (per frame, 0..1).
     */
    WAVE_MAX: 0.7, WAVE_FULL_TRIP: 40, WAVE_PER_SPEED: 0.45, WAVE_RISE: 0.35, WAVE_FALL: 0.32
} as const;

/**
 * Horizontal slider, value 0..100. Local origin is the left end of the track.
 * Animated: fill grows in when created, handle grows on hover and while dragged, glides when the track
 * is clicked, and pops on release. While it moves it rides a wave: it swells big as it sets off and shrinks
 * smoothly as it reaches its goal. The value itself always changes immediately.
 * Named parts: `<name>` (container), `<name>.track`, `<name>.fill`, `<name>.handle`.
 */
export class Slider {
    public readonly container: Phaser.GameObjects.Container;
    private readonly fill: Phaser.GameObjects.Graphics;
    private readonly handle: Phaser.GameObjects.Graphics;
    private readonly handleHit: Phaser.GameObjects.Zone;
    private value = 50;
    /** Position drawn on screen (0..100); eases toward `value` when the track is clicked. */
    private shown = 0;
    private dragging = false;
    private hovered = false;
    /** Handle size from hover / grab / release tweens; the wave is applied on top every frame. */
    private readonly base = { scale: 1 };
    private wave = { size: 0, lastX: 0, speed: 0, from: 0, to: 0 };
    private readonly onFrame: (time: number, delta: number) => void;
    private readonly onMove: (pointer: Phaser.Input.Pointer) => void;
    private readonly onUp: () => void;

    constructor(
        private readonly scene: Phaser.Scene,
        name: string,
        x: number,
        y: number,
        private readonly width: number,
        private readonly onChange: (value: number) => void,
        initialValue = 50
    ) {
        const c = runtime.theme.colors;

        const track = scene.make.graphics({ x: 0, y: -12 }, false).setName(`${name}.track`);
        track.fillStyle(c.sliderTrack, 1).fillRoundedRect(0, 0, width, 24, 12);

        this.fill = scene.make.graphics({ x: 4, y: -8 }, false).setName(`${name}.fill`);

        this.handle = scene.make.graphics({ x: 0, y: 0 }, false).setName(`${name}.handle`);
        this.handle.fillStyle(0xffffff, 1).fillCircle(0, 0, 12);
        this.handle.lineStyle(3, c.sliderHandle, 1).strokeCircle(0, 0, 12);

        const trackHit = scene.add.zone(width / 2, 0, width + 40, 60).setInteractive({ useHandCursor: true }).setName(`${name}.trackHit`);
        this.handleHit = scene.add.zone(0, 0, 60, 60).setInteractive({ useHandCursor: true }).setName(`${name}.handleHit`);

        this.container = scene.add.container(x, y, [track, this.fill, this.handle, trackHit, this.handleHit]).setName(name);

        trackHit.on('pointerdown', (p: Phaser.Input.Pointer) => this.startDrag(p, true));
        this.handleHit.on('pointerdown', (p: Phaser.Input.Pointer) => this.startDrag(p, false));
        this.handleHit.on('pointerover', () => { this.hovered = true; if (!this.dragging) this.scaleHandle(SliderMotion.HOVER_SCALE, SliderMotion.HOVER_MS); });
        this.handleHit.on('pointerout', () => { this.hovered = false; if (!this.dragging) this.scaleHandle(1, SliderMotion.HOVER_MS); });

        this.onMove = pointer => {
            if (this.dragging && this.container.active) this.setValue(this.valueAt(pointer));
        };
        this.onUp = () => {
            if (!this.dragging) return;
            this.dragging = false;
            this.release();
        };
        scene.input.on('pointermove', this.onMove);
        scene.input.on('pointerup', this.onUp);
        this.onFrame = (_t, delta) => this.updateWave(delta);
        scene.events.on(Phaser.Scenes.Events.UPDATE, this.onFrame);

        this.value = Phaser.Math.Clamp(initialValue, 0, 100);
        this.intro();
    }

    /** Fill grows from empty to the value; handle pops in. */
    private intro() {
        this.shown = 0;
        this.base.scale = 0;
        this.wave.lastX = this.handle.x;
        this.wave.from = 0;
        this.wave.to = this.value;
        this.redraw();
        this.scene.tweens.add({
            targets: this, shown: this.value, duration: SliderMotion.INTRO_MS, delay: SliderMotion.INTRO_DELAY_MS,
            ease: SliderMotion.EASE, onUpdate: () => this.redraw()
        });
        this.scene.tweens.add({ targets: this.base, scale: 1, duration: SliderMotion.INTRO_MS, delay: SliderMotion.INTRO_DELAY_MS, ease: 'Back.easeOut' });
    }

    private startDrag(pointer: Phaser.Input.Pointer, fromTrack: boolean) {
        this.dragging = true;
        this.scaleHandle(SliderMotion.GRAB_SCALE, SliderMotion.GRAB_MS);
        // Clicking the track glides there; grabbing the handle follows the pointer exactly
        this.setValue(this.valueAt(pointer), true, fromTrack);
    }

    /** Candy pop: dip, then spring back to hover or rest size. */
    private release() {
        this.scene.tweens.killTweensOf(this.base);
        this.scene.tweens.chain({
            targets: this.base,
            tweens: [
                { scale: 0.9, duration: 90, ease: 'Quad.easeOut' },
                { scale: this.hovered ? SliderMotion.HOVER_SCALE : 1, duration: 280, ease: 'Back.easeOut' }
            ]
        });
    }

    private scaleHandle(scale: number, duration: number) {
        this.scene.tweens.killTweensOf(this.base);
        this.scene.tweens.add({ targets: this.base, scale, duration, ease: SliderMotion.EASE });
    }

    /**
     * Wave: on a glide the extra size follows the distance still to go (big at the start, normal at the goal);
     * while dragging it follows the speed. It swells quickly and calms down smoothly.
     */
    private updateWave(delta: number) {
        if (!this.handle.active) return;
        const w = this.wave, M = SliderMotion;
        const dt = Math.max(delta, 1), frames = dt / 16.67;
        const speed = Math.abs(this.handle.x - w.lastX) / dt;           // px per ms
        w.lastX = this.handle.x;
        w.speed += (speed - w.speed) * Math.min(1, 0.5 * frames);

        let target = 0;
        const trip = Math.abs(w.to - w.from);
        if (this.scene.tweens.isTweening(this) && trip > 0) {
            const left = Math.abs(w.to - this.shown) / trip;            // 1 at the start, 0 at the goal
            target = M.WAVE_MAX * Math.min(1, trip / M.WAVE_FULL_TRIP) * left;
        } else if (this.dragging) {
            target = Math.min(w.speed * M.WAVE_PER_SPEED, M.WAVE_MAX);
        }
        const rate = target > w.size ? M.WAVE_RISE : M.WAVE_FALL;
        w.size += (target - w.size) * (1 - Math.pow(1 - rate, frames)); // frame-rate independent
        this.handle.setScale(this.base.scale * (1 + w.size));
    }

    private valueAt(pointer: Phaser.Input.Pointer) {
        // Invert the container's world transform: works inside scaled/nested containers
        const local = new Phaser.Math.Vector2();
        this.container.getWorldTransformMatrix().applyInverse(pointer.x, pointer.y, local);
        return Math.round(Phaser.Math.Clamp(local.x / this.width, 0, 1) * 100);
    }

    private redraw() {
        const x = (this.shown / 100) * this.width;
        this.handle.x = x;
        this.handleHit.x = x;
        this.fill.clear();
        // keep the rounded look for small non-zero values
        const w = Math.max(x, this.shown > 0.5 ? 12 : 0);
        this.fill.fillStyle(runtime.theme.colors.sliderFill, 1).fillRoundedRect(0, 0, w, 16, 8);
    }

    /** Set the value (0..100). `notify` calls onChange. `glide` eases the handle there instead of jumping. */
    public setValue(value: number, notify = true, glide = false) {
        this.value = Phaser.Math.Clamp(value, 0, 100);
        this.scene.tweens.killTweensOf(this);
        if (glide) {
            this.wave.from = this.shown;
            this.wave.to = this.value;
            this.scene.tweens.add({ targets: this, shown: this.value, duration: SliderMotion.GLIDE_MS, ease: SliderMotion.EASE, onUpdate: () => this.redraw() });
        } else {
            this.shown = this.value;
            this.redraw();
        }
        if (notify) this.onChange(this.value);
    }

    public getValue() { return this.value; }

    public destroy() {
        this.scene.tweens.killTweensOf([this, this.base]);
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onFrame);
        this.scene.input.off('pointermove', this.onMove);
        this.scene.input.off('pointerup', this.onUp);
        this.container.destroy();
    }
}
