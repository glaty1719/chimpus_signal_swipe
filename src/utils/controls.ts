import {Scene} from "phaser";
import {DIRECTION_KEYS, DIRECTION} from "../constants/playerInput.ts";

export class Controls {

    #scene: Scene;
    #cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    #enterKey: Phaser.Input.Keyboard.Key;
    #escKey: Phaser.Input.Keyboard.Key;
    #returnKey: Phaser.Input.Keyboard.Key;
    #lockPlayerInput: Boolean;

    constructor(scene: Scene) {

        this.#scene = scene;
        this.#cursorKeys = this.#scene.input.keyboard!.createCursorKeys();
        this.#enterKey = this.#scene.input.keyboard!.addKey("ENTER");
        this.#escKey = this.#scene.input.keyboard!.addKey("ESC");
        this.#returnKey = this.#scene.input.keyboard!.addKey("BACKSPACE");
        this.#lockPlayerInput = false;
    }

    get isInputLocked() {
       return this.#lockPlayerInput;
    }

    set lockPlayerInput(lockPlayerInput: Boolean) {
        this.#lockPlayerInput = lockPlayerInput;
    }

    wasOkayKeyPressed() {
        if (!this.#cursorKeys) {
            return false;
        }

        const wasEnterKeyPressed = Phaser.Input.Keyboard.JustDown(this.#enterKey);
        const wasSpaceKeyPressed = Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space);

        return wasEnterKeyPressed || wasSpaceKeyPressed;
    }

    wasBackKeyPressed() {
        if (!this.#cursorKeys) {
            return false;
        }

        const wasEscKeyPressed = Phaser.Input.Keyboard.JustDown(this.#escKey);
        const wasReturnKeyPressed = Phaser.Input.Keyboard.JustDown(this.#returnKey);

        return wasEscKeyPressed || wasReturnKeyPressed;
    }

    getDirectionKeyJustPressed(){

        let selectedDirection: DIRECTION_KEYS = DIRECTION.NONE;
        if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.left)){
            selectedDirection = DIRECTION.LEFT;
        } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.right)){
            selectedDirection = DIRECTION.RIGHT;
        } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.up)){
            selectedDirection = DIRECTION.UP;
        } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.down)){
            selectedDirection = DIRECTION.DOWN;
        }

        return  selectedDirection;
    }

    getDirectionKeyPressed(){

        if (this.#cursorKeys === undefined) {
            return DIRECTION.NONE;
        }

        let selectedDirection: DIRECTION_KEYS = DIRECTION.NONE;
        if (this.#cursorKeys.left.isDown) {
            selectedDirection = DIRECTION.LEFT;
        } else if (this.#cursorKeys.right.isDown) {
            selectedDirection = DIRECTION.RIGHT;
        } else if (this.#cursorKeys.up.isDown) {
            selectedDirection = DIRECTION.UP;
        } else if (this.#cursorKeys.down.isDown) {
            selectedDirection = DIRECTION.DOWN;
        }

        return selectedDirection;
    }
}