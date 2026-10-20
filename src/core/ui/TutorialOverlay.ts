import Phaser from 'phaser';
import type { TutorialStep } from '../config';
import { runtime } from '../runtime';
import { Modal } from './Modal';
import { SpriteTextButton } from './SpriteTextButton';
import { addText } from './text';

/**
 * Blocking, multi-step tutorial (Layer 2). Core pauses gameplay while it is open.
 * Named: tutorial, tutorial.blocker, tutorial.bg, tutorial.title, tutorial.image, tutorial.text,
 * tutorial.step, tutorial.nextButton.
 */
export class TutorialOverlay extends Modal {
    private index = 0;
    private readonly title: Phaser.GameObjects.Text;
    private readonly body: Phaser.GameObjects.Text;
    private readonly stepText: Phaser.GameObjects.Text;
    private readonly next: SpriteTextButton;
    private image: Phaser.GameObjects.Image | null = null;

    constructor(scene: Phaser.Scene, private readonly steps: TutorialStep[], private readonly onDone: () => void) {
        super(scene, 'tutorial', 'overlay', 0.6);
        const c = runtime.theme.colors;
        const w = Math.min(1100, scene.scale.width - 120);
        const h = 640;

        const bg = scene.add.graphics().setName('tutorial.bg');
        bg.fillStyle(c.panel, 0.97).fillRoundedRect(-w / 2, -h / 2, w, h, 40);
        bg.lineStyle(8, c.panelBorder, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 40);

        this.title = addText(scene, 'tutorial.title', 0, -h / 2 + 70, '', { style: 'heading' });
        this.body = addText(scene, 'tutorial.text', 0, 40, '', { style: 'body', wrapWidth: w - 120 });
        this.stepText = addText(scene, 'tutorial.step', -w / 2 + 90, h / 2 - 70, '', { style: 'label' });
        this.next = new SpriteTextButton(scene, 'tutorial.nextButton', w / 2 - 170, h / 2 - 70, 'pause_panel_btn', 'NEXT', () => this.advance());

        this.content.add([bg, this.title, this.body, this.stepText, this.next.container]);
        this.render();
    }

    private render() {
        const step = this.steps[this.index];
        const last = this.index === this.steps.length - 1;
        this.title.setText(step.title ?? '');
        this.stepText.setText(this.steps.length > 1 ? `${this.index + 1} / ${this.steps.length}` : '');
        this.next.setText(last ? 'START' : 'NEXT');

        this.image?.destroy();
        this.image = null;
        if (step.image && this.scene.textures.exists(step.image)) {
            this.image = this.scene.add.image(0, -70, step.image).setName('tutorial.image');
            this.image.setScale(Math.min(1, 220 / this.image.height));
            this.content.add(this.image);
            this.body.setY(120);
        } else {
            this.body.setY(20);
        }
        this.body.setText(step.text);
    }

    private advance() {
        if (this.index < this.steps.length - 1) {
            this.index++;
            this.render();
        } else {
            this.close(this.onDone);
        }
    }
}
