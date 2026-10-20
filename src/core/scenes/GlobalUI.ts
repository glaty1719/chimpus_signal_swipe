import Phaser from 'phaser';
import { SceneKeys } from '../events';
import { UILayers } from '../layout/UILayers';
import { pinObject } from '../layout/locked';

/** Always-on top layer: the studio logo in the bottom-left corner. Its position, size and depth are locked. */
export class GlobalUI extends Phaser.Scene {
    constructor() {
        super(SceneKeys.GlobalUI);
    }

    create() {
        this.scene.bringToTop();
        const margin = 16;
        const logo = this.add.image(margin, this.scale.height - margin, 'cv_logo')
            .setOrigin(0, 1)
            .setScrollFactor(0)
            .setDepth(UILayers.BRANDING)
            .setName('studioLogo');
        pinObject(logo);
    }
}
