import Phaser from 'phaser';
import type { MainMenuConfig } from '../config';
import { addToolbar as createToolbar } from '../ui/Toolbar';
import { runtime } from '../runtime';
import { SceneKeys } from '../events';
import { UILayers } from '../layout/UILayers';
import { UIPositions } from '../layout/UIPositions';
import { AudioManager } from '../services/AudioManager';
import { IconButton } from '../ui/IconButton';
import { SettingsPanel } from '../ui/SettingsPanel';
import { addBackground, addText } from '../ui/text';
import { fadeIn, fadeToScene } from '../ui/transitions';

/** Landing screen: background art (with the game title in it), Play, and Settings in toolbar slot 0. */
export class MainMenu extends Phaser.Scene {
    constructor() {
        super(SceneKeys.MainMenu);
    }

    create() {
        fadeIn(this);
        const cfg = runtime.config.mainMenu ?? {};
        addBackground(this, 'menuBackground', cfg.background ?? 'bg_menu', UILayers.GAME_BACKGROUND);

        // Play button (image, size, position from config.mainMenu.playButton).
        // The pulse runs on the wrapper so it never fights the button's own hover/press scaling.
        const center = UIPositions.center(this);
        const pb = cfg.playButton ?? {};
        const play = new IconButton(this, 'playButton.icon', 0, 0, pb.texture ?? 'play_button', () => fadeToScene(this, SceneKeys.LevelSelection));
        if (pb.scale && pb.scale !== 1) play.sprite.setScale(play.sprite.scaleX * pb.scale, play.sprite.scaleY * pb.scale);
        const playWrap = this.add.container(pb.x ?? center.x, pb.y ?? center.y + (UIPositions.isPortrait(this) ? 200 : 100), [play.sprite])
            .setName('playButton')
            .setDepth(UILayers.UI_BUTTONS);
        if (pb.pulse !== false) this.tweens.add({ targets: playWrap, scale: 1.1, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        if (cfg.title) this.addTitle(cfg.title);

        createToolbar(this, [{ name: 'settingsButton', texture: 'settings_icon', onClick: () => new SettingsPanel(this) }]);

        const music = runtime.config.music?.menu;
        if (music) AudioManager.getInstance().playMusic(music);
    }

    /** Optional game title (config.mainMenu.title): an image or a text, named 'menuTitle'. */
    private addTitle(t: NonNullable<MainMenuConfig['title']>) {
        const x = t.x ?? this.scale.width / 2, y = t.y ?? this.scale.height * 0.22;
        const title = t.image
            ? this.add.image(x, y, t.image).setName('menuTitle')
            : addText(this, 'menuTitle', x, y, t.text ?? runtime.config.title, { style: 'title' });
        title.setScale(t.scale ?? 1).setDepth(UILayers.UI_TEXT);
    }
}
