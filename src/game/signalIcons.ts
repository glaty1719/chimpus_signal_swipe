import Phaser from 'phaser';
import { AI_DRAWERS, lighten, type IconDrawer } from './signalIconsAi';
import { FIXED_AND_MANUAL_DRAWERS } from './signalIconsFixed';

const DRAWERS: Record<string, IconDrawer> = {
    ...AI_DRAWERS,
    ...FIXED_AND_MANUAL_DRAWERS
};

/**
 * Draws a crisp vector icon for any signal card, with fallback to tech diamond.
 */
export function drawSignalIcon(g: Phaser.GameObjects.Graphics, iconKey: string, size: number, color: number): void {
    const drawer = DRAWERS[iconKey];
    if (drawer) {
        drawer(g, size, color);
    } else {
        // Universal high-tech diamond reticle fallback
        const r = size * 0.38;
        g.lineStyle(2.5, color, 1).strokeRect(-r, -r, r * 2, r * 2);
        g.lineStyle(2, lighten(color, 40), 0.8).strokeCircle(0, 0, r * 0.6);
        g.fillStyle(lighten(color, 60), 1).fillCircle(0, 0, 4);
    }
}
