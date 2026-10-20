import Phaser from 'phaser';
import { AudioManager } from '../services/AudioManager';
import { addButtonFeedback } from './transitions';

/**
 * An image button (back, pause, settings, play, retry...). Origin is centered.
 * Click sound, hover and press feedback are built in.
 */
export class IconButton {
    public readonly sprite: Phaser.GameObjects.Image;
    private enabled = true;

    constructor(
        scene: Phaser.Scene,
        name: string,
        x: number,
        y: number,
        texture: string,
        onClick: () => void
    ) {
        this.sprite = scene.add.image(x, y, texture).setName(name).setInteractive({ useHandCursor: true });
        addButtonFeedback(this.sprite, this.sprite, () => {
            if (!this.enabled) return;
            AudioManager.getInstance().playSFX('click', 0.7);
            onClick();
        });
    }

    public setDepth(depth: number) { this.sprite.setDepth(depth); return this; }
    public setTexture(key: string) { this.sprite.setTexture(key); return this; }
    public setVisible(visible: boolean) { this.sprite.setVisible(visible); return this; }

    public disable() {
        this.enabled = false;
        this.sprite.disableInteractive().setAlpha(0.5);
        return this;
    }

    public enable() {
        this.enabled = true;
        this.sprite.setInteractive({ useHandCursor: true }).setAlpha(1);
        return this;
    }

    public destroy() { this.sprite.destroy(); }
}
