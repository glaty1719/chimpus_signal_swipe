import type Phaser from 'phaser';
import type { Theme, ThemeOverrides } from './theme';
import type { SettingsSchema, SettingsValues, Tuning } from './settings';
import type { AudioManager } from './services/AudioManager';
import type { ButtonStyleId } from './ui/buttonStyles';
import type { TypographyId } from './typography';

export type Orientation = 'landscape' | 'portrait';

/** Canvas size per orientation. Everything outside the canvas is pure black. */
export const CANVAS_SIZE: Record<Orientation, { width: number; height: number }> = {
    landscape: { width: 1920, height: 1080 },
    portrait: { width: 1080, height: 1920 }
};

/** Files the Preloader loads for the game. Paths are relative to `public/`. */
export interface AssetManifest {
    images?: Record<string, string>;
    spritesheets?: Record<string, { url: string; frameWidth: number; frameHeight: number }>;
    audio?: Record<string, string | string[]>;
    /**
     * Font family → file (woff2/ttf), or { url, weight, style } for a variable font (e.g. weight: '300 700').
     * Loaded before the menu appears, then usable in theme.fonts.
     */
    fonts?: Record<string, string | { url: string; weight?: string; style?: string }>;
}

export interface TutorialStep {
    title?: string;
    text: string;
    /** Optional image key (from `assets.images`) shown above the text. */
    image?: string;
}

export interface LevelResult {
    score: number;
    /** 0 to 3. Defaults to 3 on a win. */
    stars?: number;
}

/** What the game's gameplay receives from the core Game scene. */
export interface GameplayContext {
    scene: Phaser.Scene;
    /** 1-based level number chosen in Level Selection. */
    level: number;
    levelCount: number;
    config: GameConfig;
    theme: Theme;
    /** Hidden for now (not documented, no debug tab): live values of the game's `settings` schema. */
    settings: SettingsValues;
    audio: AudioManager;
    /** End the level as won. Core saves progress and shows Game Completed. */
    win(result: LevelResult): void;
    /** End the level as lost. Core shows Game Over. */
    lose(result: LevelResult): void;
    /** Non-blocking hint bubble (overlay layer). */
    showHint(text: string, durationMs?: number): void;
    hideHint(): void;
    /** Blocking tutorial overlay. Gameplay is paused while it is open. Defaults to `config.tutorial`. */
    showTutorial(steps?: TutorialStep[]): Promise<void>;
}

/** Optional hooks core calls on the running gameplay. */
export interface Gameplay {
    update?(time: number, delta: number): void;
    pause?(): void;
    resume?(): void;
    /** Remove timers, listeners and objects. Called on restart, quit and level end. */
    destroy?(): void;
}

export type GameplayFactory = (ctx: GameplayContext) => Gameplay | void;

/**
 * Main menu look. Everything is optional. The top-left toolbar and the studio logo are fixed by core
 * and cannot be changed (see docs/CUSTOMIZE-UI.md).
 */
export interface MainMenuConfig {
    /** Background image key (declare it in `assets.images`). Default 'bg_menu' (public/assets/backgrounds/menu.png). */
    background?: string;
    playButton?: {
        /** Image key. Default 'play_button' (public/assets/ui/playButton.png). */
        texture?: string;
        /** Size multiplier. Default 1. */
        scale?: number;
        /** Canvas position in px. Default: horizontal centre, a little below the middle. */
        x?: number;
        y?: number;
        /** Gentle breathing pulse. Default true. */
        pulse?: boolean;
    };
    /** Optional title above the Play button: an image key or a text. Default: none (title art is usually in the background). */
    title?: { image?: string; text?: string; x?: number; y?: number; scale?: number };
}

/** What a custom level card is told about itself. */
export interface LevelCardInfo { level: number; unlocked: boolean; name: string }

/** Level selection look. Everything is optional; the toolbar (Back, Settings) is fixed by core. */
export interface LevelSelectionConfig {
    /** Background image key (declare it in `assets.images`). Default 'bg_game'. */
    background?: string;
    /** Show the core panel and "Level Select" header behind the cards. Default true. */
    panel?: boolean;
    /** Cards per row. Default 5 (landscape) / 2 (portrait). */
    columns?: number;
    /** Space between cards in px. Default 40. */
    gap?: number;
    /**
     * Your own card design. Return a Container centred on (0, 0) with `setSize(w, h)` (its click area).
     * Core names it `levelCard.<n>`, places, scales and animates it, and handles the click.
     */
    createCard?: (scene: Phaser.Scene, info: LevelCardInfo) => Phaser.GameObjects.Container;
    /** Your own card positions in canvas px (e.g. along a map path). When set, the grid is not used. */
    cardPosition?: (level: number, count: number, scene: Phaser.Scene) => { x: number; y: number; scale?: number };
}

/** The one object a game provides. Everything else (flow, screens, overlays, HUD) is core. */
export interface GameConfig {
    /** Project slug, e.g. 'smart-sorter'. */
    id: string;
    /** Official ChimpVine game ID. Used for the API and the storage prefix `cv_game_<gameId>_`. */
    gameId: number;
    title: string;
    orientation: Orientation;
    levelCount: number;
    /** The game's own logic. Core calls it when a level starts. */
    gameplay: GameplayFactory;
    theme?: ThemeOverrides;
    assets?: AssetManifest;
    /** Hidden for now (not documented, no debug tab): tunable values. Kept so the feature can return. */
    settings?: SettingsSchema;
    tuning?: Tuning;
    /** Shown automatically the first time level 1 is played. Replay with ctx.showTutorial(). */
    tutorial?: TutorialStep[];
    /**
     * How every button animates (hover, press, release, intro). One of the styles in
     * src/core/ui/buttonStyles.ts; try them at /dev/animation-lab.html. Default: 'popSparkle'.
     */
    buttonStyle?: ButtonStyleId;
    /**
     * Text styles for every screen: 'candyFredokaBold' (default) or 'candyFredoka'. Single styles can be
     * changed in theme.typography. Compare them at /dev/typography-lab.html.
     */
    typography?: TypographyId;
    /** Main menu background, Play button and title. */
    mainMenu?: MainMenuConfig;
    /** Level selection background, grid and card design. */
    levelSelection?: LevelSelectionConfig;
    /** Audio keys (from `assets.audio`) for background music. */
    music?: { menu?: string; game?: string };
    /** ChimpVine WordPress API. Off: progress is stored in localStorage only. */
    api?: {
        enabled: boolean;
        /** Use `testDomain` instead of reading the domain from the parent iframe. */
        testing?: boolean;
        testDomain?: string;
        iframeId?: string;
    };
}
