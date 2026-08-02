import { DragonSquad } from '../entities/DragonsVsLeprechauns/DragonSquad.js';
import { LeprechaunManager } from '../entities/DragonsVsLeprechauns/Leprechaun.js';
import { GateManager } from '../entities/DragonsVsLeprechauns/Gate.js';
import { InputHandler } from './InputHandler.js';
import { SoundSynth } from './SoundSynth.js';

export class DragonsVsLeprechaunsGame {
  constructor(canvas, onReturnMenu) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onReturnMenu = onReturnMenu;

    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;

    this.state = 'RUNNING';
    this.speed = 3.8; // Comfortable, fun speed!
    this.score = 0;
    this.leprechaunsEliminated = 0;
    this.numLanes = 2;

    this.dragonSquad = new DragonSquad(this.width, this.height);
    this.leprechaunManager = new LeprechaunManager(this.width, this.height);
    this.gateManager = new GateManager(this.width, this.height);
    this.soundSynth = new SoundSynth();

    this.input = new InputHandler(
      () => { try { if (this.dragonSquad) this.dragonSquad.moveLeft(); } catch (err) {} },
      () => { try { if (this.dragonSquad) this.dragonSquad.moveRight(); } catch (err) {} },
      () => {},
      () => { try { this.togglePause(); } catch (err) {} }
    );

    this.spawnTimer = 0;
    this.miniBossTimer = 0;
    this.gateTimer = 0;
    this.lastTime = 0;

    this.bindUI();
    this.resize();
  }

  destroy() {
    try {
      if (this.input) this.input.destroy();
    } catch (err) {}
  }

  bindUI() {
    const btnResume = document.getElementById('pause-resume-btn');
    if (btnResume) {
      btnResume.onclick = () => this.resumeGame();
    }
  }

  resize() {
    const container = document.getElementById('canvas-container');
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.dragonSquad.resize(this.width, this.height);
    this.leprechaunManager.resize(this.width, this.height);
    this.gateManager.resize(this.width, this.height);
  }

  togglePause() {
    if (this.state === 'RUNNING') {
      this.state = 'PAUSED';
      document.getElementById('pause-screen').classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'RUNNING';
      document.getElementById('pause-screen').classList.add('hidden');
    }
  }

  resumeGame() {
    this.state = 'RUNNING';
    document.getElementById('pause-screen').classList.add('hidden');
  }

  gameOver(reason) {
    this.soundSynth.playPotholeCrash();
    this.state = 'GAMEOVER';

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameover-reason').innerText = reason;
    
    document.getElementById('go-potholes').innerText = this.leprechaunsEliminated;
    document.getElementById('go-moonpies').innerText = `${this.dragonSquad.dragonCount} 🐉`;
    document.getElementById('go-score').innerText = Math.round(this.score);

    document.getElementById('gameover-screen').classList.remove('hidden');
  }

  update(dt) {
    if (this.state !== 'RUNNING') return;

    this.score += dt * 15;
    this.dragonSquad.update(dt, this.soundSynth);

    // Spawn Horizontally Bundled Enemy Clusters
    this.spawnTimer += dt;
    if (this.spawnTimer > 1.6) {
      this.spawnTimer = 0;
      this.leprechaunManager.spawnBundledCluster(this.speed);
    }

    // Spawn Mini-Bosses (Every 8.0s)
    this.miniBossTimer += dt;
    if (this.miniBossTimer > 8.0) {
      this.miniBossTimer = 0;
      this.leprechaunManager.spawnMiniBoss(this.speed);
    }

    // Spawn Single Staggered Negative Gates (Balanced against current dragon count)
    this.gateTimer += dt;
    if (this.gateTimer > 5.0) {
      this.gateTimer = 0;
      this.gateManager.spawnSingleStaggeredGate(this.dragonSquad.dragonCount);
    }

    // Update Leprechauns & Mini-Bosses
    this.leprechaunManager.update(
      this.speed,
      this.dragonSquad,
      (lep) => {
        this.leprechaunsEliminated++;
        this.score += 200;
        this.soundSynth.playMoonpieChime();
      },
      (miniBoss) => {
        this.leprechaunsEliminated += 5;
        this.score += 1500;
        this.dragonSquad.addDragons(2);
        this.soundSynth.playShopBuy();
      },
      (penalty) => {
        this.dragonSquad.removeDragons(penalty);
        this.soundSynth.playPotholeCrash();

        if (this.dragonSquad.dragonCount <= 0) {
          this.gameOver('Leprechauns escaped! All dragons lost!');
        }
      }
    );

    // Update Negative/Positive Gates (Balanced flock addition & cap)
    this.gateManager.update(this.speed, this.dragonSquad, (gateValue) => {
      if (gateValue >= 0) {
        const maxCap = 12;
        const current = this.dragonSquad.dragonCount;
        const newTotal = Math.min(maxCap, current + gateValue);
        const addedDragons = newTotal - current;
        const overflowDragons = gateValue - addedDragons;

        if (addedDragons > 0) {
          this.dragonSquad.addDragons(addedDragons);
        }
        if (overflowDragons > 0) {
          this.score += overflowDragons * 500; // Bonus points for capped dragons!
        }
        this.soundSynth.playShopBuy();
      } else {
        this.dragonSquad.removeDragons(Math.abs(gateValue));
        this.soundSynth.playPotholeCrash();

        if (this.dragonSquad.dragonCount <= 0) {
          this.gameOver('Hit negative gate! All dragons lost!');
        }
      }
    });

    if (this.dragonSquad.dragonCount <= 0 && this.state !== 'GAMEOVER') {
      this.gameOver('All dragons eliminated!');
    }

    // Update HUD
    document.getElementById('hud-potholes').innerText = this.leprechaunsEliminated;
    document.getElementById('hud-next-milestone').innerText = '(Leprechauns)';
    document.getElementById('hud-moonpies').innerText = this.dragonSquad.dragonCount;
    if (document.getElementById('hud-ammo-count')) {
      document.getElementById('hud-ammo-count').innerText = '(Dragons)';
    }
    document.getElementById('hud-score').innerText = Math.round(this.score).toString().padStart(5, '0');
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const roadX = 40;
    const roadWidth = this.width - 80;
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(roadX, 0, roadWidth, this.height);

    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([35, 35]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2, 0);
    this.ctx.lineTo(this.width / 2, this.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.gateManager.draw(this.ctx);
    this.leprechaunManager.draw(this.ctx);
    this.dragonSquad.draw(this.ctx);
  }

  run(time = 0) {
    if (this.state === 'GAMEOVER') return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt);
    this.draw();

    if (this.state !== 'GAMEOVER') {
      requestAnimationFrame((t) => this.run(t));
    }
  }
}
