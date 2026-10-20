import Phaser from 'phaser';

export type IconDrawer = (g: Phaser.GameObjects.Graphics, s: number, color: number) => void;

export function lighten(color: number, amount: number): number {
    return Phaser.Display.Color.IntegerToColor(color).lighten(amount).color;
}

export const AI_DRAWERS: Record<string, IconDrawer> = {
    // Face unlock: biometric face contour, eye markers, scanning reticle
    face: (g, s, c) => {
        const r = s * 0.38;
        g.lineStyle(2, c, 0.4).strokeCircle(0, 0, r * 1.25);
        g.lineStyle(3, c, 1).strokeRoundedRect(-r * 0.75, -r, r * 1.5, r * 1.9, r * 0.6);
        g.fillStyle(lighten(c, 40), 1).fillCircle(-r * 0.32, -r * 0.2, s * 0.04);
        g.fillCircle(r * 0.32, -r * 0.2, s * 0.04);
        g.lineStyle(2, c, 0.8).lineBetween(0, -r * 0.05, 0, r * 0.25);
        g.lineBetween(-r * 0.28, r * 0.5, r * 0.28, r * 0.5);
        const b = r * 1.15;
        const bl = s * 0.16;
        g.lineStyle(2, lighten(c, 50), 0.9);
        [[-b, -b, 1, 1], [b, -b, -1, 1], [-b, b, 1, -1], [b, b, -1, -1]].forEach(([bx, by, dx, dy]) => {
            g.lineBetween(bx, by, bx + dx * bl, by);
            g.lineBetween(bx, by, bx, by + dy * bl);
        });
    },

    // Voice assistant: studio condenser microphone with radiating sound waves
    voice: (g, s, c) => {
        const w = s * 0.24;
        const h = s * 0.44;
        g.fillStyle(c, 0.2).fillRoundedRect(-w / 2, -h * 0.75, w, h, w * 0.5);
        g.lineStyle(3, c, 1).strokeRoundedRect(-w / 2, -h * 0.75, w, h, w * 0.5);
        g.lineStyle(1.5, lighten(c, 40), 0.7);
        g.lineBetween(-w * 0.35, -h * 0.45, w * 0.35, -h * 0.45);
        g.lineBetween(-w * 0.35, -h * 0.2, w * 0.35, -h * 0.2);
        g.lineStyle(2.5, c, 0.9);
        g.beginPath().arc(0, -h * 0.25, w * 0.85, 0, Math.PI, false).strokePath();
        g.lineBetween(0, -h * 0.25 + w * 0.85, 0, h * 0.6);
        g.lineBetween(-s * 0.2, h * 0.6, s * 0.2, h * 0.6);
        [w * 1.25, w * 1.7].forEach((rad, i) => {
            g.lineStyle(2, lighten(c, 30), 0.85 - i * 0.35);
            g.beginPath().arc(0, -h * 0.3, rad, -Math.PI * 0.35, Math.PI * 0.35, false).strokePath();
            g.beginPath().arc(0, -h * 0.3, rad, Math.PI * 0.65, Math.PI * 1.35, false).strokePath();
        });
    },

    // Video recommendations: wide video display with play badge and AI sparkle tags
    video: (g, s, c) => {
        const w = s * 0.72;
        const h = s * 0.48;
        g.fillStyle(c, 0.15).fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.lineStyle(3, c, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.fillStyle(lighten(c, 50), 1);
        g.beginPath();
        g.moveTo(-w * 0.1, -h * 0.28);
        g.lineTo(w * 0.2, 0);
        g.lineTo(-w * 0.1, h * 0.28);
        g.closePath().fillPath();
        g.lineStyle(2, lighten(c, 30), 0.8).lineBetween(-w * 0.4, h * 0.35, w * 0.4, h * 0.35);
        g.fillStyle(lighten(c, 60), 1).fillCircle(-w * 0.1, h * 0.35, 4);
    },

    // Photo face groups: camera gallery card with dual face bounding boxes
    photos: (g, s, c) => {
        const w = s * 0.64;
        const h = s * 0.52;
        g.fillStyle(c, 0.15).fillRoundedRect(-w / 2, -h / 2, w, h, 6);
        g.lineStyle(2.5, c, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
        g.fillStyle(c, 0.3);
        g.beginPath().moveTo(-w * 0.4, h * 0.3).lineTo(-w * 0.1, -h * 0.1).lineTo(w * 0.2, h * 0.3).closePath().fillPath();
        g.fillStyle(lighten(c, 45), 1).fillCircle(-w * 0.2, -h * 0.2, s * 0.06);
        g.lineStyle(2, lighten(c, 55), 0.95).strokeRect(w * 0.05, -h * 0.35, w * 0.36, h * 0.46);
    },

    // Email spam filter: envelope with security shield overlay
    email: (g, s, c) => {
        const w = s * 0.65;
        const h = s * 0.45;
        g.fillStyle(c, 0.15).fillRoundedRect(-w / 2, -h / 2, w, h, 6);
        g.lineStyle(2.5, c, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
        g.lineStyle(2, c, 0.9);
        g.beginPath().moveTo(-w / 2, -h / 2).lineTo(0, h * 0.1).lineTo(w / 2, -h / 2).strokePath();
        const sw = s * 0.26;
        const sh = s * 0.32;
        g.fillStyle(lighten(c, 30), 0.9);
        g.beginPath();
        g.moveTo(w * 0.2, 0);
        g.lineTo(w * 0.2 + sw / 2, -sh * 0.3);
        g.lineTo(w * 0.2 + sw / 2, sh * 0.2);
        g.lineTo(w * 0.2, sh * 0.5);
        g.lineTo(w * 0.2 - sw / 2, sh * 0.2);
        g.lineTo(w * 0.2 - sw / 2, -sh * 0.3);
        g.closePath().fillPath();
    },

    // Keyboard prediction: keyboard keys with autocomplete predictive chips
    keyboard: (g, s, c) => {
        const w = s * 0.72;
        const h = s * 0.44;
        g.fillStyle(c, 0.15).fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.lineStyle(2.5, c, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.fillStyle(lighten(c, 25), 0.3).fillRoundedRect(-w * 0.44, -h * 0.4, w * 0.88, h * 0.3, 4);
        g.lineStyle(1.5, lighten(c, 40), 0.9).strokeRoundedRect(-w * 0.18, -h * 0.4, w * 0.36, h * 0.3, 4);
        g.fillStyle(lighten(c, 45), 0.8);
        [-0.32, -0.11, 0.11, 0.32].forEach(kx => {
            g.fillRect(w * kx - 7, 0, 14, 8);
            g.fillRect(w * kx - 7, h * 0.22, 14, 8);
        });
    },

    // Shop recommendations: shopping bag with algorithm sparkle stars
    shop: (g, s, c) => {
        const w = s * 0.5;
        const h = s * 0.52;
        g.fillStyle(c, 0.16).fillRoundedRect(-w / 2, -h * 0.35, w, h, 6);
        g.lineStyle(2.5, c, 1).strokeRoundedRect(-w / 2, -h * 0.35, w, h, 6);
        g.lineStyle(2.5, c, 0.9);
        g.beginPath().arc(0, -h * 0.35, w * 0.3, Math.PI, 0, false).strokePath();
        g.fillStyle(lighten(c, 50), 1).fillCircle(0, h * 0.1, s * 0.07);
        g.lineStyle(1.5, lighten(c, 60), 1);
        g.lineBetween(-s * 0.12, h * 0.1, s * 0.12, h * 0.1);
        g.lineBetween(0, h * 0.1 - s * 0.12, 0, h * 0.1 + s * 0.12);
    },

    // Translation app: two language tiles with neural translation arrows
    translate: (g, s, c) => {
        const ts = s * 0.36;
        g.fillStyle(c, 0.2).fillRoundedRect(-s * 0.38, -s * 0.32, ts, ts, 6);
        g.lineStyle(2, c, 1).strokeRoundedRect(-s * 0.38, -s * 0.32, ts, ts, 6);
        g.fillStyle(c, 0.2).fillRoundedRect(s * 0.02, -s * 0.05, ts, ts, 6);
        g.lineStyle(2, c, 1).strokeRoundedRect(s * 0.02, -s * 0.05, ts, ts, 6);
        const ax = -s * 0.2;
        const ay = -s * 0.14;
        g.lineStyle(2, lighten(c, 50), 1);
        g.lineBetween(ax - 8, ay + 10, ax, ay - 10);
        g.lineBetween(ax, ay - 10, ax + 8, ay + 10);
        g.lineBetween(ax - 5, ay + 3, ax + 5, ay + 3);
        g.lineStyle(1.5, lighten(c, 40), 0.9);
        g.lineBetween(-s * 0.1, -s * 0.02, s * 0.1, -s * 0.02);
    }
};
