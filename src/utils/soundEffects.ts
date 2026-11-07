/**
 * Web Audio API synthesizer for Chimpu's Signal Swipe sound effects.
 * Eliminates need for external audio files and guarantees zero 404s.
 */
class SoundEffects {
    #ctx: AudioContext | null = null;
    #muted: boolean = false;

    #getAudioContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.#ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.#ctx = new AudioCtx();
            }
        }
        if (this.#ctx && this.#ctx.state === 'suspended') {
            this.#ctx.resume().catch(() => {});
        }
        return this.#ctx;
    }

    get isMuted(): boolean {
        return this.#muted;
    }

    toggleMute(): boolean {
        this.#muted = !this.#muted;
        return this.#muted;
    }

    playCardArrive() {
        if (this.#muted) return;
        const ctx = this.#getAudioContext();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } catch (_) {}
    }

    playSwipe() {
        if (this.#muted) return;
        const ctx = this.#getAudioContext();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } catch (_) {}
    }

    playCorrect() {
        if (this.#muted) return;
        const ctx = this.#getAudioContext();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            // Rising chime: C5 -> E5 -> G5 -> C6
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                const startTime = now + idx * 0.05;
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.25);
            });
        } catch (_) {}
    }

    playWrong() {
        if (this.#muted) return;
        const ctx = this.#getAudioContext();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            // Soft blip
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(130, now + 0.15);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.16);
        } catch (_) {}
    }

    playMysteryEncounter() {
        if (this.#muted) return;
        const ctx = this.#getAudioContext();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            // Magical mystery sparkle
            const freqs = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                const startTime = now + idx * 0.04;
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.14, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.3);
            });
        } catch (_) {}
    }

    playStreak() {
        if (this.#muted) return;
        const ctx = this.#getAudioContext();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const notes = [659.25, 783.99, 987.77, 1318.51];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                const startTime = now + idx * 0.06;
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.18, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.35);
            });
        } catch (_) {}
    }
}

export const sfx = new SoundEffects();

