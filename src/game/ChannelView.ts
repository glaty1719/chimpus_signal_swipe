import Phaser from 'phaser';
import { IconButton, UILayers, UIPositions, addText, type GameplayContext } from '../core';
import { CHANNELS, channelColor, prefersReducedMotion, type Channel } from './channelTheme';
import { drawChannelIcon } from './channelIcons';
import { lookColors } from './look';

export interface ChannelSlot {
    readonly x: number;
    readonly y: number;
    width: number;
    height: number;
    box: Phaser.GameObjects.Container;
}

const CHANNEL_COPY: Record<Channel, { label: string; description: string; shortcut: string; chevrons: string }> = {
    automation: { label: 'FIXED\nAUTOMATION', description: 'Follows a\nfixed rule', shortcut: '← / A', chevrons: '◀ ◀ ◀' },
    ai: { label: 'AI\nFEATURE', description: 'Learns\nfrom data', shortcut: '→ / D', chevrons: '▶ ▶ ▶' },
    manual: { label: 'MANUAL OVERRIDE', description: 'Needs a person', shortcut: '↓ / S', chevrons: '▼  ▼  ▼' }
};

/**
 * Realistic High-Tech Intake Conduits for AI, Automation, and Manual sorting.
 * Features industrial housing, directional energy chevrons, and tactile keycaps.
 */
export class ChannelView {
    readonly slots = {} as Record<Channel, ChannelSlot>;
    private readonly objects: Phaser.GameObjects.Container[] = [];
    private readonly cautionRings = {} as Record<Channel, Phaser.GameObjects.Graphics>;
    private readonly successRings = {} as Record<Channel, Phaser.GameObjects.Graphics>;
    private readonly timers = new Set<Phaser.Time.TimerEvent>();
    private readonly buttons: IconButton[] = [];
    private readonly textureKeys: string[] = [];

