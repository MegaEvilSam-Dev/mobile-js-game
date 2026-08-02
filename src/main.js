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
  const btnPauseMenu = document.getElementById('pause-menu-btn');
  const btnGoMenu = document.getElementById('go-menu-btn');

  function selectMode(mode) {
    activeMode = mode;
    if (mode === 'potholes') {
      if (btnPotholes) btnPotholes.classList.add('active');
      if (btnDragons) btnDragons.classList.remove('active');
      if (instPotholes) instPotholes.classList.remove('hidden');
      if (instDragons) instDragons.classList.add('hidden');
    } else if (mode === 'dragons') {
      if (btnDragons) btnDragons.classList.add('active');
      if (btnPotholes) btnPotholes.classList.remove('active');
      if (instDragons) instDragons.classList.remove('hidden');
      if (instPotholes) instPotholes.classList.add('hidden');
    }
  }

  // Bind Mode Selection on Click, Touch, and Hover
  if (btnPotholes && btnDragons) {
    btnPotholes.onclick = (e) => { if (e) e.stopPropagation(); selectMode('potholes'); };
    btnPotholes.onmouseenter = () => selectMode('potholes');
    btnPotholes.onfocus = () => selectMode('potholes');

    btnDragons.onclick = (e) => { if (e) e.stopPropagation(); selectMode('dragons'); };
    btnDragons.onmouseenter = () => selectMode('dragons');
    btnDragons.onfocus = () => selectMode('dragons');
  }

  function launchGame() {
    try {
      if (currentGame && typeof currentGame.destroy === 'function') {
        currentGame.destroy();
      }

      const menuScreen = document.getElementById('menu-screen');
      const gameoverScreen = document.getElementById('gameover-screen');
      const pauseScreen = document.getElementById('pause-screen');
      const hudScreen = document.getElementById('hud');

      if (menuScreen) menuScreen.classList.add('hidden');
      if (gameoverScreen) gameoverScreen.classList.add('hidden');
      if (pauseScreen) pauseScreen.classList.add('hidden');

      if (activeMode === 'potholes') {
        currentGame = new Game(canvas);
        currentGame.startRun();
        currentGame.run();
      } else if (activeMode === 'dragons') {
        if (hudScreen) hudScreen.classList.remove('hidden');
        currentGame = new DragonsVsLeprechaunsGame(canvas, () => {
          returnToMainMenu();
        });
        currentGame.run();
      }
    } catch (err) {
      console.error('Launch game error:', err);
    }
  }

  function returnToMainMenu() {
    try {
      if (currentGame && typeof currentGame.destroy === 'function') {
        currentGame.destroy();
      }

      const menuScreen = document.getElementById('menu-screen');
      const pauseScreen = document.getElementById('pause-screen');
      const gameoverScreen = document.getElementById('gameover-screen');
      const hudScreen = document.getElementById('hud');

      if (pauseScreen) pauseScreen.classList.add('hidden');
      if (gameoverScreen) gameoverScreen.classList.add('hidden');
      if (hudScreen) hudScreen.classList.add('hidden');
      if (menuScreen) menuScreen.classList.remove('hidden');

      try {
        const previewGame = new Game(canvas);
        previewGame.draw();
      } catch (err) {}
    } catch (err) {
      console.error('Return to main menu error:', err);
    }
  }

  if (btnStart) btnStart.onclick = launchGame;
  if (btnRestart) btnRestart.onclick = launchGame;
  if (btnPauseMenu) btnPauseMenu.onclick = returnToMainMenu;
  if (btnGoMenu) btnGoMenu.onclick = returnToMainMenu;

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
