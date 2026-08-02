import { Game } from './engine/Game.js';
import { DragonsVsLeprechaunsGame } from './engine/DragonsVsLeprechaunsGame.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  let activeMode = 'potholes';
  let currentGame = null;

  const btnPotholes = document.getElementById('mode-potholes-btn');
  const btnDragons = document.getElementById('mode-dragons-btn');
  const instPotholes = document.getElementById('inst-potholes');
  const instDragons = document.getElementById('inst-dragons');
  const btnStart = document.getElementById('start-btn');

  if (btnPotholes && btnDragons) {
    btnPotholes.onclick = () => {
      activeMode = 'potholes';
      btnPotholes.classList.add('active');
      btnDragons.classList.remove('active');
      instPotholes.classList.remove('hidden');
      instDragons.classList.add('hidden');
    };

    btnDragons.onclick = () => {
      activeMode = 'dragons';
      btnDragons.classList.add('active');
      btnPotholes.classList.remove('active');
      instDragons.classList.remove('hidden');
      instPotholes.classList.add('hidden');
    };
  }

  if (btnStart) {
    btnStart.onclick = () => {
      if (currentGame && typeof currentGame.destroy === 'function') {
        currentGame.destroy();
      }

      if (activeMode === 'potholes') {
        currentGame = new Game(canvas);
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
    };
  }

  const bootGame = new Game(canvas);
  bootGame.draw();
});
