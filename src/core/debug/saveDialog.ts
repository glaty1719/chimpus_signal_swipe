/** One pending change, as the Save dialog shows it. */
export interface PendingChange {
    id: string;
    file: 'tuning.json' | 'game.config.ts';
    label: string;
    from: string;
    to: string;
    /** Set when the values are colors: shown as swatches. */
    colors?: { from?: number; to?: number };
}

const PROP_NAMES: Record<string, string> = {
    size: 'size', weight: 'boldness', color: 'text color', stroke: 'outline color', strokeThickness: 'outline thickness',
    letterSpacing: 'letter spacing', shadow: 'shadow', shadowColor: 'shadow color'
};

/** "theme.typography.heading.strokeThickness" → "Text · heading · outline thickness". */
export function describeKey(key: string): string {
    if (key.startsWith('layout|')) {
        const [, name, axis] = key.split('|');
        return `Position · ${name} (${axis === 'dx' ? 'x' : 'y'})`;
    }
    const p = key.split('.');
    if (p[0] === 'theme' && p[1] === 'typography') return `Text · ${p[2]} · ${PROP_NAMES[p[3]] ?? p[3]}`;
    if (p[0] === 'theme' && p[1] === 'colors') return `Colors · ${p[2]}`;
    if (p[0] === 'theme' && p[1] === 'fonts') return `Fonts · ${p[2]}`;
    if (p[0] === 'settings') return `Settings · ${p[1]}`;
    return key;
}

const STYLE_ID = 'cv-save-dialog-style';
const CSS = `
.cv-sd-overlay { position: fixed; inset: 0; z-index: 10050; display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.55); font: 13px/1.4 system-ui, sans-serif; color: #eee; }
.cv-sd-card { width: 520px; max-width: 92vw; max-height: 82vh; display: flex; flex-direction: column; background: #1f1f24;
    border: 1px solid #3a3a44; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.6); overflow: hidden; }
.cv-sd-head { padding: 16px 18px 8px; }
.cv-sd-head h3 { margin: 0 0 4px; font-size: 17px; }
.cv-sd-head p { margin: 0; opacity: .65; font-size: 12px; }
.cv-sd-all { display: flex; align-items: center; gap: 8px; padding: 6px 18px 8px; border-bottom: 1px solid #33333c; font-weight: 600; }
.cv-sd-list { overflow-y: auto; padding: 4px 10px 10px; }
.cv-sd-group { margin: 10px 8px 4px; font-size: 11px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: #b388ff; }
.cv-sd-row { display: grid; grid-template-columns: 18px 1fr auto; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
.cv-sd-row:hover { background: #2a2a32; }
.cv-sd-row.off { opacity: .45; }
.cv-sd-val { font: 12px ui-monospace, Consolas, monospace; white-space: nowrap; opacity: .9; }
.cv-swatch { display: inline-block; width: 11px; height: 11px; border-radius: 3px; margin-right: 4px; vertical-align: -1px; border: 1px solid rgba(255,255,255,.35); }
.cv-sd-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 18px; border-top: 1px solid #33333c; }
.cv-sd-foot button { border: 0; border-radius: 8px; padding: 8px 14px; font: 600 13px system-ui, sans-serif; cursor: pointer; background: #33333c; color: #eee; }
.cv-sd-foot button.primary { background: #7b3fa0; color: #fff; }
.cv-sd-foot button:disabled { opacity: .4; cursor: default; }
`;

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

/**
 * Shows the pending changes grouped by file, each with a checkbox. Resolves with the ids to save,
 * or null when cancelled (Esc, Cancel or a click outside).
 */
export function openSaveDialog(changes: PendingChange[]): Promise<string[] | null> {
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }
    return new Promise(resolve => {
        const chosen = new Set(changes.map(c => c.id));
        const overlay = document.createElement('div');
        overlay.className = 'cv-sd-overlay';
        overlay.innerHTML = `<div class="cv-sd-card" role="dialog" aria-label="Save changes">
            <div class="cv-sd-head"><h3>Save changes</h3><p>Pick what to keep. Unticked changes stay unsaved.</p></div>
            <label class="cv-sd-all"><input type="checkbox" checked> Select all</label>
            <div class="cv-sd-list"></div>
            <div class="cv-sd-foot"><button class="cancel">Cancel</button><button class="primary save"></button></div>
        </div>`;
        const list = overlay.querySelector('.cv-sd-list') as HTMLElement;
        const all = overlay.querySelector('.cv-sd-all input') as HTMLInputElement;
        const save = overlay.querySelector('.save') as HTMLButtonElement;
        const boxes: { id: string; box: HTMLInputElement; row: HTMLElement }[] = [];

        const value = (text: string, color?: number) => {
            const span = document.createElement('span');
            if (color !== undefined) { const sw = document.createElement('span'); sw.className = 'cv-swatch'; sw.style.background = hex(color); span.appendChild(sw); }
            span.append(text);
            return span;
        };
        for (const file of ['tuning.json', 'game.config.ts'] as const) {
            const group = changes.filter(c => c.file === file);
            if (!group.length) continue;
            const h = document.createElement('div');
            h.className = 'cv-sd-group';
            h.textContent = file === 'tuning.json' ? 'tuning.json' : 'src/game/game.config.ts';
            list.appendChild(h);
            for (const c of group) {
                const row = document.createElement('label');
                row.className = 'cv-sd-row';
                const box = document.createElement('input');
                box.type = 'checkbox';
                box.checked = true;
                const name = document.createElement('span');
                name.textContent = c.label;
                const val = document.createElement('span');
                val.className = 'cv-sd-val';
                val.append(value(c.from, c.colors?.from), ' → ', value(c.to, c.colors?.to));
                row.append(box, name, val);
                list.appendChild(row);
                boxes.push({ id: c.id, box, row });
                box.addEventListener('change', () => { if (box.checked) chosen.add(c.id); else chosen.delete(c.id); sync(); });
            }
        }
        function sync() {
            for (const b of boxes) { b.box.checked = chosen.has(b.id); b.row.classList.toggle('off', !chosen.has(b.id)); }
            all.checked = chosen.size === boxes.length;
            all.indeterminate = chosen.size > 0 && chosen.size < boxes.length;
            save.textContent = `💾 Save ${chosen.size} change${chosen.size === 1 ? '' : 's'}`;
            save.disabled = chosen.size === 0;
        }
        all.addEventListener('change', () => { for (const b of boxes) all.checked ? chosen.add(b.id) : chosen.delete(b.id); sync(); });

        const close = (result: string[] | null) => {
            window.removeEventListener('keydown', onKey, true);
            overlay.remove();
            resolve(result);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(null); }
            else if (e.key === 'Enter' && !save.disabled) { e.preventDefault(); e.stopPropagation(); close([...chosen]); }
        };
        window.addEventListener('keydown', onKey, true);
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(null); });
        (overlay.querySelector('.cancel') as HTMLButtonElement).addEventListener('click', () => close(null));
        save.addEventListener('click', () => close([...chosen]));
        sync();
        document.body.appendChild(overlay);
        save.focus();
    });
}
