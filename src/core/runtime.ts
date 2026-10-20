import type { GameConfig } from './config';
import type { Theme } from './theme';
import type { SettingsValues } from './settings';

/**
 * The running game's config, resolved theme and settings. Set once by startGame()
 * before any scene runs; core scenes and services read it from here.
 */
export const runtime = {
    config: undefined as unknown as GameConfig,
    theme: undefined as unknown as Theme,
    settings: {} as SettingsValues
};
