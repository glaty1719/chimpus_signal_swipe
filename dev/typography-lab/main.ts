import Phaser from 'phaser';
import { TYPOGRAPHY_PRESETS, type TextStyleDef, type TypographyId } from '../../src/core/typography';

/**
 * Typography Lab (dev only, not part of any game build).
 * Open http://localhost:8080/dev/typography-lab.html with `npm run dev`.
 * Each card applies one complete typography set (fonts, sizes, colours, outlines, shadows) to the same
 * sample screen over the real menu art, rendered by Phaser exactly as in a game.
 */
const W = 1920, H = 1080;
const COLS = 3, CARD_W = 560, CARD_H = 470, GAP_X = 20, GAP_Y = 14, TOP = 84, HEADER = 52;
const INNER_W = 1100, INNER_H = 820, SAMPLE_SCALE = 0.5;   // samples are drawn at real game sizes, shown at half size

interface Role {
    font: string;
    weight?: string;
    size: number;
    color: string;
    stroke?: string;
    strokeThickness?: number;
    shadow?: { x: number; y: number; color: string; blur?: number };
    letterSpacing?: number;
}
type RoleName = 'title' | 'heading' | 'hud' | 'body' | 'button' | 'label' | 'number';
interface TypeSet { id: string; name: string; fonts: string; feel: string; panel: string; roles: Record<RoleName, Role> }

/** The real sets from core (src/core/typography.ts): what games get. Set id → card text. */
const LABELS: Record<TypographyId, { name: string; feel: string; panel: string }> = {
    candyFredokaBold: { name: 'Candy Fredoka Bold (default)', feel: 'Thick outlines, outlined body text: most readable', panel: '#5b1a6e' },
    candyFredoka: { name: 'Candy Fredoka', feel: 'Lighter outlines, shadow-only body text', panel: '#5b1a6e' }
};
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
const toRole = (d: TextStyleDef): Role => ({
    font: 'Fredoka', weight: String(d.weight), size: d.size, color: hex(d.color), stroke: hex(d.stroke), strokeThickness: d.strokeThickness,
    shadow: d.shadow ? { x: d.shadow.x, y: d.shadow.y, color: hex(d.shadow.color), blur: d.shadow.blur } : undefined, letterSpacing: d.letterSpacing
});
const SETS: TypeSet[] = (Object.keys(TYPOGRAPHY_PRESETS) as TypographyId[]).map(id => ({
    id, fonts: 'Fredoka', ...LABELS[id],
    roles: Object.fromEntries(Object.entries(TYPOGRAPHY_PRESETS[id]).map(([role, d]) => [role, toRole(d as TextStyleDef)])) as Record<RoleName, Role>
}));

function style(r: Role, wrap?: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
        fontFamily: `"${r.font}", Arial, sans-serif`,
        fontStyle: r.weight ?? 'normal',
        fontSize: `${r.size}px`,
        color: r.color,
        stroke: r.stroke ?? '#000000',
        strokeThickness: r.strokeThickness ?? 0,
        shadow: r.shadow ? { offsetX: r.shadow.x, offsetY: r.shadow.y, color: r.shadow.color, blur: r.shadow.blur ?? 0, fill: true, stroke: true } : undefined,
        letterSpacing: r.letterSpacing ?? 0,
        align: 'center',
        wordWrap: wrap ? { width: wrap } : undefined
    } as Phaser.Types.GameObjects.Text.TextStyle;
}

class Lab extends Phaser.Scene {
    constructor() { super('Lab'); }

    preload() {
        this.load.setPath('/assets');
        this.load.image('bg', 'backgrounds/game.png');
        this.load.image('panelBtn', 'ui/pausePanelButtons.png');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x14172b);
        this.add.text(W / 2, 30, 'Typography Lab', { fontFamily: '"Lilita One", Arial', fontSize: '40px', color: '#ffffff' }).setOrigin(0.5).setName('title');
        this.add.text(W / 2, 64, 'The typography sets in core (src/core/typography.ts) at real game sizes, shown at half size over real game art. Pick one with typography in game.config.ts.',
            { fontFamily: 'Arial', fontSize: '18px', color: '#aab3e6' }).setOrigin(0.5).setName('help');

