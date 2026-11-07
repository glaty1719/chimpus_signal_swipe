import {Character} from "./Character.ts";
import {PlayerConfig} from "../../types/types.ts";
import {CHARACTER_ASSET_KEYS} from "../../constants/AssetsKeys.ts";
import {DIRECTION, DIRECTION_KEYS} from "../../constants/playerInput.ts";
import {exhaustiveGuard} from "../../utils/guard.ts";

export class Player extends Character {
    constructor(config: PlayerConfig) {
        super({
            ...config,
            origin: {x: 0, y: 0.2},
            assetKey: CHARACTER_ASSET_KEYS.PLAYER,
            idleDirection: DIRECTION.DOWN,
        });
    }

    moveCharacter(direction: DIRECTION_KEYS) {
        super.moveCharacter(direction);

        switch (direction) {
            case DIRECTION.LEFT:
            case DIRECTION.RIGHT:
            case DIRECTION.UP:
            case DIRECTION.DOWN:
                if (
                    !this._phaserGameObject.anims.isPlaying ||
                    this._phaserGameObject.anims.currentAnim?.key !== `PLAYER_${this.direction}`
                ){
                    this._phaserGameObject.play(`PLAYER_${this._direction}`);
                }
                break;
            case DIRECTION.NONE:
                break;
            default:
                exhaustiveGuard(this._direction);
        }
    }
}