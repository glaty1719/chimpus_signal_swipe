import Phaser from 'phaser';
import { Modal } from './Modal';
import { SpriteTextButton } from './SpriteTextButton';

export interface PauseActions {
    onResume(): void;
    onRestart(): void;
    onQuit(): void;
}

/**
 * Standard pause modal: RESUME, RESTART, QUIT.
 * Named: pausePanel, pausePanel.bg, pausePanel.resumeButton, pausePanel.restartButton, pausePanel.quitButton.
 */
export class PausePanel extends Modal {
    constructor(scene: Phaser.Scene, actions: PauseActions) {
        super(scene, 'pausePanel');
        this.content.add(scene.add.image(0, 0, 'paused_bg').setName('pausePanel.bg'));

        const rows: [string, string, () => void][] = [
            ['resumeButton', 'RESUME', actions.onResume],
            ['restartButton', 'RESTART', actions.onRestart],
            ['quitButton', 'QUIT', actions.onQuit]
        ];
        rows.forEach(([id, text, action], i) => {
            const btn = new SpriteTextButton(scene, `pausePanel.${id}`, 0, -50 + i * 110, 'pause_panel_btn', text, () => this.close(action));
            this.content.add(btn.container);
        });
    }
}
