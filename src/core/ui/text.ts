import Phaser from 'phaser';
import { runtime } from '../runtime';
import { css, type Theme } from '../theme';
import type { TextRole } from '../typography';

export interface TextOptions {
    /** Text style from the theme typography: title, heading, hud, body, button, label, number. Default 'body'. */
    style?: TextRole;
    /** Pixel size, or a style name to borrow its size. Default: the style's size. */
    size?: TextRole | number;
    font?: keyof Theme['fonts'];
    weight?: number;
    color?: number;
    stroke?: number;
    strokeThickness?: number;
    /** false removes the style's shadow. */
    shadow?: false;
    letterSpacing?: number;
    align?: 'left' | 'center' | 'right';
    wrapWidth?: number;
}

/**
 * Themed text with a required name. Use this instead of scene.add.text so fonts, sizes, colors,
 * outlines and shadows always come from the theme's text styles. Origin is centered.
 *   addText(scene, 'scoreText', x, y, 'Score 3', { style: 'hud' })
 */
export function addText(
    scene: Phaser.Scene, name: string, x: number, y: number, text: string, o: TextOptions = {}
): Phaser.GameObjects.Text {
    return scene.add.text(x, y, text, textStyleFor(o)).setOrigin(0.5).setName(name)
        .setData('textStyle', roleOf(o))
        .setData('textOptions', o);   // lets the debug panel restyle it live (restyleTexts)
}

const roleOf = (o: TextOptions): TextRole => o.style ?? (typeof o.size === 'string' ? o.size : 'body');

/** The Phaser text style for these options, from the current theme typography. */
function textStyleFor(o: TextOptions): Phaser.Types.GameObjects.Text.TextStyle {
    const theme = runtime.theme;
    const t = theme.typography;
    const st = t[roleOf(o)];
    const size = typeof o.size === 'number' ? o.size : o.size ? t[o.size].size : st.size;
    const sh = o.shadow === false ? undefined : st.shadow;
    return {
        fontFamily: theme.fonts[o.font ?? st.font],
        fontStyle: String(o.weight ?? st.weight),
        fontSize: `${size}px`,
        color: css(o.color ?? st.color),
        stroke: css(o.stroke ?? st.stroke),
        strokeThickness: o.strokeThickness ?? st.strokeThickness,
        // An explicit "no shadow" so a live restyle can also switch a shadow off
        shadow: sh
            ? { offsetX: sh.x, offsetY: sh.y, color: css(sh.color), blur: sh.blur ?? 0, fill: true, stroke: true }
            : { offsetX: 0, offsetY: 0, color: '#000000', blur: 0, fill: false, stroke: false },
        letterSpacing: o.letterSpacing ?? st.letterSpacing ?? 0,
        align: o.align ?? 'center',
        wordWrap: o.wrapWidth ? { width: o.wrapWidth, useAdvancedWrap: true } : undefined
    };
}

/**
 * Re-applies the current theme typography to every addText text in the running (or paused) scenes,
 * in place. The debug panel uses it for real-time style edits without restarting the screen.
 */
export function restyleTexts(game: Phaser.Game) {
    for (const scene of game.scene.scenes) {
        if (!scene.sys.isActive() && !scene.sys.isPaused()) continue;
        const visit = (list: Phaser.GameObjects.GameObject[]) => {
            for (const obj of list) {
                const o = obj.getData?.('textOptions') as TextOptions | undefined;
                if (o && obj instanceof Phaser.GameObjects.Text) obj.setStyle(textStyleFor(o));
                if (obj instanceof Phaser.GameObjects.Container) visit(obj.list);
            }
        };
        visit(scene.children.list);
    }
}

/**
 * Full-screen background image scaled to COVER the canvas (cropped, never stretched),
 * so landscape art also works on a portrait canvas.
 */
export function addBackground(scene: Phaser.Scene, name: string, textureKey: string, depth: number) {
    const { width, height } = scene.scale;
    scene.cameras.main.setBackgroundColor(runtime.theme.colors.background);
    if (!scene.textures.exists(textureKey)) return null;
    const img = scene.add.image(width / 2, height / 2, textureKey).setName(name).setDepth(depth);
    img.setScale(Math.max(width / img.width, height / img.height));
    return img;
}
