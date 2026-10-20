import { CORE_FONT_FAMILY, DEFAULT_TYPOGRAPHY, TYPOGRAPHY_PRESETS, type TextRole, type TextStyleDef, type Typography, type TypographyId } from './typography';

/**
 * Look and feel shared by every core screen (menus, panels, HUD, overlays).
 * A game overrides only what it needs in game.config.ts → `theme`.
 * RULE: never hardcode a hex color or font name; read it from the theme.
 */
export interface Theme {
    fonts: {
        /** Titles, buttons, numbers. */
        primary: string;
        /** Body text, hints, tutorials. */
        body: string;
    };
    colors: {
        /** Canvas clear color (behind the backgrounds). */
        background: number;
        text: number;
        textStroke: number;
        /** Labels on sprite buttons (RESUME, REPLAY...). */
        buttonText: number;
        buttonTextStroke: number;
        /** Highlighted numbers and accents (level numbers, unlocked card border). */
        highlight: number;
        panel: number;
        panelBorder: number;
        panelHeader: number;
        card: number;
        cardLocked: number;
        cardHover: number;
        lock: number;
        lockShade: number;
        lockDark: number;
        /** Dim layer behind modals and overlays. */
        overlay: number;
        sliderTrack: number;
        sliderFill: number;
        sliderHandle: number;
    };
    /** Text styles by role (title, heading, hud, body, button, label, number). See typography.ts. */
    typography: Typography;
}

/** The template's default look. Every value is replaceable per game. */
export const defaultTheme: Theme = {
    fonts: {
        primary: `"${CORE_FONT_FAMILY}", Arial, sans-serif`,
        body: `"${CORE_FONT_FAMILY}", Arial, sans-serif`
    },
    colors: {
        background: 0x000000,
        text: 0xffffff,
        textStroke: 0x000000,
        buttonText: 0xffffff,
        buttonTextStroke: 0x4d240e,
        highlight: 0xffcc00,
        panel: 0x00334d,
        panelBorder: 0x7db9e8,
        panelHeader: 0x004d66,
        card: 0x001a26,
        cardLocked: 0x2d5a7a,
        cardHover: 0xffffff,
        lock: 0xbdc3c7,
        lockShade: 0x95a5a6,
        lockDark: 0x2c3e50,
        overlay: 0x000000,
        sliderTrack: 0x3845c8,
        sliderFill: 0xd2f1ff,
        sliderHandle: 0x1e4fb9
    },
    typography: TYPOGRAPHY_PRESETS[DEFAULT_TYPOGRAPHY]
};

export interface ThemeOverrides {
    fonts?: Partial<Theme['fonts']>;
    colors?: Partial<Theme['colors']>;
    /** Change single text styles, e.g. { title: { color: 0xffffff }, body: { size: 36 } }. */
    typography?: Partial<Record<TextRole, Partial<TextStyleDef>>>;
    /** Shortcut for sizes only, e.g. { hud: 44 } (also what the debug panel saves). */
    text?: Partial<Record<TextRole, number>>;
}

/**
 * Theme values that tuning.json may override (what the debug panel saves). Same shape as the overrides,
 * except a style's shadow is saved as on/off plus a colour.
 */
export type TypographyTuning = Partial<Omit<TextStyleDef, 'shadow'>> & { shadow?: boolean | TextStyleDef['shadow']; shadowColor?: number };
export type ThemeTuning = Omit<ThemeOverrides, 'typography'> & { typography?: Partial<Record<TextRole, TypographyTuning>> };

/** Merge a game's overrides onto the default theme and the chosen typography set (returns a new object). */
export function defineTheme(overrides: ThemeOverrides = {}, typographyId: TypographyId = DEFAULT_TYPOGRAPHY): Theme {
    const base: Typography = TYPOGRAPHY_PRESETS[typographyId] ?? TYPOGRAPHY_PRESETS[DEFAULT_TYPOGRAPHY];
    const typography = {} as Typography;
    for (const role of Object.keys(base) as TextRole[]) {
        const style: TextStyleDef = { ...base[role], ...overrides.typography?.[role] };
        if (style.shadow) style.shadow = { ...style.shadow };
        const size = overrides.text?.[role];
        if (size) style.size = size;
        typography[role] = style;
    }
    return {
        fonts: { ...defaultTheme.fonts, ...overrides.fonts },
        colors: { ...defaultTheme.colors, ...overrides.colors },
        typography
    };
}

/** Apply tuning.json values onto a theme in place. */
export function applyThemeTuning(theme: Theme, t?: ThemeTuning) {
    if (!t) return;
    Object.assign(theme.fonts, t.fonts);
    Object.assign(theme.colors, t.colors);
    for (const [role, size] of Object.entries(t.text ?? {})) {
        if (typeof size === 'number' && theme.typography[role as TextRole]) theme.typography[role as TextRole].size = size;
    }
    for (const [role, tuning] of Object.entries(t.typography ?? {})) {
        const target = theme.typography[role as TextRole];
        if (!target || !tuning) continue;
        const { shadow, shadowColor, ...rest } = tuning;
        Object.assign(target, rest);
        if (shadow === false) delete target.shadow;
        else if (shadow === true && !target.shadow) target.shadow = { x: 0, y: Math.max(2, Math.round(target.size * 0.08)), color: shadowColor ?? 0x000000 };
        else if (typeof shadow === 'object') target.shadow = { ...target.shadow, ...shadow };
        if (typeof shadowColor === 'number' && target.shadow) target.shadow.color = shadowColor;
    }
}

/** 0xffcc00 → '#ffcc00' (Phaser text styles need CSS colors). */
export const css = (color: number) => '#' + color.toString(16).padStart(6, '0');