    constructor(private readonly ctx: GameplayContext, onRoute: (channel: Channel) => void) {
        const { scene } = ctx;
        const { width, height } = scene.scale;
        const { x: centerX, y: centerY } = UIPositions.center(scene);
        const edgeInset = Math.max(20, width * 0.012);
        const sideWidth = Math.min(204, width * 0.1);
        const sideHeight = Math.min(height * 0.8, height - Math.max(200, height * 0.18) * 2);
        const bottomHeight = Math.min(130, height * 0.12);

        const layouts: Record<Channel, { x: number; y: number; width: number; height: number }> = {
            automation: { x: edgeInset + sideWidth / 2, y: centerY, width: sideWidth, height: sideHeight },
            ai: { x: width - edgeInset - sideWidth / 2, y: centerY, width: sideWidth, height: sideHeight },
            manual: { x: centerX, y: height - edgeInset - bottomHeight / 2, width: width * 0.8, height: bottomHeight }
        };

        CHANNELS.forEach(({ id }) => {
            const layout = layouts[id];
            const tint = channelColor(id);
            const name = `channel.${id}`;
            const box = scene.add.container(layout.x, layout.y).setName(name)
                .setSize(layout.width, layout.height).setDepth(UILayers.GAME_ITEMS);

            // Layered Outer Neon Glow Conduits
            const glow = scene.add.graphics().setName(`${name}.glow`);
            [32, 16, 4].forEach((pad, index) => {
                glow.fillStyle(tint, index === 0 ? 0.04 : index === 1 ? 0.08 : 0.15).fillRoundedRect(
                    -(layout.width + pad) / 2, -(layout.height + pad) / 2,
                    layout.width + pad, layout.height + pad, 26
                );
            });
            glow.setAlpha(0.65);

            const caution = this.createRing(`${name}.cautionRing`, layout.width, layout.height, lookColors.caution);
            const success = this.createRing(`${name}.successRing`, layout.width, layout.height, lookColors.success);

            const texture = this.createTexture(id, layout.width, layout.height, tint);
            const button = new IconButton(scene, `${name}.button`, 0, 0, texture, () => onRoute(id));

            const surface = scene.add.container(0, 0, [button.sprite]).setName(`${name}.surface`)
                .setScale(layout.width / button.sprite.width, layout.height / button.sprite.height);

            box.add([glow, caution, success, surface]);
            this.buttons.push(button);
            this.addContent(box, id, layout.width, layout.height, tint);

            const breath = prefersReducedMotion() ? null : scene.tweens.add({
                targets: glow, alpha: { from: 0.5, to: 0.8 }, duration: 2200,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
            button.sprite.on('pointerover', () => { breath?.pause(); glow.setAlpha(1); });
            button.sprite.on('pointerout', () => { glow.setAlpha(0.65); breath?.resume(); });

            this.slots[id] = {
                get x() { return box.x; }, get y() { return box.y; },
                width: layout.width, height: layout.height, box
            };
            this.cautionRings[id] = caution;
            this.successRings[id] = success;
            this.objects.push(box);
        });
    }

    private createRing(name: string, width: number, height: number, color: number) {
        const ring = this.ctx.scene.add.graphics().setName(name).setAlpha(0);
        ring.lineStyle(6, color, 1).strokeRoundedRect(-width / 2 - 8, -height / 2 - 8, width + 16, height + 16, 26);
        ring.lineStyle(2, lookColors.signalPulse, 0.8).strokeRoundedRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4, 22);
        return ring;
    }

    private createTexture(channel: Channel, width: number, height: number, tint: number) {
        const { scene } = this.ctx;
        const key = `signalChannel.${channel}.${Math.ceil(width)}x${Math.ceil(height)}`;
        const art = scene.add.graphics().setName(`channel.${channel}.textureSource`);

        // Heavy dark titanium housing
        art.fillStyle(lookColors.darkTitanium, 0.98).fillRoundedRect(3, 3, width - 6, height - 6, 22);
        // Recessed inner intake well with subtle channel tint
        art.fillStyle(lookColors.panelHeader, 0.85).fillRoundedRect(10, 10, width - 20, height - 20, 16);
        art.fillStyle(tint, 0.12).fillRoundedRect(12, 12, width - 24, height - 24, 14);

        // Tech grid lines inside the well
        art.lineStyle(1, tint, 0.2);
        if (channel === 'manual') {
            for (let gx = 24; gx < width - 24; gx += 40) {
                art.lineBetween(gx, 14, gx, height - 14);
            }
        } else {
            for (let gy = 24; gy < height - 24; gy += 40) {
                art.lineBetween(14, gy, width - 14, gy);
            }
        }

        // Heavy metallic chassis rim & glowing neon inner border
        art.lineStyle(3, lookColors.cardBorder, 1).strokeRoundedRect(3, 3, width - 6, height - 6, 22);
        art.lineStyle(2, tint, 0.9).strokeRoundedRect(8, 8, width - 16, height - 16, 18);

        // Active intake aperture slit facing toward center screen
        if (channel === 'manual') {
            // Intake opening at top edge
            art.fillStyle(tint, 0.9).fillRoundedRect(width * 0.32, 8, width * 0.36, 5, 2.5);
            art.fillStyle(lookColors.signalPulse, 0.6).fillRoundedRect(width * 0.42, 9, width * 0.16, 3, 1.5);
        } else if (channel === 'automation') {
            // Intake opening on right edge facing center
            art.fillStyle(tint, 0.9).fillRoundedRect(width - 13, height * 0.32, 5, height * 0.36, 2.5);
            art.fillStyle(lookColors.signalPulse, 0.6).fillRoundedRect(width - 12, height * 0.42, 3, height * 0.16, 1.5);
        } else {
            // Intake opening on left edge facing center
            art.fillStyle(tint, 0.9).fillRoundedRect(8, height * 0.32, 5, height * 0.36, 2.5);
            art.fillStyle(lookColors.signalPulse, 0.6).fillRoundedRect(9, height * 0.42, 3, height * 0.16, 1.5);
        }

        art.generateTexture(key, Math.ceil(width), Math.ceil(height));
        art.destroy();
        this.textureKeys.push(key);
        return key;
    }

    private addContent(box: Phaser.GameObjects.Container, channel: Channel, width: number, height: number, tint: number) {
        const { scene } = this.ctx;
        const horizontal = channel === 'manual';
        const name = `channel.${channel}`;
        const copy = CHANNEL_COPY[channel];

        // 1. Embossed Circular Icon Well
        const iconX = horizontal ? -width * 0.34 : 0;
        const iconY = horizontal ? 0 : -130;
        const iconBezel = scene.add.graphics().setPosition(iconX, iconY).setName(`${name}.iconBezel`);
        iconBezel.fillStyle(lookColors.darkTitanium, 1).fillCircle(0, 0, 48);
        iconBezel.lineStyle(3, tint, 0.9).strokeCircle(0, 0, 48);
        iconBezel.lineStyle(1.5, lookColors.cardBorder, 0.8).strokeCircle(0, 0, 44);
        iconBezel.fillStyle(tint, 0.18).fillCircle(0, 0, 42);
        drawChannelIcon[channel](iconBezel, 60, tint);

        // 2. Directional Chevrons
        const chevX = horizontal ? -width * 0.22 : 0;
        const chevY = horizontal ? 0 : -62;
        const chevrons = addText(scene, `${name}.chevrons`, chevX, chevY, copy.chevrons, { style: 'label', size: 16 })
            .setColor(Phaser.Display.Color.IntegerToColor(tint).rgba).setAlpha(0.85);

        // 3. Category Label & Description
        const label = addText(scene, `${name}.label`, horizontal ? -width * 0.04 : 0, horizontal ? -14 : -12,
            copy.label, { style: 'label', size: horizontal ? 28 : 24 })
            .setAlign('center').setWordWrapWidth(horizontal ? width * 0.28 : width - 24);

        const description = addText(scene, `${name}.description`, horizontal ? -width * 0.04 : 0, horizontal ? 20 : 62,
            copy.description, { style: 'body', size: horizontal ? 20 : 22 }).setAlign('center').setAlpha(0.85);

        // 4. Backlit Tactile Keycap Badge
        const keyX = horizontal ? width * 0.32 : 0;
        const keyY = horizontal ? 0 : height / 2 - 58;
        const keycap = scene.add.graphics().setPosition(keyX, keyY).setName(`${name}.keycap`);
        // Keycap chassis
        keycap.fillStyle(lookColors.darkTitanium, 1).fillRoundedRect(-56, -24, 112, 48, 12);
        keycap.lineStyle(2, tint, 0.8).strokeRoundedRect(-56, -24, 112, 48, 12);
        keycap.fillStyle(tint, 0.15).fillRoundedRect(-52, -20, 104, 40, 9);

        const shortcut = addText(scene, `${name}.shortcut`, keyX, keyY, copy.shortcut, { style: 'label', size: 24 });

        box.add([iconBezel, chevrons, label, description, keycap, shortcut]);
    }

    /** Match the entire visible rail, including its position after an inspector adjustment. */
    channelAt(x: number, y: number): Channel | undefined {
        return CHANNELS.find(({ id }) => {
            const slot = this.slots[id];
            const local = slot.box.getWorldTransformMatrix().applyInverse(x, y);
            return Math.abs(local.x) <= slot.width / 2 && Math.abs(local.y) <= slot.height / 2;
        })?.id;
    }

    private flash(ring: Phaser.GameObjects.Graphics, duration: number, repeat = 0) {
        const { scene } = this.ctx;
        scene.tweens.killTweensOf(ring);
        ring.setAlpha(0);
        if (prefersReducedMotion()) {
            ring.setAlpha(0.9);
            const timer = scene.time.delayedCall(180, () => { ring.setAlpha(0); this.timers.delete(timer); });
            this.timers.add(timer);
            return;
        }
        scene.tweens.add({ targets: ring, alpha: 1, duration, repeat, yoyo: true, ease: 'Sine.easeInOut' });
    }

    pulse(channel: Channel) { this.flash(this.cautionRings[channel], 180, 2); }

    celebrate(channel: Channel) { this.flash(this.successRings[channel], 130); }

    destroy() {
        this.timers.forEach(timer => timer.remove(false));
        this.timers.clear();
        this.buttons.forEach(button => button.destroy());
        this.buttons.length = 0;
        this.objects.forEach(box => {
            this.ctx.scene.tweens.killTweensOf([box, ...box.getAll()]);
            box.destroy();
        });
        this.objects.length = 0;
        this.textureKeys.forEach(key => this.ctx.scene.textures.remove(key));
    }
}
