import Phaser from 'phaser';
import { runtime } from '../runtime';
import { UILayers } from '../layout/UILayers';
import { UIPositions } from '../layout/UIPositions';
import { addText } from './text';

/**
 * Non-blocking hint bubble at the bottom action anchor (Layer 2). Gameplay keeps running.
 * Hides itself after `durationMs` (0 = stays until hidden) or when tapped.
 * Named: hint, hint.bg, hint.text.
 */
export class HintOverlay {
    private container: Phaser.GameObjects.Container | null = null;
    private timer: Phaser.Time.TimerEvent | null = null;

    constructor(private readonly scene: Phaser.Scene) { }

    public show(message: string, durationMs = 4000) {
        this.hide(true);
        const scene = this.scene;
        const c = runtime.theme.colors;
        const pos = UIPositions.bottomAction(scene);
        const maxW = Math.min(1200, scene.scale.width - 160);

        const text = addText(scene, 'hint.text', 0, 0, message, {
            style: 'body', wrapWidth: maxW - 80
        });
        const w = Math.min(maxW, text.width + 80);
        const h = text.height + 48;

        const bg = scene.add.graphics().setName('hint.bg');
        bg.fillStyle(c.panel, 0.92).fillRoundedRect(-w / 2, -h / 2, w, h, 24);
        bg.lineStyle(4, c.panelBorder, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 24);

        const container = scene.add.container(pos.x, pos.y, [bg, text])
            .setName('hint')
            .setDepth(UILayers.OVERLAY_PANEL)
            .setSize(w, h)
            .setAlpha(0)
            .setScale(0.6)
            .setInteractive({ useHandCursor: true });
        container.once('pointerdown', () => this.hide());
        this.container = container;

        // Pop up with a gentle bounce while drifting up a little
        scene.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 380, ease: 'Back.easeOut' });
        scene.tweens.add({ targets: container, y: pos.y - 10, duration: 380, ease: 'Sine.easeOut' });
        if (durationMs > 0) this.timer = scene.time.delayedCall(durationMs, () => this.hide());
    }

    public hide(immediate = false) {
        this.timer?.remove();
        this.timer = null;
        const container = this.container;
        this.container = null;
        if (!container) return;
        if (immediate || !container.scene) { container.destroy(); return; }
        container.disableInteractive();
        this.scene.tweens.killTweensOf(container);
        this.scene.tweens.add({ targets: container, alpha: 0, scale: 0.7, duration: 200, ease: 'Back.easeIn', onComplete: () => container.destroy() });
    }
}
