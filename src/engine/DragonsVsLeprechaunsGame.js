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
    this.speed = 3.6; // Comfortable cruising speed
    this.distance = 0;
    this.score = 0;
    this.enemiesDefeated = 0;
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
      () => { try { this.togglePause(); } catch (err) {} }
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
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.dragonSquad.resize(this.width, this.height);
    this.leprechaunManager.resize(this.width, this.height);
    this.gateManager.resize(this.width, this.height);
    this.powerUpManager.resize(this.width, this.height);
  }

  togglePause() {
    if (this.state === 'RUNNING' || this.state === 'BOSS_ARENA') {
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

  triggerBossArenaPhase() {
    this.state = 'BOSS_ARENA';
    this.dragonSquad.isBossBreathAttack = true;
    this.leprechaunManager.spawnBoss(80); // Rebalanced Boss HP to 80 for fun, epic victory!
    this.soundSynth.playDragonRoar();
    this.particlePool.triggerShake(8, 0.4);
  }

  victory() {
    this.state = 'VICTORY';
    this.soundSynth.playShopBuy();

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameover-reason').innerText = '🏆 LEPRECHAUN KING DEFEATED! VICTORY!';
    
    document.getElementById('go-potholes').innerText = this.enemiesDefeated;
    document.getElementById('go-moonpies').innerText = `${this.dragonSquad.squadSize} 🐉`;
    document.getElementById('go-score').innerText = Math.round(this.score + 5000);

    document.getElementById('gameover-screen').classList.remove('hidden');
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
    if (this.state !== 'RUNNING' && this.state !== 'BOSS_ARENA') return;

    this.particlePool.update(dt);
    this.dragonSquad.update(dt);

    // --- BOSS ARENA PHASE ---
    if (this.state === 'BOSS_ARENA') {
      this.leprechaunManager.update(
        0,
        this.dragonSquad,
        this.particlePool,
        () => {},
        () => {},
        () => {},
        () => this.victory() // Boss Defeated!
      );
      return;
    }

    // --- TRACK RUNNER PHASE ---
    this.distance += dt * 35;
    this.score += dt * 25;

    // Quick Boss Route: Transition to Boss Arena at 250m!
    if (this.distance >= 250) {
      this.triggerBossArenaPhase();
      return;
    }

    // Spawn Enemy Mobs
    this.spawnTimer += dt;
    if (this.spawnTimer > 2.0) {
      this.spawnTimer = 0;
      this.leprechaunManager.spawnEnemyArmyMob(this.speed);
    }

    // Spawn Multiplier Gates
    this.gateTimer += dt;
    if (this.gateTimer > 4.2) {
      this.gateTimer = 0;
      this.gateManager.spawnGatePair(this.dragonSquad.squadSize);
    }

    // Spawn Power-Ups
    this.powerUpTimer += dt;
    if (this.powerUpTimer > 6.0) {
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

    // Update Enemy Mobs
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
      () => {}
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

    // Update HUD
    const evo = this.dragonSquad.getEvolutionTier();
    document.getElementById('hud-potholes').innerText = this.enemiesDefeated;
    document.getElementById('hud-next-milestone').innerText = `(${Math.max(0, Math.round(250 - this.distance))}m to Boss)`;
    document.getElementById('hud-moonpies').innerText = `${this.dragonSquad.squadSize} 🐉`;
    if (document.getElementById('hud-ammo-count')) {
      document.getElementById('hud-ammo-count').innerText = evo.name;
    }
    document.getElementById('hud-score').innerText = Math.round(this.score).toString().padStart(5, '0');

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
    if (this.state === 'GAMEOVER' || this.state === 'VICTORY') return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.run(t));
  }
}