        const cols = Math.min(COLS, SETS.length);
        const left = (W - (cols * CARD_W + (cols - 1) * GAP_X)) / 2;
        SETS.forEach((set, i) => this.card(set, i, left + (i % cols) * (CARD_W + GAP_X), TOP + Math.floor(i / cols) * (CARD_H + GAP_Y)));
    }

    private card(set: TypeSet, i: number, x: number, y: number) {
        const frame = this.add.graphics().setName(`card.${set.id}.frame`);
        frame.fillStyle(0x232848, 1).fillRoundedRect(x, y, CARD_W, CARD_H, 18);
        this.add.text(x + 16, y + 4, `${i + 1}. ${set.name}`, { fontFamily: '"Lilita One", Arial', fontSize: '22px', color: '#ffe27a' }).setName(`card.${set.id}.name`);
        this.add.text(x + 16, y + 31, `${set.fonts}  ·  ${set.feel}`, { fontFamily: 'Arial', fontSize: '14px', color: '#c9cff5' })
            .setName(`card.${set.id}.info`);

        // Sample screen, drawn at real sizes inside a half-size container
        const s = this.add.container(x + 5, y + HEADER).setScale(SAMPLE_SCALE).setName(`card.${set.id}.sample`);
        const bg = this.add.image(INNER_W / 2, INNER_H / 2, 'bg').setName(`card.${set.id}.bg`);
        const k = Math.max(INNER_W / bg.width, INNER_H / bg.height);
        bg.setScale(k).setCrop((bg.width - INNER_W / k) / 2, (bg.height - INNER_H / k) / 2, INNER_W / k, INNER_H / k);
        const dim = this.add.rectangle(INNER_W / 2, INNER_H / 2, INNER_W, INNER_H, 0x000000, 0.28).setName(`card.${set.id}.dim`);
        s.add([bg, dim]);

        const r = set.roles;
        const t = (name: string, tx: number, ty: number, text: string, role: Role, wrap?: number) =>
            s.add(this.add.text(tx, ty, text, style(role, wrap)).setOrigin(0.5).setName(`card.${set.id}.${name}`));

        t('titleText', INNER_W / 2, 115, 'Smart Sorter', r.title);

        const pill = this.add.graphics().setName(`card.${set.id}.headerPill`);
        pill.fillStyle(Phaser.Display.Color.HexStringToColor(set.panel).color, 0.95).fillRoundedRect(INNER_W / 2 - 230, 210, 460, 90, 45);
        pill.lineStyle(6, 0xffffff, 0.9).strokeRoundedRect(INNER_W / 2 - 230, 210, 460, 90, 45);
        s.add(pill);
        t('headingText', INNER_W / 2, 255, 'Level Select', r.heading);

        t('hudText', INNER_W / 2, 360, 'Level 3  ·  Score 7 / 10  ·  0:42', r.hud);
        t('bodyText', INNER_W / 2, 470, 'Drag each fruit into the basket with the same colour. Tap a fruit to hear its name!', r.body, 920);

        [['playButton', 'PLAY', 630], ['resumeButton', 'RESUME', 750]].forEach(([id, label, by]) => {
            const btn = this.add.image(380, Number(by), 'panelBtn').setScale(1.2).setName(`card.${set.id}.${id}.bg`);
            s.add(btn);
            t(`${id}.label`, 380, Number(by) - 4, String(label), r.button);
        });

        const cardBg = this.add.graphics().setName(`card.${set.id}.levelCard`);
        cardBg.fillStyle(0x0d1b2a, 0.92).fillRoundedRect(640, 560, 220, 250, 26);
        cardBg.lineStyle(7, Phaser.Display.Color.HexStringToColor(r.number.color).color, 1).strokeRoundedRect(640, 560, 220, 250, 26);
        s.add(cardBg);
        t('levelCard.label', 750, 618, 'Level', { ...r.heading, size: 40 });
        t('levelCard.number', 750, 715, '12', r.number);
    }
}

// Canvas text needs the web fonts loaded first, otherwise it falls back to Arial
const FONT_LOADS = [
    '104px "Lilita One"', '800 32px "Nunito"', '900 32px "Nunito"', '700 100px "Fredoka"', '500 33px "Fredoka"',
    '600 33px "Fredoka"'
];
Promise.all(FONT_LOADS.map(f => document.fonts.load(f))).finally(() => {
    new Phaser.Game({
        type: Phaser.AUTO,
        parent: 'lab',
        width: W,
        height: H,
        backgroundColor: '#14172b',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [Lab]
    });
});
