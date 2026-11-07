import { Boot } from './scenes/Boot';
import { AUTO, Game } from 'phaser';
import { PreloadScene } from './scenes/PreloadScene.ts';
import { SwipeScene } from "./scenes/SwipeScene.ts";
import { WorldScene } from "./scenes/WorldScene.ts";

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    scene: [
        Boot,
        PreloadScene,
        WorldScene,
        SwipeScene,
    ]
};

const StartGame = () => {

    return new Game({ ...config});

}

export default StartGame;
