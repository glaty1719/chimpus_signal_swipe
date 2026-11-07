import {Scene} from "phaser";
import {DATA_ASSET_KEYS} from "../constants/AssetsKeys.ts";
import {Animation} from '../types/types.ts';

export class DataUtils {

    static getAnimations(scene: Scene): Animation[] {
        return scene.cache.json.get(DATA_ASSET_KEYS.ANIMATIONS);
    }

    static getSignalsData(scene: Scene): any {
        return scene.cache.json.get(DATA_ASSET_KEYS.SIGNALS);
    }
}