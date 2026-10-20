let el: HTMLDivElement | null = null;
let timer: number | undefined;

/** A small note at the bottom of the screen that fades out. Amber border when `warn`. */
export function showToast(text: string, warn = false, ms = 1800) {
    if (!el) {
        el = document.createElement('div');
        el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:10060;background:#1f1f24;'
            + 'color:#eee;font:13px/1.4 system-ui,sans-serif;padding:8px 14px;border-radius:8px;border:1px solid #7b3fa0;'
            + 'box-shadow:0 6px 20px rgba(0,0,0,.45);pointer-events:none;opacity:0;transition:opacity .2s;white-space:pre-line;'
            + 'max-width:90vw;text-align:center;';
        document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.borderColor = warn ? '#f59e0b' : '#7b3fa0';
    el.style.opacity = '1';
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { if (el) el.style.opacity = '0'; }, ms);
}
