import Phaser from 'phaser';
import { addToolbar as createToolbar } from '../ui/Toolbar';
import type { TutorialStep } from '../config';
import { GameEvents, SceneKeys, type ResultData } from '../events';
import { HintOverlay } from '../ui/HintOverlay';
import { IconButton } from '../ui/IconButton';
import { PausePanel } from '../ui/PausePanel';
import { ResultPanel } from '../ui/ResultPanel';
import { SettingsPanel } from '../ui/SettingsPanel';
import { TutorialOverlay } from '../ui/TutorialOverlay';

/**
 * HUD scene running above the Game scene: Pause (slot 0) and Settings (slot 1), the HUD text,
 * hints, tutorials, and the Game Over / Game Completed panel. Talks to the Game scene only
 * through GameEvents on the Game scene's emitter.
 */
export class UIScene extends Phaser.Scene {
    private game$: Phaser.Events.EventEmitter;
    private toolbar: IconButton[] = [];
    private hint: HintOverlay;

    constructor() {
        super(SceneKeys.UI);
    }

    init(data: { gameScene: Phaser.Scene }) {
        this.game$ = data.gameScene.events;
        this.toolbar = [];
    }

    create() {
        this.input.setTopOnly(true);
        this.hint = new HintOverlay(this);
        this.addToolbar();

        const listeners: [string, (...args: any[]) => void][] = [
            [GameEvents.SHOW_HINT, (text: string, ms?: number) => this.hint.show(text, ms)],
            [GameEvents.HIDE_HINT, () => this.hint.hide()],
            [GameEvents.SHOW_TUTORIAL, (steps: TutorialStep[]) => this.showTutorial(steps)],
            [GameEvents.SHOW_RESULT, (data: ResultData) => this.showResult(data)]
        ];
        for (const [event, fn] of listeners) this.game$.on(event, fn);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            for (const [event, fn] of listeners) this.game$.off(event, fn);
            this.hint.hide(true);
        });

        this.game$.emit(GameEvents.UI_READY);
    }

    private addToolbar() {
        this.toolbar = createToolbar(this, [
            {
                name: 'pauseButton', texture: 'pause_icon', onClick: () => {
                    this.game$.emit(GameEvents.PAUSE);
                    new PausePanel(this, {
                        onResume: () => this.game$.emit(GameEvents.RESUME),
                        onRestart: () => this.game$.emit(GameEvents.RESTART),
                        onQuit: () => this.game$.emit(GameEvents.QUIT)
                    });
                }
            },
            {
                name: 'settingsButton', texture: 'settings_icon', onClick: () => {
                    this.game$.emit(GameEvents.PAUSE);
                    new SettingsPanel(this, () => this.game$.emit(GameEvents.RESUME));
                }
            }
        ]);
    }

    private setToolbarEnabled(on: boolean) {
        this.toolbar.forEach(b => (on ? b.enable() : b.disable()));
    }

    private showTutorial(steps: TutorialStep[]) {
        this.hint.hide(true);
        this.setToolbarEnabled(false);
        this.game$.emit(GameEvents.TUTORIAL_STARTED);
        new TutorialOverlay(this, steps, () => {
            this.setToolbarEnabled(true);
            this.game$.emit(GameEvents.TUTORIAL_ENDED);
        });
    }

    private showResult(data: ResultData) {
        this.setToolbarEnabled(false);
        new ResultPanel(this, data, {
            onRetry: () => this.game$.emit(GameEvents.RESTART, { level: data.level }),
            onHome: () => this.game$.emit(GameEvents.QUIT),
            onNext: () => this.game$.emit(GameEvents.RESTART, { level: data.level + 1 })
        });
    }
}
