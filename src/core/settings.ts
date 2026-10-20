import type { ThemeTuning } from './theme';

/**
 * Tunable settings a game exposes (difficulty, speeds, counts...).
 * Declared once in game.config.ts; gameplay reads the values; the debug panel edits them.
 */
export type SettingDef =
    | { type: 'number'; value: number; min: number; max: number; step?: number; label?: string }
    | { type: 'boolean'; value: boolean; label?: string }
    | { type: 'select'; value: string; options: string[]; label?: string }
    | { type: 'color'; value: number; label?: string };

export type SettingsSchema = Record<string, SettingDef>;
export type SettingsValues = Record<string, number | boolean | string>;

/**
 * Overrides stored in tuning.json. Written by the debug panel's Save (after confirmation),
 * applied on top of the code defaults. Precedence: code < tuning.json < live debug edits (never stored).
 */
export interface Tuning {
    settings?: SettingsValues;
    theme?: ThemeTuning;
    /** Position offsets for named objects: { "playButton": { "dx": 40, "dy": -120 } } */
    layout?: Record<string, { dx: number; dy: number }>;
}

/** Debug mode: `?debug` in the URL, or the Vite dev server. Never on by accident in production. */
export function isDebugMode(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        if (new URLSearchParams(window.location.search).has('debug')) return true;
    } catch { /* ignore */ }
    return import.meta.env.DEV;
}

/** Defaults from the schema, overridden by tuning values when provided. */
export function resolveSettings(schema: SettingsSchema = {}, overrides: SettingsValues = {}): SettingsValues {
    const out: SettingsValues = {};
    for (const [key, def] of Object.entries(schema)) {
        out[key] = key in overrides ? overrides[key] : def.value;
    }
    return out;
}
