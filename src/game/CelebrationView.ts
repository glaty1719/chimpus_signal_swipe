import Phaser from 'phaser';
import { UILayers, UIPositions, addText, type GameplayContext } from '../core';
import { lookColors } from './look';
import { prefersReducedMotion } from './channelTheme';
import { drawChannelIcon } from './channelIcons';

const BADGES = [
    { id: 'aiSpotter', title: 'AI SPOTTER', channel: 'ai' as const, color: lookColors.highlight },
    { id: 'automationSpotter', title: 'AUTOMATION SPOTTER', channel: 'automation' as const, color: lookColors.sliderFill },
    { id: 'featureDetective', title: 'FEATURE DETECTIVE', channel: 'manual' as const, color: lookColors.cardHover }
];

/**
 * High-Tech Tactical Debriefing & Badge Celebration.
 * Displays holographic city grid status and metallic insignia medals.
 */
export class CelebrationView {
    private readonly objects: Phaser.GameObjects.GameObject[] = [];
    private timer: Phaser.Time.TimerEvent | null = null;
    private shown = false;

    constructor(private readonly ctx: GameplayContext, private readonly districts: string[], private readonly finalLevel: boolean) {}

    show(stars: number, onComplete: () => void) {
        if (this.shown) return;
        this.shown = true;
        const { scene } = this.ctx;
        const { x, y } = UIPositions.center(scene);
        const width = Math.min(1480, scene.scale.width - 120);
        const reduced = prefersReducedMotion();

        // 1. Holographic darkened scrim
        this.add(scene.add.rectangle(x, y, scene.scale.width, scene.scale.height, lookColors.overlay, 0.9)
            .setName('celebration.scrim').setDepth(UILayers.GAME_EFFECTS));

        // 2. High-Tech Glassmorphic Debriefing Terminal Panel
        const panelG = scene.add.graphics().setPosition(x, y).setName('celebration.panelG').setDepth(UILayers.GAME_EFFECTS);
        // Titanium base chassis
        panelG.fillStyle(lookColors.darkTitanium, 0.98).fillRoundedRect(-width / 2, -410, width, 820, 24);
        panelG.lineStyle(4, lookColors.highlight, 0.9).strokeRoundedRect(-width / 2, -410, width, 820, 24);
        panelG.lineStyle(1.5, lookColors.cardBorder, 0.8).strokeRoundedRect(-width / 2 + 8, -402, width - 16, 804, 18);

        // Header telemetry strip
        panelG.fillStyle(lookColors.panelHeader, 0.9).fillRoundedRect(-width / 2 + 10, -400, width - 20, 64, { tl: 16, tr: 16, bl: 0, br: 0 });
        this.add(panelG);

        this.add(addText(scene, 'celebration.title', x, y - 368, this.finalLevel ? 'SIGNAL MAP // FULL TRANSMISSION RESTORED' : 'DISTRICT SECTOR // ENERGIZED', { style: 'title', size: 34 })
            .setDepth(UILayers.GAME_EFFECTS).setColor('#44d9e8'));
        this.add(addText(scene, 'celebration.subtitle', x, y - 300,
            this.finalLevel ? 'ALL AI SIGNALS ACCURATELY CLASSIFIED AND ROUTED' : 'EXCELLENT ROUTING TELEMETRY · CITY POWER GRID ACTIVE', { style: 'heading', size: 24 })
            .setDepth(UILayers.GAME_EFFECTS));

        // 3. Holographic District Array
        this.add(addText(scene, 'celebration.mapTitle', x, y - 235,
            this.finalLevel ? 'GLOBAL CITY DISTRICT GRID // 100% OPERATIONAL' : 'ACTIVE DISTRICT SECTORS MAPPED', { style: 'label', size: 18 })
            .setDepth(UILayers.GAME_EFFECTS).setColor('#f0b429'));

        const gap = Math.min(160, (width - 200) / Math.max(1, this.districts.length));
        this.districts.forEach((district, index) => {
            const px = x + (index - (this.districts.length - 1) / 2) * gap;
            const py = y - 160;

            const pip = scene.add.graphics().setPosition(px, py).setName(`celebration.map.${district}`).setDepth(UILayers.GAME_EFFECTS);
            pip.fillStyle(lookColors.panelHeader, 1).fillRoundedRect(-44, -26, 88, 52, 10);
            pip.lineStyle(2, lookColors.highlight, 1).strokeRoundedRect(-44, -26, 88, 52, 10);
            pip.fillStyle(lookColors.highlight, 0.25).fillRoundedRect(-40, -22, 80, 44, 8);
            // Window dots
            pip.fillStyle(0xffffff, 0.9);
            [-16, 0, 16].forEach(wx => {
                pip.fillRect(wx - 4, -8, 8, 14);
            });
            this.add(pip);

            this.add(addText(scene, `celebration.map.${district}.label`, px, py + 42, district.toUpperCase(), { style: 'label', size: 16 })
                .setDepth(UILayers.GAME_EFFECTS).setColor('#44d9e8'));
        });

        // 4. Medals / Badges
        this.add(addText(scene, 'celebration.chipsTitle', x, y - 56, 'FIELD BADGES RECOGNIZED', { style: 'heading', size: 24 })
            .setDepth(UILayers.GAME_EFFECTS));

        BADGES.forEach((badge, index) => {
            const bx = x + (index - 1) * Math.min(420, width * 0.31);
            const by = y + 36;

            const badgeG = scene.add.graphics().setPosition(bx, by).setName(`celebration.badge.${badge.id}.bg`).setDepth(UILayers.GAME_EFFECTS);
            badgeG.fillStyle(lookColors.darkTitanium, 1).fillCircle(0, 0, 46);
            badgeG.lineStyle(4, badge.color, 1).strokeCircle(0, 0, 46);
            badgeG.lineStyle(2, lookColors.signalPulse, 0.7).strokeCircle(0, 0, 40);
            badgeG.fillStyle(badge.color, 0.2).fillCircle(0, 0, 38);
            drawChannelIcon[badge.channel](badgeG, 44, badge.color);
            this.add(badgeG);

            this.add(addText(scene, `celebration.badge.${badge.id}.label`, bx, by + 68, badge.title, { style: 'label', size: 18 })
                .setDepth(UILayers.GAME_EFFECTS).setColor(Phaser.Display.Color.IntegerToColor(badge.color).rgba));
        });

        // 5. Star Performance Rating
        const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        const resultText = this.finalLevel
            ? `SIGNAL MASTER BADGE AWARDED  ·  ${starStr}`
            : `SECTOR SORTING COMPLETE  ·  ${starStr}`;

        this.add(addText(scene, 'celebration.stars', x, y + 240, resultText, { style: 'heading', size: 28 })
            .setDepth(UILayers.GAME_EFFECTS).setColor('#3ddc84'));

        if (this.finalLevel) this.ctx.audio.playSFX('badgeEarned');

        if (!reduced) {
            scene.tweens.add({ targets: this.objects, alpha: { from: 0, to: 1 }, duration: 320, ease: 'Sine.easeOut' });
        }

        this.timer = scene.time.delayedCall(reduced ? 1400 : 2400, () => {
            this.timer = null;
            onComplete();
        });
    }

    destroy() {
        this.timer?.remove(false);
        this.timer = null;
        this.objects.forEach(object => object.destroy());
        this.objects.length = 0;
    }

    private add<T extends Phaser.GameObjects.GameObject>(object: T): T {
        this.objects.push(object);
        return object;
    }
}
