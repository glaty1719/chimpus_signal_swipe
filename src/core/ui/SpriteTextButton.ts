import Phaser from 'phaser';
import { AudioManager } from '../services/AudioManager';
import { addText } from './text';
import { addButtonFeedback } from './transitions';

/**
 * A sprite button with a text label (RESUME, RESTART, NEXT...).
 * Named parts: `<name>` (container), `<name>.bg`, `<name>.label`.
 */
export class SpriteTextButton {
    public readonly container: Phaser.GameObjects.Container;
    public readonly sprite: Phaser.GameObjects.Image;
    public readonly label: Phaser.GameObjects.Text;

    constructor(
        scene: Phaser.Scene,
        name: string,
        x: number,
        y: number,
        texture: string,
        text: string,
        onClick: () => void,
        labelOffsetY = -4
    ) {
        this.sprite = scene.add.image(0, 0, texture).setName(`${name}.bg`).setInteractive({ useHandCursor: true });
        this.label = addText(scene, `${name}.label`, 0, labelOffsetY, text, {
            style: 'button'
        });
        this.container = scene.add.container(x, y, [this.sprite, this.label]).setName(name);

        addButtonFeedback(this.sprite, this.container, () => {
            AudioManager.getInstance().playSFX('click');
            onClick();
        });
    }

    public setDepth(depth: number) { this.container.setDepth(depth); return this; }
    public setText(text: string) { this.label.setText(text); return this; }
    public destroy() { this.container.destroy(); }
}
