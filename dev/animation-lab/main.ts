import Phaser from 'phaser';
import { BUTTON_STYLES, BUTTON_STYLE_IDS, type ButtonStyleId } from '../../src/core/ui/buttonStyles';
import { attachButtonMotion } from '../../src/core/ui/buttonMotion';

/**
 * Button Animation Lab (dev only, not part of any game build).
 * Open http://localhost:8080/dev/animation-lab.html with `npm run dev`.
 * Shows every style from the core library (src/core/ui/buttonStyles.ts) on real core buttons.
 * Pick one for a project with `buttonStyle: '<id>'` in src/game/game.config.ts.
 */
const W = 1920, H = 1080;
const COLS = 3, CELL_W = 560, CELL_H = 450, GAP = 24, TOP = 130;
const FONT = 'Arial Black, Arial, sans-serif';

class Lab extends Phaser.Scene {
    private intros: (() => void)[] = [];

    constructor() { super('Lab'); }

    preload() {
        this.load.setPath('/assets/ui');
        this.load.image('play', 'playButton.png');
        this.load.image('settings', 'settingsBtn.png');
        this.load.image('panelBtn', 'pausePanelButtons.png');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x1d2140);
        this.add.text(W / 2, 40, 'Button Animation Lab', { fontFamily: FONT, fontSize: '40px', color: '#ffffff' }).setOrigin(0.5).setName('title');
        this.add.text(W / 2, 84, 'Hover, press and release each button  ·  "replay intro" on a card  ·  R replays all  ·  '
            + 'use one in a project:  buttonStyle: \'<id>\'  in src/game/game.config.ts',
        { fontFamily: 'Arial', fontSize: '19px', color: '#aab3e6' }).setOrigin(0.5).setName('help');

        const left = (W - (COLS * CELL_W + (COLS - 1) * GAP)) / 2;
        BUTTON_STYLE_IDS.forEach((id, i) => {
            const x = left + (i % COLS) * (CELL_W + GAP);
            const y = TOP + Math.floor(i / COLS) * (CELL_H + GAP);
            this.card(id, i, x, y);
        });

        this.input.keyboard?.on('keydown-R', () => this.intros.forEach(f => f()));
    }

    private card(id: ButtonStyleId, i: number, x: number, y: number) {
        const style = BUTTON_STYLES[id];
        const g = this.add.graphics().setName(`card.${id}.bg`);
        g.fillStyle(0x2b3163, 1).fillRoundedRect(x, y, CELL_W, CELL_H, 26);
        g.lineStyle(3, 0x4a529a, 1).strokeRoundedRect(x, y, CELL_W, CELL_H, 26);

        this.add.text(x + 22, y + 18, `${i + 1}. ${style.name}`, { fontFamily: FONT, fontSize: '25px', color: '#ffe27a' }).setName(`card.${id}.name`);
        this.add.text(x + 22, y + 54, `'${id}'`, { fontFamily: 'Consolas, monospace', fontSize: '18px', color: '#8affc1' }).setName(`card.${id}.id`);
        this.add.text(x + 22, y + 82, style.feel, { fontFamily: 'Arial', fontSize: '16px', color: '#d6dcff', wordWrap: { width: CELL_W - 44 } }).setName(`card.${id}.feel`);

        const cx = x + CELL_W / 2;
        const intros = [
            this.button(id, `card.${id}.play`, cx - 75, y + 220, 'play', 0.3),
            this.button(id, `card.${id}.icon`, cx + 100, y + 220, 'settings', 0.9),
            this.button(id, `card.${id}.text`, cx, y + 345, 'panelBtn', 0.95, 'PLAY')
        ];

        const replay = this.add.text(cx, y + CELL_H - 24, '↻ replay intro', { fontFamily: 'Arial', fontSize: '17px', color: '#8fa0ff' })
            .setOrigin(0.5).setName(`card.${id}.replay`).setInteractive({ useHandCursor: true });
        replay.on('pointerover', () => replay.setColor('#ffffff'));
        replay.on('pointerout', () => replay.setColor('#8fa0ff'));
        const runIntro = () => intros.forEach((play, k) => play(100 + k * 90));
        replay.on('pointerdown', runIntro);
        this.intros.push(runIntro);
    }

    /** A button exactly as core builds it: an image (+ label) animated by attachButtonMotion. */
    private button(id: ButtonStyleId, name: string, x: number, y: number, key: string, scale: number, label?: string) {
        const img = this.add.image(0, 0, key).setScale(scale).setName(`${name}.image`).setInteractive({ useHandCursor: true });
        const parts: Phaser.GameObjects.GameObject[] = [img];
        if (label) {
            parts.push(this.add.text(0, -4, label, { fontFamily: FONT, fontSize: '28px', color: '#ffffff', stroke: '#4d240e', strokeThickness: 6 })
                .setOrigin(0.5).setName(`${name}.label`));
        }
        const button = this.add.container(x, y, parts).setName(name);
        return attachButtonMotion(img, button, () => { /* a real button would act here */ }, { style: id });
    }
}

new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'lab',
    width: W,
    height: H,
    backgroundColor: '#1d2140',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [Lab]
});
