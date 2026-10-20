import Phaser from 'phaser';
import { AudioManager } from '../services/AudioManager';
import { IconButton } from './IconButton';
import { Modal } from './Modal';
import { Slider } from './Slider';

/**
 * Standard settings modal: music and sound volume with mute toggles.
 * Named: settingsPanel, settingsPanel.bg, settingsPanel.musicToggle, settingsPanel.musicSlider,
 * settingsPanel.sfxToggle, settingsPanel.sfxSlider, settingsPanel.closeButton.
 */
export class SettingsPanel extends Modal {
    private readonly sliders: Slider[] = [];

    constructor(scene: Phaser.Scene, onClose: () => void = () => { }) {
        super(scene, 'settingsPanel');
        const audio = AudioManager.getInstance();

        this.content.add(scene.add.image(0, 0, 'settings_bg').setName('settingsPanel.bg'));

        this.addChannel(scene, 'music', -40, {
            muted: () => audio.isMusicMuted(),
            volume: () => audio.getMusicVolume(),
            setMuted: m => audio.setMusicMuted(m),
            setVolume: v => audio.setMusicVolume(v),
            iconOn: 'musicon', iconOff: 'musicoff'
        });
        this.addChannel(scene, 'sfx', 80, {
            muted: () => audio.isSFXMuted(),
            volume: () => audio.getSFXVolume(),
            setMuted: m => audio.setSFXMuted(m),
            setVolume: v => audio.setSFXVolume(v),
            iconOn: 'sfxon', iconOff: 'sfxoff'
        });

        const close = new IconButton(scene, 'settingsPanel.closeButton', 210, 185, 'close_icon', () => this.close(onClose));
        this.content.add(close.sprite);
    }

    /** One row: mute toggle + volume slider, kept in sync both ways. */
    private addChannel(scene: Phaser.Scene, id: 'music' | 'sfx', y: number, ch: {
        muted(): boolean; volume(): number; setMuted(m: boolean): void; setVolume(v: number): void;
        iconOn: string; iconOff: string;
    }) {
        let lastVolume = ch.volume() > 0 ? ch.volume() : 0.5;
        const icon = () => (ch.muted() ? ch.iconOff : ch.iconOn);

        const toggle = new IconButton(scene, `settingsPanel.${id}Toggle`, -140, y, icon(), () => {
            const mute = !ch.muted();
            if (mute) lastVolume = ch.volume() || lastVolume;
            ch.setMuted(mute);
            if (!mute) ch.setVolume(lastVolume);
            slider.setValue(mute ? 0 : Math.round(lastVolume * 100), false, true);
            toggle.setTexture(icon());
        });

        const slider = new Slider(scene, `settingsPanel.${id}Slider`, -80, y, 260, value => {
            const v = value / 100;
            ch.setVolume(v);
            if (v > 0) lastVolume = v;
            if ((value === 0) !== ch.muted()) ch.setMuted(value === 0);
            toggle.setTexture(icon());
        }, ch.muted() ? 0 : Math.round(ch.volume() * 100));

        this.sliders.push(slider);
        this.content.add([slider.container, toggle.sprite]);
    }

    public override destroy() {
        this.sliders.forEach(s => s.destroy());   // removes their global pointer listeners
        super.destroy();
    }
}
