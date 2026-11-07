import {Coordinate} from "../types/types.ts";
import {DIRECTION, DIRECTION_KEYS} from "../constants/playerInput.ts";
import {TILE_SIZE} from "../config.ts";
import {exhaustiveGuard} from "./guard.ts";

export function getTargetPositionFromGameObjectPositionAndDirection(currentPosition: Coordinate, direction: DIRECTION_KEYS){

    const targetPosition = currentPosition;
    switch (direction) {

            case DIRECTION.DOWN:
                targetPosition.y += TILE_SIZE;
                break;
            case DIRECTION.UP:
                targetPosition.y -= TILE_SIZE;
                break;
            case DIRECTION.RIGHT:
                targetPosition.x += TILE_SIZE;
                break;
            case DIRECTION.LEFT:
                targetPosition.x -= TILE_SIZE;
                break;
            case DIRECTION.NONE:
                break;
            default:
                    exhaustiveGuard(direction);
        }

        return targetPosition;
}