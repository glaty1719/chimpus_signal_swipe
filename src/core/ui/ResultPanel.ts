import Phaser from 'phaser';
import type { ResultData } from '../events';
import { IconButton } from './IconButton';
import { Modal } from './Modal';
import { addText } from './text';

export interface ResultActions {
    onRetry(): void;
    onHome(): void;
    onNext(): void;
}

/**
 * Game Completed (win) and Game Over (lose) modal.
 *
 * Button rules:
 *   - win on an intermediate level: REPLAY · HOME · NEXT
 *   - win on the last level:        REPLAY · HOME   (Next is never shown)
 *   - lose:                         RETRY · HOME
 * Two-button layouts are re-centred symmetrically.
 *
 * Named: resultPanel, resultPanel.bg, resultPanel.levelText, resultPanel.<id>Button, resultPanel.<id>Label.
 */
export class ResultPanel extends Modal {
    constructor(scene: Phaser.Scene, data: ResultData, actions: ResultActions) {
        super(scene, 'resultPanel');

        this.content.add(scene.add.image(0, 0, data.win ? 'game_completed_bg' : 'game_over_bg').setName('resultPanel.bg'));

        if (data.win) {
            this.content.add(addText(scene, 'resultPanel.levelText', 0, 140, `Level ${data.level}`, {
                style: 'heading', size: 40
            }));
        }

        const buttons: [id: string, icon: string, label: string, action: () => void][] = [
            ['retry', 'retry_icon', data.win ? 'REPLAY' : 'RETRY', actions.onRetry],
            ['home', 'home_icon', 'HOME', actions.onHome]
        ];
        if (data.win && !data.isLastLevel) buttons.push(['next', 'next_icon', 'NEXT', actions.onNext]);

        const spacing = buttons.length === 3 ? 170 : 200;
        const y = data.win ? 220 : 200;
        buttons.forEach(([id, icon, label, action], i) => {
            const x = (i - (buttons.length - 1) / 2) * spacing;   // symmetric around the centre
            const btn = new IconButton(scene, `resultPanel.${id}Button`, x, y, icon, () => this.close(action));
            const text = addText(scene, `resultPanel.${id}Label`, x, y + 70, label, {
                style: 'label'
            });
            this.content.add([btn.sprite, text]);
        });
    }
}
