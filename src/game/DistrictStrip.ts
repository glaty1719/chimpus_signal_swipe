import Phaser from 'phaser';
import { UILayers, UIPositions, addText, type GameplayContext } from '../core';
import { lookColors } from './look';
import { prefersReducedMotion } from './channelTheme';

const PIP_WIDTH = 106;
const PIP_HEIGHT = 44;

function drawDetailedSkyline(g: Phaser.GameObjects.Graphics, color: number, alpha: number, lit: boolean) {
    // Multi-tier skyscraper cluster
    const buildings = [
        { x: -36, w: 14, h: 18 },
        { x: -18, w: 16, h: 26 },
        { x: 2, w: 18, h: 32 }, // Central high tower
        { x: 24, w: 14, h: 20 }
    ];

    buildings.forEach(b => {
        g.fillStyle(color, alpha);
        g.fillRoundedRect(b.x, PIP_HEIGHT / 2 - b.h - 5, b.w, b.h, 2);
        if (lit) {
            // Glowing window grid on lit towers
            g.fillStyle(0xffffff, 0.85);
            g.fillRect(b.x + 3, PIP_HEIGHT / 2 - b.h, 3, 3);
            g.fillRect(b.x + 8, PIP_HEIGHT / 2 - b.h, 3, 3);
            g.fillRect(b.x + 3, PIP_HEIGHT / 2 - b.h + 6, 3, 3);
            g.fillRect(b.x + 8, PIP_HEIGHT / 2 - b.h + 6, 3, 3);
        }
    });

    // Antenna on central high tower
    g.lineStyle(1.5, color, alpha);
    g.lineBetween(11, PIP_HEIGHT / 2 - 32 - 5, 11, PIP_HEIGHT / 2 - 32 - 12);
    // Beacon dot
    g.fillStyle(lit ? 0xff4757 : color, lit ? 1 : 0.6).fillCircle(11, PIP_HEIGHT / 2 - 32 - 12, 2.5);
}

function drawUnlitPip(g: Phaser.GameObjects.Graphics) {
    g.clear();
    // Dark titanium chassis
    g.fillStyle(lookColors.darkTitanium, 0.95).fillRoundedRect(-PIP_WIDTH / 2, -PIP_HEIGHT / 2, PIP_WIDTH, PIP_HEIGHT, 10);
    g.lineStyle(2, lookColors.cardBorder, 0.9).strokeRoundedRect(-PIP_WIDTH / 2, -PIP_HEIGHT / 2, PIP_WIDTH, PIP_HEIGHT, 10);
    g.lineStyle(1, lookColors.highlight, 0.3).strokeRoundedRect(-PIP_WIDTH / 2 + 2, -PIP_HEIGHT / 2 + 2, PIP_WIDTH - 4, PIP_HEIGHT - 4, 8);
    drawDetailedSkyline(g, lookColors.highlight, 0.35, false);
}

function drawLitPip(g: Phaser.GameObjects.Graphics, color: number) {
    g.clear();
    // Energized chassis
    g.fillStyle(lookColors.darkTitanium, 0.98).fillRoundedRect(-PIP_WIDTH / 2, -PIP_HEIGHT / 2, PIP_WIDTH, PIP_HEIGHT, 10);
    // Glowing neon border & inner wash
    g.lineStyle(3, color, 1).strokeRoundedRect(-PIP_WIDTH / 2, -PIP_HEIGHT / 2, PIP_WIDTH, PIP_HEIGHT, 10);
    g.fillStyle(color, 0.22).fillRoundedRect(-PIP_WIDTH / 2 + 3, -PIP_HEIGHT / 2 + 3, PIP_WIDTH - 6, PIP_HEIGHT - 6, 8);
    drawDetailedSkyline(g, color, 1, true);
}

/**
 * Realistic City District Telemetry Console.
 * Shows active grid power and skyline activation for each district.
 */
export class DistrictStrip {
    private readonly pips = new Map<string, Phaser.GameObjects.Graphics>();
    private readonly labels = new Map<string, Phaser.GameObjects.Text>();
    private readonly lit = new Set<string>();
    private readonly objects: Phaser.GameObjects.GameObject[] = [];
    readonly size: number;
    caption: Phaser.GameObjects.Text;

    constructor(private readonly ctx: GameplayContext, districts: string[]) {
        const { scene } = ctx;
        const { x: centerX } = UIPositions.center(scene);
        const { height } = scene.scale;
        this.size = districts.length;

        // Header caption with status HUD
        this.caption = addText(scene, 'districtProgress', centerX, height - 264, 'CITY DISTRICT GRID // TELEMETRY', { style: 'label', size: 20 })
            .setDepth(UILayers.GAME_ITEMS).setColor('#44d9e8');
        this.objects.push(this.caption);

        const spacing = Math.min(132, 1100 / Math.max(1, districts.length));
        districts.forEach((district, index) => {
            const x = centerX + (index - (districts.length - 1) / 2) * spacing;
            const y = height - 216;

            const pip = scene.add.graphics().setPosition(x, y)
                .setName(`district.${district}`).setDepth(UILayers.GAME_ITEMS);
            drawUnlitPip(pip);

            const label = addText(scene, `district.${district}.label`, x, y + 36, district.toUpperCase(), { style: 'label', size: 16 })
                .setDepth(UILayers.GAME_ITEMS).setAlpha(0.85);

            this.pips.set(district, pip);
            this.labels.set(district, label);
            this.objects.push(pip, label);
        });
    }

    light(district: string, color: number) {
        const pip = this.pips.get(district);
        if (!pip || this.lit.has(district)) return;
        this.lit.add(district);
        drawLitPip(pip, color);
        const hexColor = Phaser.Display.Color.IntegerToColor(color).rgba;
        this.labels.get(district)?.setColor(hexColor).setAlpha(1);

        if (prefersReducedMotion()) return;
        this.ctx.scene.tweens.add({ targets: pip, scaleX: 1.15, scaleY: 1.15, duration: 150, yoyo: true, ease: 'Back.easeOut' });
        this.spawnSparks(pip.x, pip.y, color);
    }

    private spawnSparks(x: number, y: number, color: number) {
        const { scene } = this.ctx;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const spark = scene.add.graphics().setPosition(x, y)
                .setName(`districtSpark.${x}.${i}`).setDepth(UILayers.GAME_EFFECTS);
            spark.fillStyle(color, 0.8).fillCircle(0, 0, 5);
            spark.fillStyle(0xffffff, 1).fillCircle(0, 0, 2);
            scene.tweens.add({
                targets: spark, x: x + Math.cos(angle) * 36, y: y + Math.sin(angle) * 36, alpha: 0, scale: 1.8,
                duration: 420, ease: 'Sine.easeOut', onComplete: () => spark.destroy()
            });
        }
    }

    destroy() {
        this.objects.forEach(object => object.destroy());
        this.objects.length = 0;
    }
}
