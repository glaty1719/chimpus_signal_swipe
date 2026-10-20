/**
 * Typography: named text styles every core screen uses, in two sets. A game picks one in
 * game.config.ts (`typography: 'candyFredokaBold'`) and can override single styles in `theme.typography`.
 * Compare them at /dev/typography-lab.html (npm run dev).
 */

/** Where a style is used. */
export type TextRole =
    | 'title'     // game title on the main menu
    | 'heading'   // panel and screen headings (Level Select, tutorial title, "Level" on cards)
    | 'hud'       // in-game HUD line (level, score, time)
    | 'body'      // tutorial text, hints, longer sentences
    | 'button'    // labels on sprite buttons (RESUME, NEXT...)
    | 'label'     // small labels (REPLAY / HOME under icons, tutorial step "1 / 2")
    | 'number';   // big numbers (level number on cards)

export interface TextStyleDef {
    /** Which theme font family: 'primary' or 'body'. */
    font: 'primary' | 'body';
    /** CSS weight, 300-700 for Fredoka. */
    weight: number;
    /** Size in px on the 1920x1080 / 1080x1920 canvas. */
    size: number;
    color: number;
    stroke: number;
    strokeThickness: number;
    shadow?: { x: number; y: number; color: number; blur?: number };
    letterSpacing?: number;
}

export type Typography = Record<TextRole, TextStyleDef>;

const PLUM = 0x5b1a6e, PLUM_DARK = 0x2b0a35, CREAM = 0xfff7e6, WHITE = 0xffffff, GOLD = 0xffcf3f, BROWN = 0x8a2b00;

export const TYPOGRAPHY_PRESETS = {
    /** Default. Fredoka with Candy Pop styling and thick outlines: readable over any background. */
    candyFredokaBold: {
        title: { font: 'primary', weight: 700, size: 106, color: CREAM, stroke: PLUM, strokeThickness: 16, shadow: { x: 0, y: 10, color: PLUM_DARK }, letterSpacing: 1 },
        heading: { font: 'primary', weight: 700, size: 46, color: WHITE, stroke: PLUM, strokeThickness: 9 },
        hud: { font: 'primary', weight: 700, size: 40, color: WHITE, stroke: PLUM, strokeThickness: 9 },
        body: { font: 'body', weight: 600, size: 34, color: WHITE, stroke: PLUM, strokeThickness: 5, shadow: { x: 0, y: 3, color: PLUM_DARK } },
        button: { font: 'primary', weight: 700, size: 32, color: WHITE, stroke: BROWN, strokeThickness: 7 },
        label: { font: 'primary', weight: 700, size: 24, color: WHITE, stroke: PLUM, strokeThickness: 5 },
        number: { font: 'primary', weight: 700, size: 100, color: GOLD, stroke: PLUM, strokeThickness: 12, shadow: { x: 0, y: 7, color: PLUM_DARK } }
    },
    /** Fredoka with Candy Pop styling, lighter outlines and shadow-only body text. */
    candyFredoka: {
        title: { font: 'primary', weight: 700, size: 104, color: CREAM, stroke: PLUM, strokeThickness: 14, shadow: { x: 0, y: 9, color: PLUM_DARK }, letterSpacing: 1 },
        heading: { font: 'primary', weight: 700, size: 46, color: WHITE, stroke: PLUM, strokeThickness: 7 },
        hud: { font: 'primary', weight: 700, size: 40, color: WHITE, stroke: PLUM, strokeThickness: 7 },
        body: { font: 'body', weight: 600, size: 33, color: WHITE, stroke: PLUM, strokeThickness: 0, shadow: { x: 0, y: 3, color: 0x1b1035, blur: 4 } },
        button: { font: 'primary', weight: 700, size: 32, color: WHITE, stroke: BROWN, strokeThickness: 6 },
        label: { font: 'primary', weight: 700, size: 24, color: WHITE, stroke: PLUM, strokeThickness: 4 },
        number: { font: 'primary', weight: 700, size: 100, color: GOLD, stroke: PLUM, strokeThickness: 10, shadow: { x: 0, y: 6, color: PLUM_DARK } }
    }
} satisfies Record<string, Typography>;

for (const preset of Object.values(TYPOGRAPHY_PRESETS)) {
    for (const style of Object.values(preset) as TextStyleDef[]) { if (style.shadow) Object.freeze(style.shadow); Object.freeze(style); }
    Object.freeze(preset);
}
Object.freeze(TYPOGRAPHY_PRESETS);

export type TypographyId = keyof typeof TYPOGRAPHY_PRESETS;
export const DEFAULT_TYPOGRAPHY: TypographyId = 'candyFredokaBold';

/** The template's font, shipped in public/assets/fonts/ (SIL Open Font License) and always loaded by core. */
export const CORE_FONT_FAMILY = 'Fredoka';
export const CORE_FONTS: { family: string; url: string; descriptors: FontFaceDescriptors }[] = [
    { family: CORE_FONT_FAMILY, url: 'assets/fonts/Fredoka-latin.woff2', descriptors: { weight: '300 700',
        unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' } },
    { family: CORE_FONT_FAMILY, url: 'assets/fonts/Fredoka-latin-ext.woff2', descriptors: { weight: '300 700',
        unicodeRange: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF' } }
];
