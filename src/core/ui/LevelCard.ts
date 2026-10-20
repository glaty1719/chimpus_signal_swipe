import Phaser from 'phaser';
import { runtime } from '../runtime';
import type { LevelCardInfo } from '../config';
import { UILayers } from '../layout/UILayers';
import { AudioManager } from '../services/AudioManager';
import { addText } from './text';
import { addButtonFeedback } from './transitions';

export const LEVEL_CARD = Object.freeze({ WIDTH: 320, HEIGHT: 480 } as const);

/**
 * One level card: unlocked (Level N, clickable) or locked (padlock).
 * Drawn at LEVEL_CARD size, then scaled by `scale` to fit the grid.
 * Named: levelCard.<n>, levelCard.<n>.bg, levelCard.<n>.title, levelCard.<n>.number, levelCard.<n>.lock.
 */
export function createLevelCard(
    scene: Phaser.Scene, x: number, y: number, level: number, unlocked: boolean, scale: number, onSelect: () => void
): Phaser.GameObjects.Container {
    const name = `levelCard.${level}`;
    const c = runtime.theme.colors;
    const w = LEVEL_CARD.WIDTH, h = LEVEL_CARD.HEIGHT;
    const card = scene.add.container(x, y).setName(name).setDepth(UILayers.UI_BUTTONS).setScale(scale);

    const bg = scene.add.graphics().setName(`${name}.bg`);
    const drawBg = (border: number) => {
        bg.clear();
        bg.lineStyle(8, border, 1).fillStyle(c.card, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 25).strokeRoundedRect(-w / 2, -h / 2, w, h, 25);
    };
    drawBg(unlocked ? c.highlight : c.cardLocked);
    card.add(bg);

    if (!unlocked) {
        card.add(drawPadlock(scene, `${name}.lock`));
        return card;
    }

    card.add([
        addText(scene, `${name}.title`, 0, -45, 'Level', { style: 'heading', size: 60 }),
        addText(scene, `${name}.number`, 0, 60, String(level), { style: 'number' })
    ]);

    card.setSize(w, h).setInteractive({ useHandCursor: true });
    card.on('pointerover', () => drawBg(c.cardHover));
    card.on('pointerout', () => drawBg(c.highlight));
    let chosen = false;
    addButtonFeedback(card, card, () => {
        if (chosen) return;
        chosen = true;
        AudioManager.getInstance().playSFX('click');
        onSelect();
    });
    return card;
}

/**
 * A game's own card design (config.levelSelection.createCard), wired like the core card:
 * named levelCard.<n>, placed, scaled, animated and clickable when unlocked.
 */
export function createCustomLevelCard(
    scene: Phaser.Scene, x: number, y: number, level: number, unlocked: boolean, scale: number, onSelect: () => void,
    factory: (scene: Phaser.Scene, info: LevelCardInfo) => Phaser.GameObjects.Container
): Phaser.GameObjects.Container {
    const name = `levelCard.${level}`;
    const card = factory(scene, { level, unlocked, name }).setName(name).setPosition(x, y).setDepth(UILayers.UI_BUTTONS).setScale(scale);
    if (!unlocked) return card;
    if (!card.width || !card.height) console.warn(`[levelSelection] createCard must call setSize(w, h) on the card so it can be clicked (${name}).`);
    card.setInteractive({ useHandCursor: true });
    let chosen = false;
    addButtonFeedback(card, card, () => {
        if (chosen) return;
        chosen = true;
        AudioManager.getInstance().playSFX('click');
        onSelect();
    });
    return card;
}

function drawPadlock(scene: Phaser.Scene, name: string) {
    const c = runtime.theme.colors;
    const g = scene.add.graphics().setName(name);
    const lW = 120, lH = 100, lY = 20;

    // shackle
    g.lineStyle(15, c.lock, 1).beginPath().arc(0, lY - 60, 45, Math.PI, 0, false).strokePath();
    g.lineStyle(15, c.lockShade, 1).lineBetween(-45, lY - 60, -45, lY - 10).lineBetween(45, lY - 60, 45, lY - 10);

    // body
    g.fillStyle(c.lock, 1).fillRoundedRect(-lW / 2, lY - lH / 2, lW, lH, 15);
    g.fillStyle(c.lockShade, 1).fillRoundedRect(-lW / 2 + 5, lY - lH / 2 + 5, lW - 10, lH - 10, 12);
    g.fillStyle(c.lock, 1).fillRoundedRect(-lW / 2 + 10, lY - lH / 2 + 10, lW - 20, lH - 25, 10);

    // keyhole
    g.fillStyle(c.lockDark, 1).fillCircle(0, lY, 12);
    g.beginPath().moveTo(-6, lY).lineTo(6, lY).lineTo(10, lY + 25).lineTo(-10, lY + 25).closePath().fillPath();
    return g;
}
