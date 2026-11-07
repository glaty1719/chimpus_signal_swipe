import {Scene} from "phaser";
import {MONSTER_ASSET_KEYS} from "../../../constants/AssetsKeys.ts";
import {DIRECTION_KEYS, PLAYER_INPUT} from "../../../constants/playerInput.ts";

const BATTLE_MENU_OPTIONS = Object.freeze({
    FIGHT: 'FIGHT',
    SWITCH: 'SWITCH',
    ITEM: 'ITEM',
    FLEE: 'FLEE',
});

const battleUiTextStyle = {
    color: 'black',
    fontSize: '30px',
};

export class BattleMenu {
    #scene: Scene;
    #mainBattleMenuPhaserContainerGameObject: Phaser.GameObjects.Container;
    #moveSelectionSubBattleMenuPhaserContainerGameObject: Phaser.GameObjects.Container;
    #battleTextGameObjectLine1: Phaser.GameObjects.Text;
    #battleTextGameObjectLine2: Phaser.GameObjects.Text;

    constructor(scene: Scene, backgroundHeight: number) {
       this.#scene = scene;

       this.#createMainInfoPane(backgroundHeight);
        this.#createMainBattleMenu();
        this.#createMonsterAttackSubMenu();
    }

    showBattleMenu() {
        this.#mainBattleMenuPhaserContainerGameObject.setAlpha(1);
        this.#battleTextGameObjectLine1.setAlpha(1);
        this.#battleTextGameObjectLine2.setAlpha(1);
    }

    hideBattleMenu() {
        this.#mainBattleMenuPhaserContainerGameObject.setAlpha(0);
        this.#battleTextGameObjectLine1.setAlpha(0);
        this.#battleTextGameObjectLine2.setAlpha(0);
    }

    showMonsterAttackSubMenu() {
        this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(1);
    }

    hideMonsterAttackSubMenu() {
        this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(0);
    }

    handlePlayerInput(input: PLAYER_INPUT | DIRECTION_KEYS) {
        if (input === "CANCEL"){
            this.hideMonsterAttackSubMenu();
            this.showBattleMenu();
            return;
        }

        if (input === "OK"){
            this.hideBattleMenu();
            this.showMonsterAttackSubMenu();
            return;
        }

    }

   #createMainBattleMenu() {

        this.#battleTextGameObjectLine1 = this.#scene.add.text(
            20,
            468,
            'what should',
            battleUiTextStyle
        );

        // UPDATE: to use monster data passed into this class instance
       this.#battleTextGameObjectLine2 = this.#scene.add.text(
           20,
           512,
           `${MONSTER_ASSET_KEYS.IGUANIGNITE} do next ?`,
           battleUiTextStyle
       );

       this.#mainBattleMenuPhaserContainerGameObject = this.#scene.add.container(
           520,
           444,
           [
               this.#createMainInfoSubPane(),
               this.#scene.add.text(55, 22, BATTLE_MENU_OPTIONS.FIGHT, battleUiTextStyle),
               this.#scene.add.text(240, 22, BATTLE_MENU_OPTIONS.SWITCH, battleUiTextStyle),
               this.#scene.add.text(55, 70, BATTLE_MENU_OPTIONS.ITEM, battleUiTextStyle),
               this.#scene.add.text(240, 70, BATTLE_MENU_OPTIONS.FLEE, battleUiTextStyle),
           ]
       );
       this.hideBattleMenu();
   }

    #createMonsterAttackSubMenu(){
        this.#moveSelectionSubBattleMenuPhaserContainerGameObject = this.#scene.add.container(
            0,
            444,
            [
                this.#scene.add.text(55, 22, 'slash', battleUiTextStyle),
                this.#scene.add.text(240, 22, 'growl', battleUiTextStyle),
                this.#scene.add.text(55, 70, '-', battleUiTextStyle),
                this.#scene.add.text(240, 70, '-', battleUiTextStyle),
            ]
        );
        this.hideMonsterAttackSubMenu();
    }

    #createMainInfoPane(y: number){
        const padding = 4;
        const rectHeight = 128;

        this.#scene.add.rectangle(
            padding,
            y - rectHeight - padding,
            this.#scene.scale.width - padding * 2,
            rectHeight,
            0xede4f3,
            1
        ).setOrigin(0, 0)
            .setStrokeStyle(8, 0xe4434a, 1);
    }

    #createMainInfoSubPane(){
        const rectWidth = 500;
        const rectHeight = 128;

        return this.#scene.add.rectangle(
            0,
            0,
            rectWidth,
            rectHeight,
            0xede4f3,
            1
        ).setOrigin(0, 0)
            .setStrokeStyle(8, 0x905ac2, 1);
    }
}