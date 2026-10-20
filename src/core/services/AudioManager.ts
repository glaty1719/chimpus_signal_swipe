import Phaser from 'phaser';
import { storage } from './storage';

interface AudioSettings {
    musicVolume: number;
    sfxVolume: number;
    musicMuted: boolean;
    sfxMuted: boolean;
}

/**
 * All sound goes through here: one music track, sound effects, and one voice channel
 * (a new voice line stops the previous one). Volumes and mutes persist per game.
 * RULE: never call scene.sound directly from gameplay.
 */
export class AudioManager {
    private static instance: AudioManager;

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) AudioManager.instance = new AudioManager();
        return AudioManager.instance;
    }

    private game: Phaser.Game | null = null;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private currentVoice: Phaser.Sound.BaseSound | null = null;
    private s: AudioSettings = { musicVolume: 0.5, sfxVolume: 0.5, musicMuted: false, sfxMuted: false };

    private constructor() { }

    /** Called once by the Preloader. */
    public init(game: Phaser.Game) {
        this.game = game;
        this.s = { ...this.s, ...storage.getJSON<Partial<AudioSettings>>('audio', {}) };
    }

    private save() { storage.setJSON('audio', this.s); }

    private has(key: string) { return !!this.game && this.game.cache.audio.exists(key); }

    private applyMusicVolume() {
        const music = this.currentMusic as Phaser.Sound.WebAudioSound | null;
        music?.setVolume(this.s.musicMuted ? 0 : this.s.musicVolume);
    }

    public playMusic(key: string, loop = true) {
        if (!this.game) return;
        if (this.currentMusic?.key === key && this.currentMusic.isPlaying) return;
        this.stopMusic();
        if (!this.has(key)) return;
        this.currentMusic = this.game.sound.add(key, { loop, volume: this.s.musicMuted ? 0 : this.s.musicVolume });
        this.currentMusic.play();
    }

    public stopMusic() {
        this.currentMusic?.stop();
        this.currentMusic?.destroy();
        this.currentMusic = null;
    }

    public playSFX(key: string, volScale = 1) {
        if (!this.game || this.s.sfxMuted || !this.has(key)) return;
        this.game.sound.play(key, { volume: this.s.sfxVolume * volScale });
    }

    /** Single voice channel: starting a voice line stops the previous one. Follows the SFX mute. */
    public playVoice(key: string) {
        this.stopVoice();
        if (!this.game || this.s.sfxMuted || !this.has(key)) return;
        this.currentVoice = this.game.sound.add(key, { volume: this.s.sfxVolume });
        this.currentVoice.once(Phaser.Sound.Events.COMPLETE, () => this.stopVoice());
        this.currentVoice.play();
    }

    public stopVoice() {
        this.currentVoice?.stop();
        this.currentVoice?.destroy();
        this.currentVoice = null;
    }

    public setMusicVolume(volume: number) {
        this.s.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
        this.applyMusicVolume();
        this.save();
    }

    public setSFXVolume(volume: number) {
        this.s.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
        this.save();
    }

    public setMusicMuted(muted: boolean) {
        this.s.musicMuted = muted;
        this.applyMusicVolume();
        this.save();
    }

    public setSFXMuted(muted: boolean) {
        this.s.sfxMuted = muted;
        if (muted) this.stopVoice();
        this.save();
    }

    public getMusicVolume() { return this.s.musicVolume; }
    public getSFXVolume() { return this.s.sfxVolume; }
    public isMusicMuted() { return this.s.musicMuted; }
    public isSFXMuted() { return this.s.sfxMuted; }
}
