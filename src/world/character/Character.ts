import {CharacterConfig, Coordinate} from "../../types/types.ts";
import {Scene} from "phaser";
import {DIRECTION, DIRECTION_KEYS} from "../../constants/playerInput.ts";
import {getTargetPositionFromGameObjectPositionAndDirection} from "../../utils/gridUtils.ts";
import {exhaustiveGuard} from "../../utils/guard.ts";
import TilemapLayer = Phaser.Tilemaps.TilemapLayer;

export class Character {
    _scene: Scene;
    _phaserGameObject: Phaser.GameObjects.Sprite;
    _direction: DIRECTION_KEYS;
    _isMoving: boolean;
    _targetPosition: Coordinate;
    _previousTargetPosition: Coordinate;
    _spritGridMovementFinishedCallback: (() => void) | undefined;
    _idleDirection: DIRECTION_KEYS;
    _characterOrigin: Coordinate;
    _collisionLayer: TilemapLayer | undefined;
    _otherCharactersToCheckForCollisionWith: Character[];

    constructor(config: CharacterConfig) {
        this._scene = config.scene;
        this._direction = config.direction;
        this._isMoving = false;
        this._characterOrigin = config.origin ?? { x: 0, y: 0 };
        this._targetPosition = { ...config.position };
        this._previousTargetPosition = { ...config.position };
        this._spritGridMovementFinishedCallback = config.spriteGridMovementFinishedCallback;
        this._idleDirection = config.idleDirection;
        this._collisionLayer = config.collisionLayer;
        this._otherCharactersToCheckForCollisionWith = config.otherCharactersToCheckForCollisionWith || [];

        this._phaserGameObject = this._scene.add.sprite(
            config.position.x,
            config.position.y,
            config.assetKey,
            this._getIdleFrameConfig(),
        ).setOrigin(this._characterOrigin.x, this._characterOrigin.y);
    }

    get sprite(){
        return this._phaserGameObject;
    }
    get isMoving() {
        return this._isMoving;
    }

    get direction() {
        return this._direction;
    }

    moveCharacter(direction: DIRECTION_KEYS) {

        if( this._isMoving){
            return;
        }

        this._moveSprite(direction);


    }

    addCharacterToCheckForCollisionsWith(character: Character){
        this._otherCharactersToCheckForCollisionWith.push(character);
    }

    update(time: DOMHighResTimeStamp) {
        if (this._isMoving) {
            return;
        }

        // stop current animation and show idle frame
        const idleFrame = this._phaserGameObject.anims.currentAnim?.frames[1].frame.name;
        this._phaserGameObject.anims.stop();
        if (!idleFrame) {
            return;
        }
        if (this._direction !== DIRECTION.NONE) {
            this._phaserGameObject.setFrame(idleFrame);
        }
    }

    _moveSprite(direction: DIRECTION_KEYS) {
       this._direction = direction;
       if (this._isBlockingTile()){
           return;
       }
       this._isMoving = true;
       this.#handleSpriteMovement();
    }

    _isBlockingTile(){
        if (this._direction === DIRECTION.NONE) {
            return;
        }

        const targetPosition = {...this._targetPosition};
        const updatedPosition = getTargetPositionFromGameObjectPositionAndDirection(targetPosition, this._direction);
        return this.#doesPositionCollideWithCollisionLayer(updatedPosition) || this.#doesPositionCollideWithOtherCharacter(updatedPosition);
    }

    #handleSpriteMovement() {

        if(this._direction === DIRECTION.NONE){
            return;
        }

        const updatedPosition = getTargetPositionFromGameObjectPositionAndDirection(this._targetPosition, this._direction);
        this._previousTargetPosition = this._targetPosition;
        this._targetPosition.x = updatedPosition.x;
        this._targetPosition.y = updatedPosition.y;

        this._scene.add.tween({
            delay: 0,
            duration: 600,
            y: {
                from: this._phaserGameObject.y,
                start: this._phaserGameObject.y,
                to: this._targetPosition.y,
            },
            x: {
                from: this._phaserGameObject.x,
                start: this._phaserGameObject.x,
                to: this._targetPosition.x,
            },
            targets: this._phaserGameObject,
            onComplete: () => {
                this._isMoving = false;
                this._previousTargetPosition = this._targetPosition;
                if (this._spritGridMovementFinishedCallback) {
                    this._spritGridMovementFinishedCallback();
                }
            },
        })
    }

    #doesPositionCollideWithCollisionLayer(position: Coordinate) {

        if (!this._collisionLayer) {
            return false;
        }

        const { x, y} = position;
        if (x < 0 || y < 0 || x >= 1280 || y >= 1280) {
            return true;
        }

        // Check points across the character tile footprint for 16x16 collision tiles
        for (let offsetX = 8; offsetX < 64; offsetX += 16) {
            for (let offsetY = 8; offsetY < 64; offsetY += 16) {
                const tile = this._collisionLayer.getTileAtWorldXY(x + offsetX, y + offsetY, true);
                if (tile && tile.index !== -1) {
                    return true;
                }
            }
        }

        return false;
    }

    #doesPositionCollideWithOtherCharacter(position: Coordinate) {
        const { x, y } = position;
        if (this._otherCharactersToCheckForCollisionWith.length === 0){
            return false;
        }

        return this._otherCharactersToCheckForCollisionWith.some(character => {
            return (
                character._targetPosition.x === x && character._targetPosition.y === y || character._previousTargetPosition.x === x && character._previousTargetPosition.y === y
            );
        });
    }

    _getIdleFrameConfig(): number | undefined {
        switch (this._idleDirection) {
            case DIRECTION.DOWN:
            case DIRECTION.NONE:
                return 7;
            case DIRECTION.LEFT:
                return 10;
            case DIRECTION.RIGHT:
                return 4;
            case DIRECTION.UP:
                return 1;
            default:
                exhaustiveGuard(this._direction);
        }
    }
}