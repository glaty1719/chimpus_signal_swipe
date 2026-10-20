import type { Orientation } from '../config';

/**
 * RULE: everything outside the game canvas (letterbox bars) is pure black (#000).
 * Enforced with !important so page CSS cannot change it.
 */
export function enforceLetterbox(parent: string) {
    if (document.getElementById('cv-letterbox')) return;
    const style = document.createElement('style');
    style.id = 'cv-letterbox';
    style.textContent = `
        html, body { margin: 0 !important; padding: 0 !important; width: 100%; height: 100%;
                     background: #000 !important; overflow: hidden; overscroll-behavior: none; }
        #${parent} { width: 100%; height: 100%; background: #000 !important; }
        canvas { display: block; }
    `;
    document.head.appendChild(style);
}

/**
 * Landscape games on a phone held upright: show a "rotate your device" prompt
 * (iOS Safari does not allow locking orientation). On Android, try to lock on the first touch.
 * Portrait games scale to fit in either orientation and get no prompt.
 */
export function setupOrientation(orientation: Orientation) {
    tryLockOrientation(orientation);
    if (orientation !== 'landscape' || document.getElementById('cv-rotate')) return;

    const style = document.createElement('style');
    style.textContent = `
        #cv-rotate { display: none; position: fixed; inset: 0; z-index: 2147483647; background: #000;
                     color: #fff; font: 700 20px/1.4 Arial, sans-serif; text-align: center;
                     flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
        #cv-rotate .cv-phone { width: 48px; height: 84px; border: 4px solid #38bdf8; border-radius: 10px;
                               animation: cv-rotate 2.2s ease-in-out infinite; }
        @keyframes cv-rotate { 0%, 15% { transform: rotate(0); } 45%, 80% { transform: rotate(90deg); } 100% { transform: rotate(0); } }
        @media screen and (orientation: portrait) and (max-width: 1024px) and (pointer: coarse) {
            #cv-rotate { display: flex; }
        }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'cv-rotate';
    overlay.innerHTML = '<div class="cv-phone"></div><div>Please rotate your device</div>';
    document.body.appendChild(overlay);
}

function tryLockOrientation(orientation: Orientation) {
    const lock = () => {
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        o?.lock?.(orientation).catch(() => { /* not supported (iOS, desktop) */ });
    };
    window.addEventListener('pointerdown', lock, { once: true });
}
