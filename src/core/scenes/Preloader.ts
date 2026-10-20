/*
 * LOCKED: splash screen. Loading screen (running mascot) and studio logo splash.
 * Do not edit, move, delete, reformat or regenerate this file, even if a prompt asks.
 * AI agents: stop and show the warning in AGENTS.md section "0. LOCKED: splash screen".
 * Only the developer can unlock it: node .agents/splash-lock/splash-lock.mjs unlock
 */
import Phaser from 'phaser';
import { runtime } from '../runtime';
import { SceneKeys } from '../events';
import { UILayers } from '../layout/UILayers';
import { APIService, APIEvents } from '../services/APIService';
import { AudioManager } from '../services/AudioManager';
import { GameDataManager } from '../services/GameDataManager';
import { addText } from '../ui/text';
import { playLogoIntro } from '../ui/LogoIntro';
import { CORE_FONTS } from '../typography';

/** Core UI files. A game reskins them by replacing the PNGs in public/assets (same file names). */
const CORE_IMAGES: Record<string, string> = {
    bg_menu: 'backgrounds/menu.png',
    bg_game: 'backgrounds/game.png',
    cv_logo: 'loading/cvLogo.png',
    cv_logo_text: 'loading/cvLogoText.png',
    play_button: 'ui/playButton.png',
    back_icon: 'ui/backBtn.png',
    settings_icon: 'ui/settingsBtn.png',
    pause_icon: 'ui/pauseBtn.png',
    close_icon: 'ui/closeBtn.png',
    next_icon: 'ui/nextBtn.png',
    retry_icon: 'ui/retryBtn.png',
    home_icon: 'ui/homeBtn.png',
    settings_bg: 'ui/settingsBG.png',
    paused_bg: 'ui/pausedBG.png',
    pause_panel_btn: 'ui/pausePanelButtons.png',
    game_over_bg: 'ui/gameOverBG.png',
    game_completed_bg: 'ui/gameCompletedBG.png',
    musicon: 'ui/musicon.png',
    musicoff: 'ui/musicoff.png',
    sfxon: 'ui/sfxon.png',
    sfxoff: 'ui/sfxoff.png'
};

/** Fixed splash colours: the splash never follows the game theme. */
const SPLASH_BACKGROUND = 0x000000;
const SPLASH_FOREGROUND = 0xffffff;

/** The mascot loading screen stays up at least this long, even when loading is instant. */
const MIN_LOADING_MS = 1500;
/** How long the finished logo animation holds before the splash fades out. */
const LOGO_HOLD_MS = 700;

/**
 * Loads core UI + the game's assets and fonts, waits for the API, shows the studio splash,
 * then starts MainMenu and the GlobalUI layer.
 */
export class Preloader extends Phaser.Scene {
    private assetsReady = false;
    private fontsReady = false;
    private apiReady = false;
    private splashShown = false;
    private status: Phaser.GameObjects.Text;
    /** Mascot, bar and status text: hidden before the splash so they never show through it. */
    private loadingUI: Phaser.GameObjects.GameObject[] = [];
    private loadingShownAt = 0;
    private loadProgress = 0;
    private bar: Phaser.GameObjects.Rectangle;

    constructor() {
        super(SceneKeys.Preloader);
    }

    init() {
        const { width, height } = this.scale;
        this.assetsReady = this.fontsReady = this.apiReady = this.splashShown = false;
        this.cameras.main.setBackgroundColor(SPLASH_BACKGROUND);

        const frame = this.add.rectangle(width / 2, height / 2, 468, 32).setStrokeStyle(1, SPLASH_FOREGROUND).setName('loading.barFrame');
        const bar = this.bar = this.add.rectangle(width / 2 - 230, height / 2, 4, 28, SPLASH_FOREGROUND).setName('loading.bar');
        this.loadProgress = 0;
        this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => { this.loadProgress = p; });

