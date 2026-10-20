/**
 * Depth hierarchy for every object. RULE: never write a raw number in setDepth(); use these.
 *
 *   Layer 3  Modals     10000+     Settings, Pause, Game Over / Completed
 *   Layer 2  Overlays   900-1030   Tutorials, hints, click blocker
 *   Layer 1  HUD        100-130    HUD buttons, score, timer
 *   Layer 0  Game       0-20       Backgrounds, gameplay objects, effects
 */
export const UILayers = Object.freeze({
    // ===== LAYER 0: Game =====
    GAME_BACKGROUND: 0,
    GAME_WALLS: 1,
    GAME_OBSTACLES: 2,
    GAME_ITEMS: 3,
    GAME_PLAYER: 10,
    GAME_EFFECTS: 20,

    // ===== LAYER 1: Non-blocking UI =====
    UI_BACKGROUND_PANELS: 100,
    UI_TEXT: 110,
    UI_BUTTONS: 120,
    UI_ICONS: 130,

    // ===== LAYER 2: Full-screen overlays =====
    OVERLAY_BLOCKER: 900,
    OVERLAY_BACKGROUND: 1000,
    OVERLAY_PANEL: 1010,
    OVERLAY_TEXT: 1020,
    OVERLAY_BUTTONS: 1030,

    // ===== LAYER 3: Top modals =====
    MODAL_BACKGROUND: 10000,
    MODAL_PANEL: 10010,
    MODAL_TEXT: 10020,
    MODAL_BUTTONS: 10030,
    MODAL_CONTROLS: 10040,

    /** Studio logo and splash: above everything. */
    BRANDING: 100000
} as const);
