import Phaser from 'phaser';
import { UILayers, UIPositions, addText, type GameplayContext } from '../core';
import { lookColors } from './look';
import { prefersReducedMotion } from './channelTheme';
import { drawSignalIcon } from './signalIcons';

const CARD_WIDTH = 480;
const CARD_HEIGHT = 300;
const SCOPE_RADIUS = 72;

export interface SignalCardData {
    label: string;
    icon: string;
    district: string;
}

export class SignalCardView {
    readonly container: Phaser.GameObjects.Container;
    private readonly breathTween: Phaser.Tweens.Tween | null;
    private readonly sweepTween: Phaser.Tweens.Tween | null;

    constructor(ctx: GameplayContext, signal: SignalCardData) {
        const { scene } = ctx;
        const { x: centerX, y: centerY } = UIPositions.center(scene);
        const reduced = prefersReducedMotion();

        // 1. Realistic soft card drop shadow & outer aura
        const glowOuter = scene.add.graphics().setName('signalCard.glowOuter');
        [{ pad: 36, alpha: 0.04 }, { pad: 18, alpha: 0.08 }, { pad: 6, alpha: 0.14 }].forEach(ring => {
            glowOuter.fillStyle(lookColors.highlight, ring.alpha);
            glowOuter.fillRoundedRect(
                -(CARD_WIDTH + ring.pad) / 2, -(CARD_HEIGHT + ring.pad) / 2,
                CARD_WIDTH + ring.pad, CARD_HEIGHT + ring.pad, 26
            );
        });
        this.breathTween = reduced ? null : scene.tweens.add({
            targets: glowOuter, alpha: { from: 0.5, to: 0.8 }, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // 2. Main Physical Card Chassis (Clean card stock / matte titanium finish)
        const bg = scene.add.graphics().setName('signalCard.bg');
        bg.fillStyle(lookColors.card, 0.98).fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 22);
        
        // Subtle inner framing and dual-tone border for physical thickness feel
        bg.lineStyle(2, lookColors.cardBorder, 0.9).strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 22);
        bg.lineStyle(1.5, lookColors.highlight, 0.75).strokeRoundedRect(-CARD_WIDTH / 2 + 5, -CARD_HEIGHT / 2 + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10, 17);

        // Minimalist corner notches / security stamps for collectible card realism
        const cr = 14;
        const co = 12;
        bg.lineStyle(2, lookColors.signalPulse, 0.8);
        [
            [-CARD_WIDTH / 2 + co, -CARD_HEIGHT / 2 + co, 1, 1],
            [CARD_WIDTH / 2 - co, -CARD_HEIGHT / 2 + co, -1, 1],
            [-CARD_WIDTH / 2 + co, CARD_HEIGHT / 2 - co, 1, -1],
            [CARD_WIDTH / 2 - co, CARD_HEIGHT / 2 - co, -1, -1]
        ].forEach(([cx, cy, dx, dy]) => {
            bg.lineBetween(cx, cy, cx + dx * cr, cy);
            bg.lineBetween(cx, cy, cx, cy + dy * cr);
        });

        // 3. Central Sensor Well (Holographic Projection Well)
        const wellY = -48;
        const iconRing = scene.add.graphics().setPosition(0, wellY).setName('signalCard.iconRing');
        iconRing.fillStyle(lookColors.darkTitanium, 1).fillCircle(0, 0, SCOPE_RADIUS + 6);
        iconRing.lineStyle(2.5, lookColors.highlight, 0.85).strokeCircle(0, 0, SCOPE_RADIUS + 6);
        iconRing.lineStyle(1.5, lookColors.cardBorder, 0.8).strokeCircle(0, 0, SCOPE_RADIUS - 2);

        // Degree calibration ticks
        iconRing.lineStyle(1.5, lookColors.highlight, 0.7);
        for (let deg = 0; deg < 360; deg += 30) {
            const rad = Phaser.Math.DegToRad(deg);
            const len = deg % 90 === 0 ? 6 : 3;
            const r1 = SCOPE_RADIUS + 6;
            const r2 = r1 + len;
            iconRing.lineBetween(Math.cos(rad) * r1, Math.sin(rad) * r1, Math.cos(rad) * r2, Math.sin(rad) * r2);
        }

        // Rotating radar sweep
        const iconSweep = scene.add.graphics().setPosition(0, wellY).setName('signalCard.iconSweep');
        iconSweep.fillStyle(lookColors.highlight, 0.2);
        iconSweep.beginPath();
        iconSweep.slice(0, 0, SCOPE_RADIUS, 0, Phaser.Math.DegToRad(55), false);
        iconSweep.fillPath();
        this.sweepTween = reduced ? null : scene.tweens.add({
            targets: iconSweep, angle: 360, duration: 3200, repeat: -1, ease: 'Linear'
        });

        // Procedural crisp vector icon in the center
        const iconArt = scene.add.graphics().setPosition(0, wellY).setName('signalCard.iconArt');
        drawSignalIcon(iconArt, signal.icon, 80, lookColors.highlight);

        // 4. Primary Card Title / Label
        const label = addText(scene, 'signalCard.label', 0, 62, signal.label, { style: 'heading', size: 30 })
            .setWordWrapWidth(420).setAlign('center');

        this.container = scene.add.container(centerX, centerY - 40, [
            glowOuter, bg,
            iconRing, iconSweep, iconArt, label
        ]).setName('signalCard').setSize(CARD_WIDTH, CARD_HEIGHT).setDepth(UILayers.GAME_PLAYER).setInteractive({ useHandCursor: true });

        scene.input.setDraggable(this.container);
    }

    destroy() {
        this.breathTween?.remove();
        this.sweepTween?.remove();
        this.container.destroy();
    }
}