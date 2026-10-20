import { lookColors } from './look';

export type Channel = 'ai' | 'automation' | 'manual';

export const CHANNELS: { id: Channel; label: string; symbol: string }[] = [
    { id: 'automation', label: 'FIXED AUTOMATION', symbol: '⚙' },
    { id: 'ai', label: 'AI FEATURE', symbol: '✦' },
    { id: 'manual', label: 'MANUAL TOOL', symbol: '✋' }
];

/** Channel tints: cyan AI, amber automation, coral manual. */
export function channelColor(channel: Channel): number {
    if (channel === 'ai') return lookColors.highlight;
    if (channel === 'automation') return lookColors.sliderFill;
    return lookColors.cardHover;
}

export function prefersReducedMotion() {
    return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}
