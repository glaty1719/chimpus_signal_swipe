import Phaser from 'phaser';
import type { Gameplay, GameplayContext, LevelResult, TutorialStep } from '../config';
import { runtime } from '../runtime';
import { GameEvents, SceneKeys, type ResultData } from '../events';
import { UILayers } from '../layout/UILayers';
import { APIService } from '../services/APIService';
import { AudioManager } from '../services/AudioManager';
import { GameDataManager } from '../services/GameDataManager';
import { addBackground } from '../ui/text';
import { fadeIn, fadeToScene } from '../ui/transitions';

/**
 * Hosts one level. Core owns everything around the gameplay: the HUD scene, pause/resume,
 * restart, quit, win/lose, saving progress and the API. The game's own logic is
 * `config.gameplay(ctx)`, which only draws the playfield and calls ctx.win()/ctx.lose().
 */
export class GameScene extends Phaser.Scene {
    private level = 1;
    private gameplay: Gameplay | null = null;
    private finished = false;
    private paused = false;
    private uiReady = false;
    private uiQueue: [string, unknown[]][] = [];
    private tutorialDone: (() => void) | null = null;

    constructor() {
        super(SceneKeys.Game);
    }

    init(data: { level?: number }) {
        this.level = Phaser.Math.Clamp(data.level ?? 1, 1, runtime.config.levelCount);
        this.gameplay = null;
        this.finished = this.paused = this.uiReady = false;
        this.uiQueue = [];
        this.tutorialDone = null;
    }

    create() {
        fadeIn(this);
        addBackground(this, 'gameBackground', 'bg_game', UILayers.GAME_BACKGROUND);

        // A scene's event emitter survives restarts, so every listener is removed in cleanup()
        this.events.on(GameEvents.PAUSE, this.pauseGame, this);
        this.events.on(GameEvents.RESUME, this.resumeGame, this);
        this.events.on(GameEvents.RESTART, this.restartGame, this);
        this.events.on(GameEvents.QUIT, this.quitGame, this);
        this.events.on(GameEvents.TUTORIAL_STARTED, this.pauseGame, this);
        this.events.on(GameEvents.TUTORIAL_ENDED, this.onTutorialEnded, this);
        this.events.on(GameEvents.UI_READY, this.flushUi, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

        this.scene.launch(SceneKeys.UI, { gameScene: this });

        const audio = AudioManager.getInstance();
        const music = runtime.config.music?.game;
        if (music) audio.playMusic(music); else audio.stopMusic();
        void APIService.getInstance().postStart(this.level, !audio.isSFXMuted(), !audio.isMusicMuted());

        this.gameplay = runtime.config.gameplay(this.context()) ?? null;

        const data = GameDataManager.getInstance();
        if (this.level === 1 && runtime.config.tutorial?.length && !data.isTutorialSeen()) {
            void this.showTutorial().then(() => data.markTutorialSeen());
        }
    }

    update(time: number, delta: number) {
        this.gameplay?.update?.(time, delta);
    }

    private context(): GameplayContext {
        return {
            scene: this,
            level: this.level,
            levelCount: runtime.config.levelCount,
            config: runtime.config,
            theme: runtime.theme,
            settings: runtime.settings,
            audio: AudioManager.getInstance(),
            win: result => this.finish(true, result),
            lose: result => this.finish(false, result),
            showHint: (text, durationMs) => this.toUi(GameEvents.SHOW_HINT, text, durationMs),
            hideHint: () => this.toUi(GameEvents.HIDE_HINT),
            showTutorial: steps => this.showTutorial(steps)
        };
    }

    /** Send to UIScene, queueing until it is listening. */
    private toUi(event: string, ...args: unknown[]) {
        if (this.uiReady) this.events.emit(event, ...args);
        else this.uiQueue.push([event, args]);
    }

    private flushUi() {
        this.uiReady = true;
        for (const [event, args] of this.uiQueue) this.events.emit(event, ...args);
        this.uiQueue = [];
    }

    private showTutorial(steps: TutorialStep[] | undefined = runtime.config.tutorial): Promise<void> {
        if (!steps?.length) return Promise.resolve();
        return new Promise(resolve => {
            this.tutorialDone = resolve;
            this.toUi(GameEvents.SHOW_TUTORIAL, steps);
        });
    }

    private onTutorialEnded() {
        this.resumeGame();
        const done = this.tutorialDone;
        this.tutorialDone = null;
        done?.();
    }

    private finish(win: boolean, result: LevelResult) {
        if (this.finished) return;
        this.finished = true;
        const stars = win ? Phaser.Math.Clamp(result.stars ?? 3, 0, 3) : 0;
        if (win) GameDataManager.getInstance().completeLevel(this.level, stars, result.score);
        void APIService.getInstance().postEnd(result.score, result.score, JSON.stringify({ level: this.level, stars }), win);

        const data: ResultData = {
            win, level: this.level, score: result.score, stars,
            isLastLevel: this.level >= runtime.config.levelCount
        };
        this.toUi(GameEvents.HIDE_HINT);
        this.toUi(GameEvents.SHOW_RESULT, data);
        this.pauseGame();   // freeze the playfield behind the result panel
    }

    /** Pausing the scene stops its update, timers, tweens, physics and input. */
    private pauseGame() {
        if (this.paused) return;
        this.paused = true;
        this.gameplay?.pause?.();
        this.cameras.main.resetFX();   // a fade-in frozen mid-way would leave the playfield dark
        this.scene.pause();
    }

    private resumeGame() {
        if (!this.paused || this.finished) return;
        this.paused = false;
        this.scene.resume();
        this.gameplay?.resume?.();
    }

    private restartGame(data?: { level?: number }) {
        this.scene.stop(SceneKeys.UI);
        this.scene.restart({ level: data?.level ?? this.level });
    }

    private quitGame() {
        this.scene.stop(SceneKeys.UI);
        this.scene.resume();   // a paused scene cannot run its fade-out
        fadeToScene(this, SceneKeys.MainMenu);
    }

    private cleanup() {
        this.gameplay?.destroy?.();
        this.gameplay = null;
        this.events.off(GameEvents.PAUSE, this.pauseGame, this);
        this.events.off(GameEvents.RESUME, this.resumeGame, this);
        this.events.off(GameEvents.RESTART, this.restartGame, this);
        this.events.off(GameEvents.QUIT, this.quitGame, this);
        this.events.off(GameEvents.TUTORIAL_STARTED, this.pauseGame, this);
        this.events.off(GameEvents.TUTORIAL_ENDED, this.onTutorialEnded, this);
        this.events.off(GameEvents.UI_READY, this.flushUi, this);
    }
}
