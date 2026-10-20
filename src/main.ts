import { startGame } from './core';
import { gameConfig } from './game/game.config';

document.addEventListener('DOMContentLoaded', () => {
    startGame(gameConfig);
});
