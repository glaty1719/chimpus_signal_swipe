const STYLE_ID = 'cv-debug-header-style';
const CSS = `
.cv-debug-header { position: sticky; top: 0; z-index: 3; background: var(--background-color); box-shadow: 0 4px 6px -4px rgba(0,0,0,.6); }
.cv-save-row { display: flex; align-items: center; gap: 5px; padding: 7px 6px 3px; }
.cv-save-status { flex: 1; min-width: 0; font: 11px/1.2 system-ui, sans-serif; color: var(--text-color); opacity: .6;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cv-save-status.dirty { opacity: 1; color: #ffcf3f; font-weight: 600; }
.cv-save-row button { width: auto !important; padding: 5px 8px; border: 0; border-radius: 6px; cursor: pointer;
    background: var(--widget-color); color: var(--text-color); font: 600 11px/1 system-ui, sans-serif; }
.cv-save-row button.primary { background: #7b3fa0; color: #fff; }
.cv-save-row button:disabled { opacity: .35; cursor: default; }
.cv-save-row button:not(:disabled):hover { filter: brightness(1.2); }
`;

/**
 * The debug panel's sticky header: one compact Save row ("● 3 unsaved changes  [💾 Save] [↺ Discard]").
 * The tab bar is added below it by tabs.ts. It stays pinned at the top while the panel scrolls.
 */
export function createSaveBar(opts: { canSave: boolean; onSave: () => void; onDiscard: () => void }) {
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }
    const header = document.createElement('div');
    header.className = 'cv-debug-header';
    const row = document.createElement('div');
    row.className = 'cv-save-row';
    const status = document.createElement('span');
    status.className = 'cv-save-status';
    row.appendChild(status);

    const button = (label: string, title: string, onClick: () => void, primary = false) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.title = title;
        if (primary) b.classList.add('primary');
        b.addEventListener('click', onClick);
        row.appendChild(b);
        return b;
    };
    const save = opts.canSave ? button('💾 Save', 'Review and save your changes', opts.onSave, true) : null;
    const discard = button('↺ Discard', 'Throw away unsaved changes and reload', opts.onDiscard);
    header.appendChild(row);

    /** Show the number of unsaved changes and enable the buttons accordingly. */
    function update(unsaved: number) {
        status.classList.toggle('dirty', unsaved > 0);
        status.textContent = unsaved > 0
            ? `● ${unsaved} unsaved change${unsaved > 1 ? 's' : ''}${opts.canSave ? '' : ' (preview only)'}`
            : opts.canSave ? 'No unsaved changes' : 'Preview only: not saved';
        if (save) save.disabled = unsaved === 0;
        discard.disabled = unsaved === 0;
    }
    update(0);
    return { header, update };
}
