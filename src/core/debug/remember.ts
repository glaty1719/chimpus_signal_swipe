import type GUI from 'lil-gui';
import { storage } from '../services/storage';

const FOLDERS_KEY = 'debugFolders';

/**
 * Remembers which debug panel folders are open, across reloads. Folders are keyed by their title path
 * when the panel is built ("Text styles/heading"), so a style folder borrowed into Selected keeps its key.
 * Tab sections (title hidden, always open) are left alone.
 */
export function rememberFolders(gui: GUI) {
    let state: Record<string, boolean> = {};
    try { state = JSON.parse(storage.get(FOLDERS_KEY) ?? '{}'); } catch { /* start fresh */ }

    const pathOf = (f: GUI) => {
        const parts: string[] = [];
        for (let g: GUI | undefined = f; g && g.parent; g = g.parent) parts.unshift(g.$title.textContent?.trim() ?? '');
        return parts.join('/');
    };
    const isTabSection = (f: GUI) => f.domElement.classList.contains('cv-tab-solo');

    for (const f of gui.foldersRecursive()) {
        const key = pathOf(f);
        f.domElement.dataset.folderKey = key;
        if (isTabSection(f) || !(key in state)) continue;
        if (state[key]) f.open(); else f.close();
    }

    gui.onOpenClose(f => {
        const key = f.domElement.dataset.folderKey;
        if (!key || isTabSection(f)) return;
        // _closed is set at once; the 'closed' class only changes after the open/close animation
        state[key] = !(f as unknown as { _closed: boolean })._closed;
        storage.set(FOLDERS_KEY, JSON.stringify(state));
    });
}
