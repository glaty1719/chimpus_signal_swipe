import { Scene } from 'phaser';
import {SCENE_KEYS} from "../../constants/SceneKeys.ts";
import {
    BATTLE_ASSET_KEYS,
    BATTLE_BACKGROUND_ASSET_KEYS, CHARACTER_ASSET_KEYS, DATA_ASSET_KEYS,
    HEALTH_BAR_ASSET_KEYS,
    MONSTER_ASSET_KEYS, UI_ASSET_KEYS, WORLD_ASSET_KEYS
} from "../../constants/AssetsKeys.ts";
import {DataUtils} from "../../utils/dataUtils.ts";

export class PreloadScene extends Scene
{
    constructor ()
    {
        super(SCENE_KEYS.PRELOAD_SCENE);
    }

    preload ()
    {
        this.load.setPath('assets');

        const monsterTamerAssetsPath = "images/monster-tamer";
        const kennyAssetsPath = "images/kenneys-assets";
        const axulArtAssetsPath = "images/axulart";
        const pbGamesAssetsPath = "images/parabellum-games";

        // battle backgrounds
        this.load.image(
            BATTLE_BACKGROUND_ASSET_KEYS.FOREST,
            `${monsterTamerAssetsPath}/battle-backgrounds/forest-background.png`
        );

        // battle assets
        this.load.image(
            BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND,
            `${kennyAssetsPath}/ui-space-expansion/custom-ui.png`
        );

        // health bar assets
        this.load.image(
            HEALTH_BAR_ASSET_KEYS.RIGHT_CAP,
            `${kennyAssetsPath}/ui-space-expansion/barHorizontal_green_right.png`
        );
        this.load.image(
            HEALTH_BAR_ASSET_KEYS.MIDDLE,
            `${kennyAssetsPath}/ui-space-expansion/barHorizontal_green_mid.png`
        );
        this.load.image(
            HEALTH_BAR_ASSET_KEYS.LEFT_CAP,
            `${kennyAssetsPath}/ui-space-expansion/barHorizontal_green_left.png`
        );

        // monster assets
        this.load.image(
            MONSTER_ASSET_KEYS.CARNODUSK,
            `${monsterTamerAssetsPath}/monsters/carnodusk.png`
        );
        this.load.image(
            MONSTER_ASSET_KEYS.IGUANIGNITE,
            `${monsterTamerAssetsPath}/monsters/iguanignite.png`
        );

        // ui assets
        this.load.image(UI_ASSET_KEYS.CURSOR, `${monsterTamerAssetsPath}/ui/cursor.png`);

        // load world assets
        this.load.image(WORLD_ASSET_KEYS.WORLD_BACKGROUND, `${monsterTamerAssetsPath}/map/city.png`);
        this.load.tilemapTiledJSON(WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL, '/data/city.json');
        this.load.image(WORLD_ASSET_KEYS.WORLD_COLLISION, `${monsterTamerAssetsPath}/map/collision.png`);
        this.load.image(WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE, `${monsterTamerAssetsPath}/map/encounter.png`);
        this.load.image(WORLD_ASSET_KEYS.WORLD_FOREGROUND, `${monsterTamerAssetsPath}/map/foreground.png`);

        // load character assets
        this.load.spritesheet(
            CHARACTER_ASSET_KEYS.PLAYER,
            `${axulArtAssetsPath}/character/custom.png`,
            {
                frameWidth: 64,
                frameHeight: 88,
            }
        );

        this.load.spritesheet(
            CHARACTER_ASSET_KEYS.NPC,
            `${pbGamesAssetsPath}/characters.png`,
            {
                frameWidth: 16,
                frameHeight: 16,
            }
        );

        // load json data
        this.load.json(DATA_ASSET_KEYS.ANIMATIONS, '/data/animations.json');
        this.load.json(DATA_ASSET_KEYS.SIGNALS, '/data/signals.json');
    }

    create () {
        this.#createAnimations();
        this.scene.start(SCENE_KEYS.WORLD_SCENE);
    }

    #createAnimations() {
        const animations = DataUtils.getAnimations(this);
        animations.forEach((animation) => {
            const frames = animation.frames
                ? this.anims.generateFrameNumbers(animation.assetKey, { frames: animation.frames })
                : this.anims.generateFrameNumbers(animation.assetKey);
        this.anims.create({
            key: animation.key,
            frames,
            frameRate: animation.frameRate,
            repeat: animation.repeat,
            delay: animation.delay,
            yoyo: animation.yoyo,
        })
        });
    }
}
