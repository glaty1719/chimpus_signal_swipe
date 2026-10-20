import type GUI from 'lil-gui';
import { storage } from '../services/storage';

export interface DebugTab {
    id: string;
    label: string;
    folders: GUI[];
}

const STYLE_ID = 'cv-debug-tabs-style';
const CSS = `
.cv-debug-tabs { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 6px 7px; background: var(--background-color); border-bottom: 1px solid var(--widget-color); }
.cv-debug-tabs button { width: auto !important; flex: 1 1 28%; padding: 6px 4px; border: 0; border-radius: 6px; cursor: pointer;
    background: var(--widget-color); color: var(--text-color); font: 600 11px/1 system-ui, sans-serif; letter-spacing: .2px; }
.cv-debug-tabs button:hover { filter: brightness(1.25); }
.cv-debug-tabs button.active { background: #7b3fa0; color: #fff; }
.lil-gui.cv-tab-solo > .title { display: none; }
`;

/**
 * A tab bar for the debug panel, added inside `host` (the sticky header): only the active tab's folders are shown.
 * `always` elements (the header) stay visible on every tab. Folders created later (e.g. the inspector's "Selected") join `lateTab`.
 * The last open tab is remembered across reloads.
 */
export function addTabs(gui: GUI, host: HTMLElement, tabs: DebugTab[], opts: { always: HTMLElement[]; lateTab: string }) {
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }
    const container = gui.$children;
    const bar = document.createElement('div');
    bar.className = 'cv-debug-tabs';
    host.appendChild(bar);
    for (const el of opts.always) el.dataset.tab = 'always';

    const buttons = new Map<string, HTMLButtonElement>();
    for (const tab of tabs) {
        for (const f of tab.folders) {
            f.domElement.dataset.tab = tab.id;
            if (tab.folders.length === 1) f.domElement.classList.add('cv-tab-solo');   // the tab already names it
            f.open();
        }
        const b = document.createElement('button');
        b.textContent = tab.label;
        b.addEventListener('click', () => show(tab.id));
        bar.appendChild(b);
        buttons.set(tab.id, b);
    }

    function show(id: string) {
        if (!buttons.has(id)) id = tabs[0].id;
        for (const el of Array.from(container.children) as HTMLElement[]) {
            const t = el.dataset.tab;
            if (t) el.style.display = t === id || t === 'always' ? '' : 'none';
        }
        for (const [tid, b] of buttons) b.classList.toggle('active', tid === id);
        storage.set('debugTab', id);
    }

    // Folders added later (the inspector's "Selected") belong to lateTab
    new MutationObserver(records => {
        let added = false;
        for (const r of records) for (const n of Array.from(r.addedNodes)) {
            if (n instanceof HTMLElement && n !== bar && !n.dataset.tab) { n.dataset.tab = opts.lateTab; added = true; }
        }
        if (added) show(bar.querySelector('button.active') ? [...buttons].find(([, b]) => b.classList.contains('active'))![0] : opts.lateTab);
    }).observe(container, { childList: true });

    show(storage.get('debugTab') ?? tabs[0].id);
    return { show };
}
