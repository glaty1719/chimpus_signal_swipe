import type { Controller } from 'lil-gui';

/** default: the code's value · custom: saved, but differs from the code · unsaved: changed and not saved yet */
export type MarkState = 'default' | 'custom' | 'unsaved';

const STYLE_ID = 'cv-debug-marks-style';
const CSS = `
.lil-gui .cv-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; vertical-align: middle; flex: none; }
.lil-gui .controller[data-mark=unsaved] .cv-dot { background: #ffcf3f; }
.lil-gui .controller[data-mark=custom] .cv-dot { background: #b388ff; }
.lil-gui .controller .cv-reset { width: auto !important; flex: none; margin-left: 4px; padding: 0 6px; height: var(--widget-height);
    border: 0; border-radius: 4px; background: var(--widget-color); color: var(--text-color); cursor: pointer; font-size: 12px; }
.lil-gui .controller .cv-reset:hover { filter: brightness(1.3); }
`;

/**
 * Change markers for debug panel controls: a dot before the name (yellow = unsaved, purple = saved but not the
 * code default) and a ↺ button that puts the control back to its default. The reset goes through the control's
 * own change handlers, so live preview, screen refresh and the unsaved counter all react as usual.
 */
export function createChangeMarks() {
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }
    const items: { ctrl: Controller; key: string; dot: HTMLElement; reset: HTMLButtonElement }[] = [];

    /**
     * `defaultValue` is in the control's own terms (a hex string for color pickers). `finish` for controls that
     * react on finishing an edit (onFinishChange) rather than on every change.
     */
    function track(ctrl: Controller, key: string, defaultValue: () => unknown, finish = false) {
        const dot = document.createElement('span');
        dot.className = 'cv-dot';
        ctrl.$name.prepend(dot);
        const reset = document.createElement('button');
        reset.className = 'cv-reset';
        reset.textContent = '↺';
        reset.addEventListener('click', e => {
            e.stopPropagation();
            ctrl.setValue(defaultValue());
            if (finish) (ctrl as unknown as { _callOnFinishChange(): void })._callOnFinishChange();
        });
        ctrl.domElement.appendChild(reset);
        items.push({ ctrl, key, dot, reset });
        return ctrl;
    }

    function refresh(stateOf: (key: string) => MarkState) {
        for (const it of items) {
            const state = stateOf(it.key);
            it.ctrl.domElement.dataset.mark = state;
            it.reset.style.visibility = state === 'default' ? 'hidden' : 'visible';
            it.reset.title = state === 'default' ? '' : 'Back to the default';
            it.dot.title = state === 'unsaved' ? 'Changed, not saved yet' : state === 'custom' ? 'Saved, differs from the code default' : '';
        }
    }

    return { track, refresh };
}
