import {Scene} from "phaser";
import Container = Phaser.GameObjects.Container;
import Image = Phaser.GameObjects.Image;
import Tween = Phaser.Tweens.Tween;
import Text = Phaser.GameObjects.Text;
import {DIALOG_UI_TEXT_STYLE, phrases} from "../constants/appConstants.ts";
import {UI_ASSET_KEYS} from "../constants/AssetsKeys.ts";
import {animateText} from "../utils/textUtils.ts";

export class DialogUi {
    #scene: Scene;
    #width: number;
    #padding: number;
    #height: number;
    #container: Container;
    #isVisible: boolean;
    #userInputCursor: Image;
    #userInputCursorTween: Tween;
    #uiText: Text;
    #textAnimationPlaying: boolean;
    #messagesToShow: string[];

    constructor(scene: Scene, width: number) {
        this.#scene = scene;
        this.#padding = 90;
        this.#width = width - this.#padding * 2;
        this.#height = 124;
        this.#isVisible = false;
        this.#textAnimationPlaying = false;
        this.#messagesToShow = [];

        const panel = this.#scene.add.rectangle(
            0,
            0,
            this.#width,
            this.#height,
            0xede4f3,
            0.9)
            .setOrigin(0)
            .setStrokeStyle(8, 0x905ac2, 1);

        this.#container = this.#scene.add.container(0, 0, [panel]);
        this.#uiText = this.#scene.add.text(
            18,
            12,
            phrases.CANNOT_READ_SIGN_TEXT,
            {
                ...DIALOG_UI_TEXT_STYLE,
                wordWrap: {width: this.#width - 18},
            }
        );
        this.#container.add(this.#uiText);
        this.#createPlayerInputCursor();

        this.hideDialogModal();
    }

    get isVisible() {
        return this.#isVisible;
    }

    get textAnimationPlaying() {
        return this.#textAnimationPlaying;
    }

    get moreMessagesToShow() {
        return this.#messagesToShow.length > 0;
    }

    showDialogModal(messages: string[]){

       this.#messagesToShow = [...messages];
       const {x, bottom} = this.#scene.cameras.main.worldView;
       const startX = x + this.#padding;
       const startY = bottom - this.#height - this.#padding/4;

       this.#container.setPosition(startX, startY);
       this.#userInputCursorTween.restart();
       this.#container.setAlpha(1);
       this.#isVisible = true;
       this.showNextMessage();
    }

    showNextMessage() {

        if (this.#messagesToShow.length === 0){
            return;
        }

        this.#uiText.setText('').setAlpha(1);
        animateText(this.#scene, this.#uiText, this.#messagesToShow.shift(), {
            delay: 50,
            callback: () => {
                this.#textAnimationPlaying = false;
            }
        });
        this.#textAnimationPlaying = true;
    }

    hideDialogModal(){
        this.#container.setAlpha(0);
        this.#userInputCursorTween.pause();
        this.#isVisible = false;
    }

    #createPlayerInputCursor(){

        const y = this.#height - 24;
        this.#userInputCursor = this.#scene.add.image(this.#width - 24, y, UI_ASSET_KEYS.CURSOR);
        this.#userInputCursor.setAngle(90).setScale(4.5,2);

        this.#userInputCursorTween = this.#scene.add.tween({
            delay: 0,
            duration: 500,
            repeat: -1,
            y: {
                from: y,
                start: y,
                to: y + 6,
            },
            targets: this.#userInputCursor,
        });
        this.#userInputCursorTween.pause();
        this.#container.add(this.#userInputCursor);
    }
}