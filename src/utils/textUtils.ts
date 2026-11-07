import {Scene} from "phaser";
import Text = Phaser.GameObjects.Text;
import {AnimateTextConfig} from "../types/types.ts";

export function animateText(scene: Scene, target: Text, text: string | undefined, config: AnimateTextConfig) {
    if (!text){
        return;
    }

    const length = text.length;
    let i = 0;
    scene.time.addEvent({
        callback: () => {
            target.text += text[i];
            ++i;
            if (i === length - 1 && config?.callback) {
                config.callback();
            }
        },
        repeat: length - 1,
        delay: config?.delay || 25,
    });
}