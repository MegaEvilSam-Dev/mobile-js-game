import { Game } from './engine/Game.js';
import { DragonsVsLeprechaunsGame } from './engine/DragonsVsLeprechaunsGame.js';

function init() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  let activeMode = 'potholes'; // 'potholes' or 'dragons'
  let currentGame = null;

  const btnPotholes = document.getElementById('mode-potholes-btn');
  const btnDragons = document.getElementById('mode-dragons-btn');
  const instPotholes = document.getElementById('inst-potholes');
  const instDragons = document.getElementById('inst-dragons');
  const btnStart = document.getElementById('start-btn');
  const btnRestart = document.getElementById('restart-btn');

  // Mode Selection Tabs
  if (btnPotholes && btnDragons) {
    btnPotholes.onclick = (e) => {
      if (e) e.stopPropagation();
      activeMode = 'potholes';
      btnPotholes.classList.add('active');
      btnDragons.classList.remove('active');
      if (instPotholes) instPotholes.classList.remove('hidden');
      if (instDragons) instDragons.classList.add('hidden');
    };

    btnDragons.onclick = (e) => {
      if (e) e.stopPropagation();
      activeMode = 'dragons';
      btnDragons.classList.add('active');
      btnPotholes.classList.remove('active');
      if (instDragons) instDragons.classList.remove('hidden');
      if (instPotholes) instPotholes.classList.add('hidden');
    };
  }

  function launchGame() {
    if (currentGame && typeof currentGame.destroy === 'function') {
      currentGame.destroy();
    }

    const menuScreen = document.getElementById('menu-screen');
    const gameoverScreen = document.getElementById('gameover-screen');
    const hudScreen = document.getElementById('hud');

    if (menuScreen) menuScreen.classList.add('hidden');
    if (gameoverScreen) gameoverScreen.classList.add('hidden');

    if (activeMode === 'potholes') {
      currentGame = new Game(canvas);
      currentGame.startRun();
      currentGame.run();
    } else if (activeMode === 'dragons') {
      if (hudScreen) hudScreen.classList.remove('hidden');
      currentGame = new DragonsVsLeprechaunsGame(canvas, () => {
        if (menuScreen) menuScreen.classList.remove('hidden');
      });
      currentGame.run();
    }
  }

  if (btnStart) btnStart.onclick = launchGame;
  if (btnRestart) btnRestart.onclick = launchGame;

  // Boot background canvas preview
  try {
    const previewGame = new Game(canvas);
    previewGame.draw();
  } catch (err) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