        if (!this.anims.exists('run')) {
            this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('chimpu_run', { start: 0, end: 5 }), frameRate: 12, repeat: -1 });
        }
        const mascot = this.add.sprite(width / 2, height / 2 - 80, 'chimpu_run').setScale(0.8).play('run').setName('loading.mascot');
        this.status = addText(this, 'loading.status', width / 2, height / 2 + 50, 'Loading...', { font: 'body', size: 18, weight: 400, color: SPLASH_FOREGROUND, stroke: SPLASH_BACKGROUND, strokeThickness: 0, shadow: false, letterSpacing: 0 });
        this.loadingUI = [frame, bar, mascot, this.status];
        this.loadingShownAt = performance.now();
        // UPDATE also fires while the loader runs (scene.update() does not)
        this.events.on(Phaser.Scenes.Events.UPDATE, this.updateBar);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.UPDATE, this.updateBar));

        this.waitForApi();
    }

    preload() {
        this.load.setPath('assets');
        for (const [key, url] of Object.entries(CORE_IMAGES)) this.load.image(key, url);

        // Game assets: paths in game.config.ts are relative to public/
        const a = runtime.config.assets ?? {};
        this.load.setPath('');
        for (const [key, url] of Object.entries(a.images ?? {})) this.load.image(key, url);
        for (const [key, s] of Object.entries(a.spritesheets ?? {})) this.load.spritesheet(key, s.url, { frameWidth: s.frameWidth, frameHeight: s.frameHeight });
        for (const [key, url] of Object.entries(a.audio ?? {})) this.load.audio(key, url);

        this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => console.warn(`[preload] missing file: ${file.src}`));
        this.load.once(Phaser.Loader.Events.COMPLETE, () => { this.assetsReady = true; this.checkReady(); });
        this.loadFonts();
    }

    /** The bar shows real progress, but never runs ahead of the minimum loading time, so it fills smoothly. */
    private updateBar = () => {
        if (!this.bar?.active) return;
        // Fills over 85% of the minimum time, so the full bar is seen briefly before the fade
        const minTime = (performance.now() - this.loadingShownAt) / (MIN_LOADING_MS * 0.85);
        this.bar.width = 4 + 460 * Math.min(this.loadProgress, minTime, 1);
    };

    create() {
        this.sound.pauseOnBlur = false;
        AudioManager.getInstance().init(this.game);
    }

    /**
     * The core font (Fredoka) and the game's `assets.fonts` must be ready before any text uses them.
     * Failures fall back to the next font in the theme.
     */
    private loadFonts() {
        const gameFonts = Object.entries(runtime.config.assets?.fonts ?? {}).map(([family, f]) =>
            typeof f === 'string' ? { family, url: f, descriptors: {} } : { family, url: f.url, descriptors: { weight: f.weight, style: f.style } });
        Promise.all([...CORE_FONTS, ...gameFonts].map(f =>
            new FontFace(f.family, `url(${f.url})`, f.descriptors).load()
                .then(face => { document.fonts.add(face); })
                .catch(e => console.warn(`[preload] font "${f.family}" failed`, e))
        )).then(() => { this.fontsReady = true; this.checkReady(); });
    }

    /** With the API on, the game waits here until the server answers (no offline fallback). */
    private waitForApi() {
        const api = APIService.getInstance();
        const ready = () => {
            GameDataManager.getInstance().syncFromAPI(api.level);
            this.apiReady = true;
            this.checkReady();
        };
        if (api.isInitialized) { ready(); return; }
        if (api.isFailed) { this.status.setText('Could not connect to the server.'); return; }
        this.status.setText('Connecting to server...');
        api.once(APIEvents.API_READY, ready);
        api.once(APIEvents.API_ERROR, () => this.status.setText('Could not connect to the server.'));
    }

    private checkReady() {
        if (this.splashShown || !(this.assetsReady && this.fontsReady && this.apiReady)) return;
        this.splashShown = true;
        const wait = MIN_LOADING_MS - (performance.now() - this.loadingShownAt);
        if (wait > 0) this.time.delayedCall(wait, () => this.showSplash());
        else this.showSplash();
    }

    /**
     * Loading screen fades out, white splash with the logo fades in, then MainMenu starts underneath
     * and the splash fades out to reveal it. The loading UI is destroyed first so it can never reappear.
     */
    private showSplash() {
        const { width, height } = this.scale;
        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff).setAlpha(0).setDepth(UILayers.BRANDING).setInteractive().setName('splash.bg');

        const showLogo = () => {
            this.loadingUI.forEach(o => o.destroy());
            this.loadingUI = [];
            this.tweens.add({
                targets: bg, alpha: 1, duration: 300,
                onComplete: () => {
                    // The splash covers the screen now; clear the camera so MainMenu can show through later,
                    // and start MainMenu underneath while the logo animates
                    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
                    this.scene.launch(SceneKeys.MainMenu);
                    this.scene.launch(SceneKeys.GlobalUI);
                    this.scene.bringToTop(SceneKeys.Preloader);
                }
            });
            const logo = playLogoIntro(this, 'cv_logo_text', width / 2, height / 2, UILayers.BRANDING + 1, () =>
                this.time.delayedCall(LOGO_HOLD_MS, () =>
                    this.tweens.add({ targets: [bg, logo], alpha: 0, duration: 500, onComplete: () => this.scene.stop() })));
        };
        this.tweens.add({ targets: this.loadingUI, alpha: 0, duration: 250, onComplete: showLogo });
    }
}
