import Phaser from 'phaser';
import { runtime } from '../runtime';
import { SceneKeys } from '../events';
import { UILayers } from '../layout/UILayers';
import { UIPositions } from '../layout/UIPositions';
import { GameDataManager } from '../services/GameDataManager';
import { LEVEL_CARD, createCustomLevelCard, createLevelCard } from '../ui/LevelCard';
import { addToolbar as createToolbar } from '../ui/Toolbar';
import type { LevelSelectionConfig } from '../config';
import { SettingsPanel } from '../ui/SettingsPanel';
import { addBackground, addText } from '../ui/text';
import { fadeIn, fadeToScene } from '../ui/transitions';

const DEFAULT_GAP = 40;

/**
 * Grid of level cards (count from config.levelCount). Back and Settings in the locked toolbar.
 * A game sets the background, columns, gap, its own card design or its own card positions in
 * config.levelSelection (see docs/CUSTOMIZE-UI.md).
 */
export class LevelSelection extends Phaser.Scene {
    constructor() {
        super(SceneKeys.LevelSelection);
    }

    create() {
        fadeIn(this);
        const { width, height } = this.scale;
        const c = runtime.theme.colors;
        const portrait = UIPositions.isPortrait(this);
        const cfg = runtime.config.levelSelection ?? {};
        const gap = cfg.gap ?? DEFAULT_GAP;

        addBackground(this, 'levelBackground', cfg.background ?? 'bg_game', UILayers.GAME_BACKGROUND);
        this.add.rectangle(width / 2, height / 2, width, height, c.overlay, 0.4)
            .setDepth(UILayers.GAME_BACKGROUND + 1).setName('levelBackground.dim');

        // Panel
        const panelW = Math.min(1200, width - 120);
        const panelH = portrait ? Math.min(1300, height - 420) : 700;
        const panelX = width / 2;
        const panelY = height / 2 + 50;
        if (cfg.panel !== false) this.drawPanel(panelX, panelY, panelW, panelH);

        this.layoutCards(cfg, gap, panelX, panelY + 30, panelW - 2 * gap, panelH - 120 - gap, portrait);
        this.addToolbar();
    }

    private drawPanel(panelX: number, panelY: number, panelW: number, panelH: number) {
        const c = runtime.theme.colors;
        const panel = this.add.graphics().setDepth(UILayers.UI_BACKGROUND_PANELS).setName('levelPanel');
        panel.fillStyle(0x000000, 0.3).fillRoundedRect(panelX - panelW / 2 + 10, panelY - panelH / 2 + 10, panelW, panelH, 40);
        panel.lineStyle(8, c.panelBorder, 1).fillStyle(c.panel, 0.95);
        panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 40);
        panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 40);

        // Header
        const headerY = panelY - panelH / 2;
        const header = this.add.graphics().setDepth(UILayers.UI_BACKGROUND_PANELS + 5).setName('levelPanel.header');
        header.fillStyle(c.panelHeader, 1).lineStyle(6, c.panelBorder, 1);
        header.fillRoundedRect(panelX - 200, headerY - 40, 400, 80, 40).strokeRoundedRect(panelX - 200, headerY - 40, 400, 80, 40);
        addText(this, 'levelPanel.title', panelX, headerY, 'Level Select', { style: 'heading' })
            .setDepth(UILayers.UI_TEXT + 10);
    }

    /**
     * Fit every level into the panel: as many columns as fit, cards scaled down when needed.
     * With cfg.cardPosition the game places each card itself instead.
     */
    private layoutCards(cfg: LevelSelectionConfig, gap: number, cx: number, cy: number, availW: number, availH: number, portrait: boolean) {
        const count = runtime.config.levelCount;
        const data = GameDataManager.getInstance();
        const open = (level: number) => () => fadeToScene(this, SceneKeys.Game, { level });
        const make = (level: number, x: number, y: number, scale: number) => cfg.createCard
            ? createCustomLevelCard(this, x, y, level, data.isLevelUnlocked(level), scale, open(level), cfg.createCard)
            : createLevelCard(this, x, y, level, data.isLevelUnlocked(level), scale, open(level));

        if (cfg.cardPosition) {
            for (let level = 1; level <= count; level++) {
                const p = cfg.cardPosition(level, count, this);
                make(level, p.x, p.y, p.scale ?? 1);
            }
            return;
        }

        // Card size: the core card, or measured from one custom card
        let cardW: number = LEVEL_CARD.WIDTH, cardH: number = LEVEL_CARD.HEIGHT;
        if (cfg.createCard) {
            const probe = cfg.createCard(this, { level: 1, unlocked: true, name: 'levelCard.probe' });
            cardW = probe.width || cardW;
            cardH = probe.height || cardH;
            probe.destroy();
        }
        const cols = Math.max(1, Math.min(count, cfg.columns ?? (portrait ? 2 : 5)));
        const rows = Math.ceil(count / cols);
        const scale = Math.min(
            1,
            (availW - (cols - 1) * gap) / (cols * cardW),
            (availH - (rows - 1) * gap) / (rows * cardH)
        );
        const cellW = cardW * scale + gap;
        const cellH = cardH * scale + gap;

        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / cols);
            const inRow = Math.min(cols, count - row * cols);   // last row may be shorter: centre it
            const col = i % cols;
            const x = cx + (col - (inRow - 1) / 2) * cellW;
            const y = cy + (row - (rows - 1) / 2) * cellH;
            make(i + 1, x, y, scale);
        }
    }

    private addToolbar() {
        createToolbar(this, [
            { name: 'backButton', texture: 'back_icon', onClick: () => fadeToScene(this, SceneKeys.MainMenu) },
            { name: 'settingsButton', texture: 'settings_icon', onClick: () => new SettingsPanel(this) }
        ]);
    }
}
