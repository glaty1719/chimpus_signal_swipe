import Phaser from 'phaser';
import { CANVAS_SIZE, type GameConfig } from './config';
import { runtime } from './runtime';
import { defineTheme, applyThemeTuning } from './theme';
import { isDebugMode, resolveSettings } from './settings';
import { initLayout, hookLayout, auditNames } from './layout/offsets';
import { enforceLetterbox, setupOrientation } from './platform/screen';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { LevelSelection } from './scenes/LevelSelection';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { GlobalUI } from './scenes/GlobalUI';

/**
 * PUBLIC API of core. Game code (src/game/**) imports only from '../core' (this file),
 * never from files inside src/core.
 */
export type {
    GameConfig, Gameplay, GameplayContext, GameplayFactory, LevelResult, TutorialStep, AssetManifest, Orientation,
    MainMenuConfig, LevelSelectionConfig, LevelCardInfo
} from './config';
export type { SettingsSchema, SettingsValues, Tuning } from './settings';
export type { Theme, ThemeOverrides } from './theme';
export { TYPOGRAPHY_PRESETS, type TextRole, type TextStyleDef, type TypographyId } from './typography';
export { css } from './theme';
export { UILayers } from './layout/UILayers';
export { UIPositions } from './layout/UIPositions';
export { homePosition } from './layout/offsets';
export { AudioManager } from './services/AudioManager';
export { storage } from './services/storage';
export { IconButton } from './ui/IconButton';
export { SpriteTextButton } from './ui/SpriteTextButton';
export { addText, type TextOptions } from './ui/text';
export { Motion, popIn, popOut } from './ui/transitions';
export { BUTTON_STYLES, BUTTON_STYLE_IDS, type ButtonStyle, type ButtonStyleId } from './ui/buttonStyles';
export { attachButtonMotion } from './ui/buttonMotion';

/** The one call in src/main.ts. Core runs the whole flow; the game supplies config + gameplay. */
export function startGame(config: GameConfig, parent = 'game-container'): Phaser.Game {
    enforceLetterbox(parent);
    setupOrientation(config.orientation);

    // Precedence: code defaults < tuning.json (saved, reviewed) < live debug edits (never stored)
    runtime.config = config;
    runtime.theme = defineTheme(config.theme, config.typography);
    applyThemeTuning(runtime.theme, config.tuning?.theme);
    runtime.settings = resolveSettings(config.settings, config.tuning?.settings);
    initLayout(config.tuning?.layout);

    const size = CANVAS_SIZE[config.orientation];
    const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent,
        width: size.width,
        height: size.height,
        backgroundColor: '#000000',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        render: { antialias: true, roundPixels: true },
        physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
        scene: [Boot, Preloader, MainMenu, LevelSelection, GameScene, UIScene, GlobalUI]
    });

    // Applies saved position offsets to named objects whenever a scene is created.
    // In debug mode it also reports objects without a name.
    const debug = isDebugMode();
    hookLayout(game, debug);

    if (debug) {
        // For tooling and tests: window.__cv.audit('MainMenu') lists unnamed objects in a scene
        (window as any).__cv = { game, runtime, audit: (key: string) => auditNames(game.scene.getScene(key)) };
        // Separate chunk: players never download the panel
        import('./debug/debug').then(m => m.openDebugPanel(game));
    }
    return game;
}
