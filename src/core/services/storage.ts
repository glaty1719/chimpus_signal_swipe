import { runtime } from '../runtime';

/**
 * localStorage with the per-game prefix `cv_game_<gameId>_`.
 * RULE: games on the same domain share localStorage, so never use a raw key.
 * Every call is safe: storage can be missing or blocked (private mode, WebView settings).
 */
export const storage = {
    key(name: string): string {
        return `cv_game_${runtime.config.gameId}_${name}`;
    },

    get(name: string): string | null {
        try { return localStorage.getItem(this.key(name)); } catch { return null; }
    },

    set(name: string, value: string): void {
        try { localStorage.setItem(this.key(name), value); } catch { /* storage unavailable */ }
    },

    getJSON<T>(name: string, fallback: T): T {
        const raw = this.get(name);
        if (raw === null) return fallback;
        try { return JSON.parse(raw) as T; } catch { return fallback; }
    },

    setJSON(name: string, value: unknown): void {
        this.set(name, JSON.stringify(value));
    }
};
