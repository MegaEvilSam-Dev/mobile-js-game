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
    this.speed = 4.2;
    this.score = 0;
    this.enemiesDefeated = 0;
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
    
    document.getElementById('go-potholes').innerText = this.enemiesDefeated;
    document.getElementById('go-moonpies').innerText = `${this.dragonSquad.squadSize} 🐉`;
    document.getElementById('go-score').innerText = Math.round(this.score);

    document.getElementById('gameover-screen').classList.remove('hidden');
  }

  update(dt) {
    if (this.state !== 'RUNNING') return;

    this.score += dt * 25;
    this.dragonSquad.update(dt, this.soundSynth);

    // Spawn Total War Red Leprechaun Army Mobs
    this.spawnTimer += dt;
    if (this.spawnTimer > 1.8) {
      this.spawnTimer = 0;
      this.leprechaunManager.spawnEnemyArmyMob(this.speed);
    }

    // Spawn Multiplier Gate Pairs (x2, +30, x3)
    this.gateTimer += dt;
    if (this.gateTimer > 4.5) {
      this.gateTimer = 0;
      this.gateManager.spawnGatePair(this.dragonSquad.squadSize);
    }

    // Update Leprechaun Army Mobs & Mass Clashing
    this.leprechaunManager.update(
      this.speed,
      this.dragonSquad,
      (mob) => {
        // Red Army Mob Wiped Out
        this.enemiesDefeated += mob.mobSize || 15;
        this.score += 500;
        this.soundSynth.playMoonpieChime();
      },
      () => {
        // Real-Time Total War Mob Clash
        this.soundSynth.playPotholeCrash();
        if (this.dragonSquad.squadSize <= 0) {
          this.gameOver('Dragon Mob wiped out in Total War Army Clash!');
        }
      },
      (escapedUnits) => {
        // Escaped enemy units deduct 1:1
        this.dragonSquad.removeDragons(escapedUnits);
        if (this.dragonSquad.squadSize <= 0) {
          this.gameOver('Red Leprechaun Army overran your base!');
        }
      }
    );

    // Update Multiplier Gates
    this.gateManager.update(this.speed, this.dragonSquad, (gate) => {
      let size = this.dragonSquad.squadSize;
      if (gate.op === '+') size += gate.val;
      else if (gate.op === 'x') size *= gate.val;
      else if (gate.op === '-') size = Math.max(0, size - Math.abs(gate.val));

      this.dragonSquad.setSquadSize(size);

      if (gate.isPositive) {
        this.soundSynth.playShopBuy();
      } else {
        this.soundSynth.playPotholeCrash();
        if (this.dragonSquad.squadSize <= 0) {
          this.gameOver('Hit negative gate! Dragon mob eliminated!');
        }
      }
    });

    if (this.dragonSquad.squadSize <= 0 && this.state !== 'GAMEOVER') {
      this.gameOver('All dragons eliminated!');
    }

    // Update HUD
    document.getElementById('hud-potholes').innerText = this.enemiesDefeated;
    document.getElementById('hud-next-milestone').innerText = '(Defeated)';
    document.getElementById('hud-moonpies').innerText = `${this.dragonSquad.squadSize} 🐉`;
    if (document.getElementById('hud-ammo-count')) {
      document.getElementById('hud-ammo-count').innerText = 'Mob Squad';
    }
    document.getElementById('hud-score').innerText = Math.round(this.score).toString().padStart(5, '0');
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Total War Road Highway Background
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const roadX = 40;
    const roadWidth = this.width - 80;
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(roadX, 0, roadWidth, this.height);

    // Center Divider
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([35, 35]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2, 0);
    this.ctx.lineTo(this.width / 2, this.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Render Entities
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
