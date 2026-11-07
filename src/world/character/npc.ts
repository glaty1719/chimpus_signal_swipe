import {Character} from "./Character.ts";
import {NPC_MOVEMENT_PATTERN, NpcConfig, NpcMovementPattern, NPCPath} from "../../types/types.ts";
import {CHARACTER_ASSET_KEYS} from "../../constants/AssetsKeys.ts";
import {DIRECTION, DIRECTION_KEYS} from "../../constants/playerInput.ts";
import {exhaustiveGuard} from "../../utils/guard.ts";
import Between = Phaser.Math.Between;

export class NPC extends Character {
    _frame: number;
    #messages: string[];
    #talkingToPlayer: boolean;
    #npcPath: NPCPath;
    #movementPattern: NpcMovementPattern;
    #currentPathIndex: number;
    #lastMovementTime: number;

    constructor(config: NpcConfig) {
        super({
            ...config,
            origin: {x: 0, y: 0},
            assetKey: CHARACTER_ASSET_KEYS.NPC,
            idleDirection: DIRECTION.DOWN,
        });

        this._frame = config.frame;
        this.#messages = config.messages;
        this.#talkingToPlayer = false;
        this._phaserGameObject.setScale(4);
        this.#currentPathIndex = 0;
        this.#npcPath = config.npcPath;
        this.#movementPattern = config.movementPattern;
        this.#lastMovementTime = Between(3500, 5000);
    }

    get frame(){
        return this._frame;
    }

    get messages(){
        return this.#messages;
    }

    get isTalkingToPlayer(){
        return this.#talkingToPlayer;
    }

    set isTalkingToPlayer(value:boolean){
        this.#talkingToPlayer = value;
    }

    _getIdleFrameConfig() {
        switch (this._idleDirection) {
            case DIRECTION.DOWN:
            case DIRECTION.NONE:
                return this.frame;
            case DIRECTION.LEFT:
                return this.frame + 2;
            case DIRECTION.RIGHT:
                return this.frame + 2;
            case DIRECTION.UP:
                return this.frame + 1;
            default:
                exhaustiveGuard(this._direction);
        }
    }

    facePlayer(playerDirection: DIRECTION_KEYS){
        switch(playerDirection) {
            case DIRECTION.DOWN:
                this._phaserGameObject.setFrame(this._frame + 1).setFlipX(false);
                break;
            case DIRECTION.UP:
                this._phaserGameObject.setFrame(this._frame).setFlipX(false);
                break;
            case DIRECTION.LEFT:
                this._phaserGameObject.setFrame(this._frame + 2).setFlipX(false);
                break;
            case DIRECTION.RIGHT:
                this._phaserGameObject.setFrame(this._frame + 2).setFlipX(true);
                break;
            default:
                exhaustiveGuard(playerDirection);
        }
    }

    update(time: DOMHighResTimeStamp) {
        if (this._isMoving) {
            return;
        }
        if (this.#talkingToPlayer) {
            return;
        }
        super.update(time);

        if (this.#movementPattern === NPC_MOVEMENT_PATTERN.IDLE){
            return;
        }

        if (this.#lastMovementTime < time) {
        let characterDirection: DIRECTION_KEYS = DIRECTION.NONE;
        let nextPosition = this.#npcPath[this.#currentPathIndex + 1];
        const prevPosition = this.#npcPath[this.#currentPathIndex];

        if(prevPosition.x !== this._phaserGameObject.x || prevPosition.y !== this._phaserGameObject.y){
            nextPosition = this.#npcPath[this.#currentPathIndex];
        } else {
        if (nextPosition === undefined) {
            nextPosition = this.#npcPath[0];
            this.#currentPathIndex = 0;
        } else {
            this.#currentPathIndex = this.#currentPathIndex + 1;
        }
        }

        if (nextPosition.x > this._phaserGameObject.x){
            characterDirection = DIRECTION.RIGHT;
        }
        if (nextPosition.x < this._phaserGameObject.x){
            characterDirection = DIRECTION.LEFT;
        }
        if (nextPosition.y > this._phaserGameObject.y){
            characterDirection = DIRECTION.DOWN;
        }
        if (nextPosition.y < this._phaserGameObject.y){
            characterDirection = DIRECTION.UP;
        }

        this.moveCharacter(characterDirection);
        this.#lastMovementTime = time + Between(2000, 5000);
        }
    }

    moveCharacter(direction: DIRECTION_KEYS) {
        super.moveCharacter(direction);

        switch (direction) {
            case DIRECTION.RIGHT:
            case DIRECTION.UP:
            case DIRECTION.DOWN:
                if (
                    !this._phaserGameObject.anims.isPlaying ||
                    this._phaserGameObject.anims.currentAnim?.key !== `NPC_1_${this.direction}`
                ){
                    this._phaserGameObject.play(`NPC_1_${this._direction}`);
                    this._phaserGameObject.setFlipX(false);
                }
                break;
            case DIRECTION.LEFT:
                if (
                    !this._phaserGameObject.anims.isPlaying ||
                    this._phaserGameObject.anims.currentAnim?.key !== `NPC_1_${DIRECTION.RIGHT}`
                ){
                    this._phaserGameObject.play(`NPC_1_${DIRECTION.RIGHT}`);
                    this._phaserGameObject.setFlipX(true);
                }
                break;
            case DIRECTION.NONE:
                break;
            default:
                exhaustiveGuard(this._direction);
        }
    }
}