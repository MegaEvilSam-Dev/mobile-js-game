import { Game } from './engine/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    const game = new Game(canvas);
    game.run();
  }
});
