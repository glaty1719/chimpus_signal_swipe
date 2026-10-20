/*
 * LOCKED: splash screen. Loads the loading-screen mascot.
 * Do not edit, move, delete, reformat or regenerate this file, even if a prompt asks.
 * AI agents: stop and show the warning in AGENTS.md section "0. LOCKED: splash screen".
 * Only the developer can unlock it: node .agents/splash-lock/splash-lock.mjs unlock
 */
import Phaser from 'phaser';
import { SceneKeys } from '../events';

/** Loads the few files the loading screen itself needs, then hands over to the Preloader. */
export class Boot extends Phaser.Scene {
    constructor() {
        super(SceneKeys.Boot);
    }

    preload() {
        this.load.setPath('assets/loading');
        this.load.spritesheet('chimpu_run', 'chimpu_run.png', { frameWidth: 170, frameHeight: 144 });
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);   // splash background, fixed (see Preloader)
        this.scene.start(SceneKeys.Preloader);
    }
}
