import Phaser from 'phaser';
import { runtime } from '../runtime';
import { UILayers } from '../layout/UILayers';
import { UIPositions } from '../layout/UIPositions';
import { Motion, popIn, popOut } from './transitions';
import { pinObject } from '../layout/locked';

export type ModalLayer = 'modal' | 'overlay';

/**
 * Base for every blocking panel: a dim full-screen blocker plus a centered content container
 * that pops in and out while the dim fades. 'modal' = Layer 3 (Settings, Pause, results), 'overlay' = Layer 2 (tutorials).
 * Named parts: `<name>.blocker`, `<name>` (the content container).
 */
export class Modal {
    public readonly content: Phaser.GameObjects.Container;
    protected readonly scene: Phaser.Scene;
    private readonly blocker: Phaser.GameObjects.Rectangle;
    private closing = false;

    constructor(scene: Phaser.Scene, name: string, layer: ModalLayer = 'modal', dim = 0.5) {
        this.scene = scene;
        const { width, height } = scene.scale;
        const center = UIPositions.center(scene);
        const isModal = layer === 'modal';

        this.blocker = scene.add.rectangle(center.x, center.y, width, height, runtime.theme.colors.overlay, dim)
            .setName(`${name}.blocker`)
            .setInteractive()   // swallows clicks to everything below
            .setDepth(isModal ? UILayers.MODAL_BACKGROUND : UILayers.OVERLAY_BACKGROUND)
            .setScrollFactor(0)
            .setAlpha(0);
        scene.tweens.add({ targets: this.blocker, alpha: 1, duration: Motion.DIM_MS, ease: 'Sine.easeOut' });

        this.content = scene.add.container(center.x, center.y)
            .setName(name)
            .setDepth(isModal ? UILayers.MODAL_PANEL : UILayers.OVERLAY_PANEL)
            .setScrollFactor(0);

        // Popups always cover the game: their depth is fixed (they still animate and close normally)
        pinObject(this.blocker, { transform: false, visible: false });
        pinObject(this.content, { transform: false, visible: false });
        popIn(scene, this.content);
    }

    /** Pop out, destroy, then run `then`. Safe to call twice. */
    public close(then?: () => void) {
        if (this.closing) return;
        this.closing = true;
        this.blocker.disableInteractive();
        this.scene.tweens.add({ targets: this.blocker, alpha: 0, duration: Motion.DIM_MS, ease: 'Sine.easeIn' });
        popOut(this.scene, this.content, () => {
            this.destroy();
            then?.();
        });
    }

    /** Immediate removal (scene shutdown). Subclasses destroy their own extra objects first. */
    public destroy() {
        this.scene.tweens?.killTweensOf([this.blocker, this.content]);
        this.blocker.destroy();
        this.content.destroy();
    }
}
