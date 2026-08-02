import { Game } from './engine/Game.js';
import { DragonsVsLeprechaunsGame } from './engine/DragonsVsLeprechaunsGame.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  let activeMode = 'potholes'; // 'potholes' or 'dragons'
  let currentGame = null;

  const btnPotholes = document.getElementById('mode-potholes-btn');
  const btnDragons = document.getElementById('mode-dragons-btn');
  const instPotholes = document.getElementById('inst-potholes');
  const instDragons = document.getElementById('inst-dragons');
  const btnStart = document.getElementById('start-btn');

  // Mode Selection Tab Click Handlers
  if (btnPotholes && btnDragons) {
    btnPotholes.addEventListener('click', () => {
      activeMode = 'potholes';
      btnPotholes.classList.add('active');
      btnDragons.classList.remove('active');
      instPotholes.classList.remove('hidden');
      instDragons.classList.add('hidden');
    });

    btnDragons.addEventListener('click', () => {
      activeMode = 'dragons';
      btnDragons.classList.add('active');
      btnPotholes.classList.remove('active');
      instDragons.classList.remove('hidden');
      instPotholes.classList.add('hidden');
    });
  }

  // Launch Game based on active mode selection
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      if (activeMode === 'potholes') {
        if (!currentGame || !(currentGame instanceof Game)) {
          currentGame = new Game(canvas);
        }
        currentGame.startRun();
        currentGame.run();
      } else if (activeMode === 'dragons') {
        currentGame = new DragonsVsLeprechaunsGame(canvas, () => {
          document.getElementById('menu-screen').classList.remove('hidden');
        });
        document.getElementById('menu-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        currentGame.run();
      }
    });
  }

  // Initial bootloader setup
  const bootGame = new Game(canvas);
  bootGame.draw();
});
