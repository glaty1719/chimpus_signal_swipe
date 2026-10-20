import Phaser from 'phaser';
import type { Channel } from './channelTheme';

function lighten(color: number, amount: number): number {
    return Phaser.Display.Color.IntegerToColor(color).lighten(amount).color;
}

/** Rotated rectangle corners: `length` runs along the rotated axis, `width` is perpendicular to it. */
function rotatedRectPoints(cx: number, cy: number, length: number, width: number, angle: number) {
    const hl = length / 2;
    const hw = width / 2;
    const local = [{ x: -hl, y: -hw }, { x: hl, y: -hw }, { x: hl, y: hw }, { x: -hl, y: hw }];
    return local.map(p => ({
        x: cx + p.x * Math.cos(angle) - p.y * Math.sin(angle),
        y: cy + p.x * Math.sin(angle) + p.y * Math.cos(angle)
    }));
}

/** AI channel: an 8-point sparkle with a brighter center glint. */
export function drawSparkleIcon(g: Phaser.GameObjects.Graphics, size: number, color: number) {
    const outer = size / 2;
    const inner = outer * 0.38;
    const points = Array.from({ length: 8 }, (_, i) => {
        const angle = (Math.PI / 4) * i - Math.PI / 2;
        const radius = i % 2 === 0 ? outer : inner;
        return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
    g.fillStyle(color, 1);
    g.fillPoints(points, true);
    g.fillStyle(lighten(color, 65), 0.9);
    g.fillCircle(0, 0, outer * 0.16);
}

/** Fixed Automation channel: a gear ring around a small clock face. */
export function drawGearClockIcon(g: Phaser.GameObjects.Graphics, size: number, color: number) {
    const radius = size * 0.4;
    const toothLength = size * 0.16;
    const toothWidth = size * 0.1;
    g.lineStyle(size * 0.07, color, 1);
    g.strokeCircle(0, 0, radius);
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i;
        const toothCenterRadius = radius + toothLength / 2;
        const cx = Math.cos(angle) * toothCenterRadius;
        const cy = Math.sin(angle) * toothCenterRadius;
        g.fillStyle(color, 1);
        g.fillPoints(rotatedRectPoints(cx, cy, toothLength, toothWidth, angle), true);
    }
    const faceRadius = radius * 0.5;
    g.lineStyle(size * 0.045, color, 0.85);
    g.strokeCircle(0, 0, faceRadius);
    g.lineStyle(size * 0.06, color, 1);
    g.lineBetween(0, 0, 0, -faceRadius * 0.62);
    g.lineBetween(0, 0, faceRadius * 0.42, faceRadius * 0.14);
}

/** Manual Tool channel: a palm with four fanned fingers and an angled thumb. */
export function drawHandIcon(g: Phaser.GameObjects.Graphics, size: number, color: number) {
    const palmWidth = size * 0.5;
    const palmHeight = size * 0.4;
    const palmTop = size * 0.04;
    g.fillStyle(color, 1);
    g.fillRoundedRect(-palmWidth / 2, palmTop, palmWidth, palmHeight, palmWidth * 0.3);

    const fingerWidth = size * 0.1;
    const fingerLength = size * 0.42;
    const tilts = [-0.26, -0.09, 0.09, 0.26];
    tilts.forEach((tilt, index) => {
        const spacing = palmWidth / (tilts.length + 1);
        const baseX = -palmWidth / 2 + spacing * (index + 1);
        const angle = -Math.PI / 2 + tilt;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const cx = baseX + dx * fingerLength / 2;
        const cy = palmTop + dy * fingerLength / 2;
        g.fillPoints(rotatedRectPoints(cx, cy, fingerLength, fingerWidth, angle), true);
    });

    const thumbLength = size * 0.3;
    const thumbAngle = Math.PI - 0.6;
    const thumbDx = Math.cos(thumbAngle);
    const thumbDy = Math.sin(thumbAngle);
    const thumbCx = -palmWidth / 2 + thumbDx * thumbLength / 2;
    const thumbCy = palmTop + palmHeight * 0.25 + thumbDy * thumbLength / 2;
    g.fillPoints(rotatedRectPoints(thumbCx, thumbCy, thumbLength, fingerWidth * 1.1, thumbAngle), true);
}

export const drawChannelIcon: Record<Channel, (g: Phaser.GameObjects.Graphics, size: number, color: number) => void> = {
    ai: drawSparkleIcon,
    automation: drawGearClockIcon,
    manual: drawHandIcon
};
