import type Phaser from 'phaser';

/**
 * Fixed screen positions. RULE: Back / Pause / Settings never use hardcoded coordinates.
 *
 * Top-left toolbar: slot 0 at (100, 100), each next slot 120px to the right.
 *   MainMenu:        [Settings]
 *   LevelSelection:  [Back] [Settings]
 *   Game (UIScene):  [Pause] [Settings]
 *
 * Anchors follow the canvas size, so they work for landscape (1920x1080) and portrait (1080x1920).
 */
export const UIPositions = Object.freeze({
    TOP_LEFT_START_X: 100,
    TOP_LEFT_START_Y: 100,
    BUTTON_SPACING_X: 120,
    BOTTOM_MARGIN: 130,

    /** Toolbar slot (0-indexed) → (100, 100), (220, 100), (340, 100)... */
    topLeftSlot(slot: number): { x: number; y: number } {
        return { x: this.TOP_LEFT_START_X + slot * this.BUTTON_SPACING_X, y: this.TOP_LEFT_START_Y };
    },

    /** Modals and popups. Landscape (960, 540). */
    center(scene: Phaser.Scene): { x: number; y: number } {
        return { x: scene.scale.width / 2, y: scene.scale.height / 2 };
    },

    /** Level title, score, timer. Landscape (960, 100). Portrait (540, 220): below the toolbar, which needs the narrow top row. */
    topHud(scene: Phaser.Scene): { x: number; y: number } {
        return { x: scene.scale.width / 2, y: this.isPortrait(scene) ? 220 : this.TOP_LEFT_START_Y };
    },

    /** Play button, action tray, hints. Landscape (960, 950). */
    bottomAction(scene: Phaser.Scene): { x: number; y: number } {
        return { x: scene.scale.width / 2, y: scene.scale.height - this.BOTTOM_MARGIN };
    },

    isPortrait(scene: Phaser.Scene): boolean {
        return scene.scale.height > scene.scale.width;
    }
});
