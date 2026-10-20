import Phaser from 'phaser';
import { addText, type LevelCardInfo } from '../core';
import { lookColors } from './look';

const FLOOR_TITLES = ['WARM-UP SIGNALS', 'HIDDEN SIGNALS', 'DEVICE PAIRS'];

/**
 * Realistic Tactical Security Keycard for Level Selection.
 * Features an authentic cyber access card design with gold microchip, LED status, and scope aperture.
 */
export function createLevelCard(scene: Phaser.Scene, info: LevelCardInfo): Phaser.GameObjects.Container {
    const { level, unlocked, name } = info;
    const width = 290;
    const height = 380;
    const strokeColor = unlocked ? lookColors.highlight : lookColors.cardBorder;
    const accentColor = unlocked ? lookColors.highlight : lookColors.caution;

    // 1. Keycard Graphic Chassis
    const cardG = scene.add.graphics().setName(`${name}.bg`);
    // Titanium body
    cardG.fillStyle(unlocked ? lookColors.card : lookColors.cardLocked, 0.96)
        .fillRoundedRect(-width / 2, -height / 2, width, height, 20);
    // Beveled metallic border
    cardG.lineStyle(4, strokeColor, unlocked ? 1 : 0.45)
        .strokeRoundedRect(-width / 2, -height / 2, width, height, 20);
    cardG.lineStyle(1.5, unlocked ? lookColors.highlight : lookColors.panelHeader, unlocked ? 0.8 : 0.3)
        .strokeRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, 16);

    // Tech grid lines inside the card
    cardG.lineStyle(1, lookColors.techGrid, unlocked ? 0.35 : 0.15);
    for (let gx = -width / 2 + 30; gx < width / 2; gx += 30) {
        cardG.lineBetween(gx, -height / 2 + 70, gx, height / 2 - 60);
    }

    // Gold microchip contacts (top right corner of keycard)
    cardG.fillStyle(lookColors.sliderFill, unlocked ? 0.9 : 0.4)
        .fillRoundedRect(width / 2 - 58, -height / 2 + 16, 40, 32, 6);
    cardG.lineStyle(1, lookColors.darkTitanium, 0.8);
    cardG.lineBetween(width / 2 - 38, -height / 2 + 16, width / 2 - 38, -height / 2 + 48);
    cardG.lineBetween(width / 2 - 58, -height / 2 + 32, width / 2 - 18, -height / 2 + 32);

    // Status LED dot (top left)
    const ledColor = unlocked ? lookColors.ledGreen : lookColors.ledAmber;
    cardG.fillStyle(ledColor, 1).fillCircle(-width / 2 + 30, -height / 2 + 32, 5);
    cardG.lineStyle(1.5, lookColors.signalPulse, 0.6).strokeCircle(-width / 2 + 30, -height / 2 + 32, 8);

    // 2. Central Sensor Scope Aperture
    const scopeY = -40;
    const scopeR = 64;
    cardG.fillStyle(lookColors.darkTitanium, 1).fillCircle(0, scopeY, scopeR);
    cardG.lineStyle(3, strokeColor, unlocked ? 0.9 : 0.4).strokeCircle(0, scopeY, scopeR);
    cardG.lineStyle(1.5, lookColors.cardBorder, 0.6).strokeCircle(0, scopeY, scopeR - 8);

    // Crosshair ticks
    cardG.lineStyle(2, accentColor, unlocked ? 0.7 : 0.3);
    cardG.lineBetween(0, scopeY - scopeR - 6, 0, scopeY - scopeR + 4);
    cardG.lineBetween(0, scopeY + scopeR - 4, 0, scopeY + scopeR + 6);
    cardG.lineBetween(-scopeR - 6, scopeY, -scopeR + 4, scopeY);
    cardG.lineBetween(scopeR - 4, scopeY, scopeR + 6, scopeY);

    const number = addText(scene, `${name}.label`, 0, scopeY, `0${level}`, { style: 'title', size: 52 })
        .setColor(unlocked ? '#44d9e8' : '#7288a3');

    // 3. Floor Mission Header & Clearance Badge
    const floorHeader = addText(scene, `${name}.header`, 0, 52, `TOWER SECTOR 0${level}`, { style: 'label', size: 16 })
        .setColor('#8ea5c4');

    const title = addText(scene, `${name}.title`, 0, 84, FLOOR_TITLES[level - 1] ?? `LEVEL ${level}`, { style: 'heading', size: 22 })
        .setColor(unlocked ? '#ffffff' : '#8899aa');

    const statusBadge = addText(scene, `${name}.status`, 0, 142, unlocked ? '● ACCESS AUTHORIZED' : '🔒 RESTRICTED SECTOR', { style: 'label', size: 16 })
        .setColor(unlocked ? '#3ddc84' : '#f0b429');

    return scene.add.container(0, 0, [cardG, number, floorHeader, title, statusBadge]).setSize(width, height);
}
