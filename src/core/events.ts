/** Scene keys. Core owns the flow: Boot → Preloader → MainMenu → LevelSelection → Game (+ UIScene). */
export const SceneKeys = {
    Boot: 'Boot',
    Preloader: 'Preloader',
    MainMenu: 'MainMenu',
    LevelSelection: 'LevelSelection',
    Game: 'Game',
    UI: 'UIScene',
    GlobalUI: 'GlobalUI'
} as const;

/**
 * Events between the Game scene and UIScene. They travel on the Game scene's event emitter
 * (`gameScene.events`), so they are removed automatically with the scene.
 */
export const GameEvents = {
    PAUSE: 'pause-game',
    RESUME: 'resume-game',
    RESTART: 'restart-game',
    QUIT: 'quit-game',
    /** Level ended (win or lose): UIScene shows the Game Over / Game Completed panel. */
    SHOW_RESULT: 'show-gameover',
    SHOW_HINT: 'show-hint',
    HIDE_HINT: 'hide-hint',
    SHOW_TUTORIAL: 'show-tutorial',
    TUTORIAL_STARTED: 'tutorial-started',
    TUTORIAL_ENDED: 'tutorial-ended',
    /** UIScene finished create() and is listening. Messages sent before this are queued. */
    UI_READY: 'ui-ready'
} as const;

export interface ResultData {
    win: boolean;
    level: number;
    score: number;
    stars: number;
    isLastLevel: boolean;
}
