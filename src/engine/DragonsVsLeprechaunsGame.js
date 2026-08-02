import { DragonSquad } from '../entities/DragonsVsLeprechauns/DragonSquad.js';
import { LeprechaunManager } from '../entities/DragonsVsLeprechauns/Leprechaun.js';
import { GateManager } from '../entities/DragonsVsLeprechauns/Gate.js';
import { PowerUpManager } from '../entities/DragonsVsLeprechauns/PowerUp.js';
import { ParticlePool } from '../entities/DragonsVsLeprechauns/ParticlePool.js';
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
    this.speed = 3.4;
    this.distance = 0;
    this.score = 0;
    this.enemiesDefeated = 0;
    this.lastBossMilestone = 0;
    this.bossCount = 0;

    this.numLanes = 2;

    this.dragonSquad = new DragonSquad(this.width, this.height);
    this.leprechaunManager = new LeprechaunManager(this.width, this.height);
    this.gateManager = new GateManager(this.width, this.height);
    this.powerUpManager = new PowerUpManager(this.width, this.height);
    this.particlePool = new ParticlePool(200);
    this.soundSynth = new SoundSynth();

    this.input = new InputHandler(
      () => { try { if (this.dragonSquad) this.dragonSquad.moveLeft(); } catch (err) {} },
      () => { try { if (this.dragonSquad) this.dragonSquad.moveRight(); } catch (err) {} },
      () => {},
      () => { try { this.togglePause(); } catch (err) {} },
      (mouseX) => { try { if (this.dragonSquad) this.dragonSquad.setTargetX(mouseX); } catch (err) {} }
    );

    this.spawnTimer = 0;
    this.gateTimer = 0;
    this.powerUpTimer = 0;
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
    if (!container) return;
    this.width = container.clientWidth || 360;
    this.height = container.clientHeight || 640;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    if (this.dragonSquad) this.dragonSquad.resize(this.width, this.height);
    if (this.leprechaunManager) this.leprechaunManager.resize(this.width, this.height);
    if (this.gateManager) this.gateManager.resize(this.width, this.height);
    if (this.powerUpManager) this.powerUpManager.resize(this.width, this.height);
  }

  togglePause() {
    const pauseScreen = document.getElementById('pause-screen');
    if (this.state === 'RUNNING') {
      this.state = 'PAUSED';
      if (pauseScreen) pauseScreen.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'RUNNING';
      if (pauseScreen) pauseScreen.classList.add('hidden');
    }
  }

  resumeGame() {
    this.state = 'RUNNING';
    const pauseScreen = document.getElementById('pause-screen');
    if (pauseScreen) pauseScreen.classList.add('hidden');
  }

  spawnTrackBoss() {
    this.bossCount++;
    const bossHp = 50 + (this.bossCount * 40);
    this.leprechaunManager.spawnBoss(bossHp);
    this.soundSynth.playDragonRoar();
    this.particlePool.triggerShake(8, 0.4);
    this.particlePool.spawnDamagePopup(this.width / 2, 100, `👑 BOSS ${this.bossCount} APPROACHING!`, '#f59e0b');
  }

  gameOver(reason) {
    this.soundSynth.playPotholeCrash();
    this.state = 'GAMEOVER';

    const hud = document.getElementById('hud');
    if (hud) hud.classList.add('hidden');

    const elReason = document.getElementById('gameover-reason');
    if (elReason) elReason.innerText = reason;

    const elPotholes = document.getElementById('go-potholes');
    if (elPotholes) elPotholes.innerText = this.enemiesDefeated;

    const elMoonpies = document.getElementById('go-moonpies');
    if (elMoonpies) elMoonpies.innerText = `${this.dragonSquad ? this.dragonSquad.squadSize : 0} 🐉`;

    const elScore = document.getElementById('go-score');
    if (elScore) elScore.innerText = Math.round(this.score);

    const goScreen = document.getElementById('gameover-screen');
    if (goScreen) goScreen.classList.remove('hidden');
  }

  update(dt) {
    if (this.state !== 'RUNNING') return;

    this.particlePool.update(dt);
    this.dragonSquad.update(dt);

    this.distance += dt * 35;
    this.score += dt * 25;

    this.speed = 3.4 + Math.min(2.0, (this.distance / 500) * 1.5);

    const currentBossMilestone = Math.floor(this.distance / 200);
    if (currentBossMilestone > this.lastBossMilestone && this.distance >= 200) {
      this.lastBossMilestone = currentBossMilestone;
      this.spawnTrackBoss();
    }

    // 1. Spawn Multiplier Gates
    this.gateTimer += dt;
    if (this.gateTimer > 3.8) {
      const isFirst = (this.gateManager.gatePairs.length === 0 && this.distance < 40);
      this.gateTimer = 0;
      this.gateManager.spawnGatePair(this.dragonSquad.squadSize, isFirst);
    }

    // 2. Spawn Enemy Mobs
    if (this.distance > 60) {
      this.spawnTimer += dt;
      const enemySpawnInterval = Math.max(1.4, 2.4 - (this.distance / 500) * 0.8);
      if (this.spawnTimer > enemySpawnInterval) {
        this.spawnTimer = 0;
        this.leprechaunManager.spawnEnemyArmyMob(this.speed, this.distance);
      }
    }

    // Spawn Power-Ups
    this.powerUpTimer += dt;
    if (this.powerUpTimer > 6.5) {
      this.powerUpTimer = 0;
      this.powerUpManager.spawnPowerUp(this.speed);
    }

    // Update Power-Ups
    this.powerUpManager.update(this.speed, this.dragonSquad, (type) => {
      this.dragonSquad.applyPowerUp(type);
      this.soundSynth.playShopBuy();
      this.particlePool.spawnExplosion(this.dragonSquad.x, this.dragonSquad.y, '#60a5fa', 12);
      this.particlePool.spawnDamagePopup(this.dragonSquad.x, this.dragonSquad.y - 30, `+${type.toUpperCase()}`, '#60a5fa');
    });

    // Update Enemy Mobs & Tough Track Bosses
    this.leprechaunManager.update(
      this.speed,
      this.dragonSquad,
      this.particlePool,
      (mob) => {
        this.enemiesDefeated += mob.mobSize || 10;
        this.score += 500;
        this.soundSynth.playMoonpieChime();
      },
      () => {
        this.soundSynth.playPotholeCrash();
        if (this.dragonSquad.squadSize <= 0) {
          this.gameOver('Dragon Mob wiped out in Total War Army Clash!');
        }
      },
      (escapedUnits) => {
        this.dragonSquad.removeDragons(escapedUnits);
        if (this.dragonSquad.squadSize <= 0) {
          this.gameOver('Red Leprechaun Army overran your base!');
        }
      },
      (boss) => {
        this.enemiesDefeated += 25;
        this.score += 5000;
        this.dragonSquad.addDragons(10);
        this.soundSynth.playShopBuy();
        this.particlePool.spawnDamagePopup(this.width / 2, 140, '🏆 BOSS DEFEATED! +5000 PTS & +10 DRAGONS!', '#10b981');
      }
    );

    // Update Multiplier Gates
    this.gateManager.update(this.speed, this.dragonSquad, this.particlePool, (gate) => {
      let size = this.dragonSquad.squadSize;
      if (gate.op === '+') size += gate.val;
      else if (gate.op === 'x') size *= gate.val;
      else if (gate.op === '-') size = Math.max(0, size - Math.abs(gate.val));

      this.dragonSquad.setSquadSize(size);

      if (gate.isPositive) {
        this.soundSynth.playShopBuy();
        this.particlePool.spawnDamagePopup(gate.x, this.dragonSquad.y - 40, `SQUAD: ${this.dragonSquad.squadSize}`, '#10b981');
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

    // Defensive DOM updates with strict null safety!
    const evo = this.dragonSquad.getEvolutionTier();
    const nextBossDist = Math.max(0, Math.round(((this.lastBossMilestone + 1) * 200) - this.distance));

    const elPotholes = document.getElementById('hud-potholes');
    if (elPotholes) elPotholes.innerText = this.enemiesDefeated;

    const elMilestone = document.getElementById('hud-next-milestone');
    if (elMilestone) elMilestone.innerText = `(${nextBossDist}m to Boss ${this.bossCount + 1})`;

    const elMoonpies = document.getElementById('hud-moonpies');
    if (elMoonpies) elMoonpies.innerText = `${this.dragonSquad.squadSize} 🐉`;

    const elAmmo = document.getElementById('hud-ammo-count');
    if (elAmmo) elAmmo.innerText = evo.name;

    const elScore = document.getElementById('hud-score');
    if (elScore) elScore.innerText = Math.round(this.score).toString().padStart(5, '0');

    // Update Powerup Bar
    let pillsHTML = '';
    if (this.dragonSquad.shieldTimer > 0) pillsHTML += `<div class="powerup-pill">🛡️ SHIELD (${Math.ceil(this.dragonSquad.shieldTimer)}s)</div>`;
    if (this.dragonSquad.multiFireTimer > 0) pillsHTML += `<div class="powerup-pill">🔥 MULTI-FIRE (${Math.ceil(this.dragonSquad.multiFireTimer)}s)</div>`;
    if (this.dragonSquad.speedShootTimer > 0) pillsHTML += `<div class="powerup-pill">⚡ SPEED-SHOOT (${Math.ceil(this.dragonSquad.speedShootTimer)}s)</div>`;
    const pBar = document.getElementById('powerup-bar');
    if (pBar) pBar.innerHTML = pillsHTML;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.particlePool.applyShakeTransform(this.ctx);

    // Track Highway Background
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
    this.powerUpManager.draw(this.ctx);
    this.leprechaunManager.draw(this.ctx);
    this.dragonSquad.draw(this.ctx);
    this.particlePool.draw(this.ctx);

    this.ctx.restore();
  }

  run(time = 0) {
    if (this.state === 'GAMEOVER') return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.run(t));
  }
}
