import Phaser from 'phaser';
import { UILayers, UIPositions, addText, type GameplayContext } from '../core';
import { lookColors } from './look';
import { channelColor, prefersReducedMotion, type Channel } from './channelTheme';
import { drawChannelIcon } from './channelIcons';

const REASON_OPTIONS: { channel: Channel; label: string; key: string }[] = [
    { channel: 'ai', label: 'Learns from data patterns', key: '1' },
    { channel: 'automation', label: 'Follows a fixed preset rule', key: '2' },
    { channel: 'manual', label: 'Needs a person to operate it', key: '3' }
];

/**
 * Realistic Tactical Classification Data-Cartridges (Levels 2-3).
 * Styled as cybernetic telemetry chips with gold contacts, keycaps, and circuit traces.
 */
export class ReasonChipPanel {
    private readonly objects: Phaser.GameObjects.GameObject[] = [];
    private readonly cartridgeGraphics = new Map<Channel, Phaser.GameObjects.Graphics>();
    private readonly onKeyDown: (event: KeyboardEvent) => void;
    private answered = false;

    constructor(private readonly ctx: GameplayContext, correctChannel: Channel, onAnswer: (correct: boolean) => void) {
        const { scene } = ctx;
        const { x: centerX, y: centerY } = UIPositions.center(scene);
        const y = centerY + 196;
        const reduced = prefersReducedMotion();

        const choose = (channel: Channel) => {
            if (this.answered) return;
            this.answered = true;
            const correct = channel === correctChannel;
            const g = this.cartridgeGraphics.get(channel)!;
            const strokeColor = correct ? lookColors.ledGreen : lookColors.ledCoral;

            // Flash cartridge border
            g.lineStyle(5, strokeColor, 1).strokeRoundedRect(-180, -48, 360, 96, 14);

            if (!reduced) {
                scene.tweens.add({ targets: g, scaleX: 1.05, scaleY: 1.05, duration: 130, yoyo: true, ease: 'Sine.easeOut' });
            }
            scene.time.delayedCall(reduced ? 140 : 420, () => onAnswer(correct));
        };

        // Header callout
        const promptBg = scene.add.graphics().setPosition(centerX, y - 76).setName('reasonChip.promptBg').setDepth(UILayers.GAME_EFFECTS);
        promptBg.fillStyle(lookColors.darkTitanium, 0.95).fillRoundedRect(-220, -18, 440, 36, 10);
        promptBg.lineStyle(1.5, lookColors.highlight, 0.7).strokeRoundedRect(-220, -18, 440, 36, 10);
        this.objects.push(promptBg);

        const promptText = addText(scene, 'reasonChip.prompt', centerX, y - 76, 'TELEMETRY DIAGNOSTIC  ·  CLASSIFY SIGNAL', { style: 'label', size: 18 })
            .setDepth(UILayers.GAME_EFFECTS).setColor('#44d9e8');
        this.objects.push(promptText);

        REASON_OPTIONS.forEach((option, index) => {
            const x = centerX + (index - 1) * 390;
            const name = `reasonChip.${option.channel}`;

            // Cartridge Graphic Chassis
            const g = scene.add.graphics().setPosition(x, y).setName(`${name}.chassis`).setDepth(UILayers.GAME_EFFECTS);
            this.drawCartridge(g, option.channel, false);
            this.cartridgeGraphics.set(option.channel, g);

            // Click hit area
            const hitZone = scene.add.zone(x, y, 360, 96).setName(`${name}.hitZone`).setDepth(UILayers.GAME_EFFECTS)
                .setInteractive({ useHandCursor: true });
            hitZone.on('pointerdown', () => choose(option.channel));
            hitZone.on('pointerover', () => { if (!this.answered) this.drawCartridge(g, option.channel, true); });
            hitZone.on('pointerout', () => { if (!this.answered) this.drawCartridge(g, option.channel, false); });

            // Category Mini Icon
            const iconG = scene.add.graphics().setPosition(x - 138, y).setName(`${name}.icon`).setDepth(UILayers.GAME_EFFECTS);
            iconG.fillStyle(lookColors.darkTitanium, 1).fillCircle(0, 0, 24);
            iconG.lineStyle(2, lookColors.highlight, 0.8).strokeCircle(0, 0, 24);
            drawChannelIcon[option.channel](iconG, 32, lookColors.highlight);

            // Reasoning Label
            const label = addText(scene, `${name}.label`, x - 100, y - 10, option.label, { style: 'body', size: 21 })
                .setOrigin(0, 0.5).setWordWrapWidth(210).setDepth(UILayers.GAME_EFFECTS);

            // Backlit Keycap Badge
            const keycap = scene.add.graphics().setPosition(x + 138, y).setName(`${name}.keycap`).setDepth(UILayers.GAME_EFFECTS);
            keycap.fillStyle(lookColors.panelHeader, 1).fillRoundedRect(-18, -18, 36, 36, 8);
            keycap.lineStyle(2, lookColors.highlight, 0.9).strokeRoundedRect(-18, -18, 36, 36, 8);
            const keyText = addText(scene, `${name}.key`, x + 138, y, option.key, { style: 'label', size: 20 })
                .setDepth(UILayers.GAME_EFFECTS).setColor('#ffffff');

            this.objects.push(g, hitZone, iconG, label, keycap, keyText);
        });

        this.onKeyDown = (event: KeyboardEvent) => {
            const option = REASON_OPTIONS[['1', '2', '3'].indexOf(event.key)];
            if (!option) return;
            event.preventDefault();
            choose(option.channel);
        };
        scene.input.keyboard?.on('keydown', this.onKeyDown);

        if (!reduced) {
            scene.tweens.add({ targets: this.objects, alpha: { from: 0, to: 1 }, duration: 240, ease: 'Sine.easeOut' });
        }
    }

    private drawCartridge(g: Phaser.GameObjects.Graphics, channel: Channel, hover: boolean) {
        g.clear();
        const tint = channelColor(channel);
        const stroke = hover ? tint : lookColors.cardBorder;
        const fillAlpha = hover ? 0.98 : 0.92;

        // Dark titanium body
        g.fillStyle(lookColors.darkTitanium, fillAlpha).fillRoundedRect(-180, -48, 360, 96, 14);
        g.lineStyle(3, stroke, 1).strokeRoundedRect(-180, -48, 360, 96, 14);
        g.lineStyle(1.5, tint, hover ? 0.9 : 0.4).strokeRoundedRect(-175, -43, 350, 86, 10);

        // Gold PCB contact pins along left edge
        g.fillStyle(lookColors.ledAmber, 0.9);
        [-24, -10, 4, 18].forEach(py => {
            g.fillRect(-178, py, 6, 8);
        });
    }

    destroy() {
        this.ctx.scene.input.keyboard?.off('keydown', this.onKeyDown);
        this.objects.forEach(object => object.destroy());
        this.objects.length = 0;
        this.cartridgeGraphics.clear();
    }
}
