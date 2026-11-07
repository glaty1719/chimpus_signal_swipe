import Phaser, {Scene} from 'phaser';
import {TILE_SIZE} from '../config.ts';

export interface MysteryBoxConfig {
    scene: Scene;
    x: number;
    y: number;
    level: number;
    id: string;
}

export class MysteryBox {
    scene: Scene;
    x: number;
    y: number;
    level: number;
    id: string;
    container: Phaser.GameObjects.Container;
    isTriggered: boolean = false;
    #hoverTween?: Phaser.Tweens.Tween;
    #pulseTween?: Phaser.Tweens.Tween;

    constructor(config: MysteryBoxConfig) {
        this.scene = config.scene;
        this.x = config.x;
        this.y = config.y;
        this.level = config.level;
        this.id = config.id;

        this.container = this.scene.add.container(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2);
        this.container.setDepth(3);

        this.#buildVisuals();
        this.#startAnimations();
    }

    #buildVisuals() {
        // Shadow on ground
        const shadow = this.scene.add.ellipse(0, 18, 42, 16, 0x000000, 0.45);

        // Box colors based on level
        const levelColors = [0x00e5ff, 0xffb300, 0xff007f];
        const primaryColor = levelColors[(this.level - 1) % levelColors.length];

        // Outer glow
        const glow = this.scene.add.rectangle(0, -4, 46, 46, primaryColor, 0.25);

        // Main Box body
        const boxBg = this.scene.add.rectangle(0, -4, 38, 38, 0x0f172a);
        boxBg.setStrokeStyle(3, primaryColor, 0.95);

        // Inner glowing border
        const innerBorder = this.scene.add.rectangle(0, -4, 28, 28, 0x1e293b);
        innerBorder.setStrokeStyle(1.5, 0xffffff, 0.7);

        // Question mark / Mystery icon
        const iconText = this.scene.add.text(0, -4, '?', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff',
        }).setOrigin(0.5);

        this.container.add([shadow, glow, boxBg, innerBorder, iconText,]);
    }

    #startAnimations() {
        // Floating hover
        this.#hoverTween = this.scene.tweens.add({
            targets: this.container,
            y: this.container.y - 8,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Pulsing glow
        this.#pulseTween = this.scene.tweens.add({
            targets: this.container.list[1], // glow
            scaleX: 1.18,
            scaleY: 1.18,
            alpha: 0.45,
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    checkCollision(playerX: number, playerY: number): boolean {
        if (this.isTriggered) return false;

        // Check if player position is on or near the mystery box tile
        const boxCenterX = this.x + TILE_SIZE / 2;
        const boxCenterY = this.y + TILE_SIZE / 2;
        const playerCenterX = playerX + TILE_SIZE / 2;
        const playerCenterY = playerY + TILE_SIZE / 2;

        const dist = Phaser.Math.Distance.Between(playerCenterX, playerCenterY, boxCenterX, boxCenterY);
        return dist < TILE_SIZE * 0.75;
    }

    trigger() {
        this.isTriggered = true;
        // Pulse explosion on trigger
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1.4,
            scaleY: 1.4,
            alpha: 0,
            duration: 350,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.container.setVisible(false);
            }
        });
    }

    destroy() {
        this.#hoverTween?.stop();
        this.#pulseTween?.stop();
        this.container.destroy();
    }
}

