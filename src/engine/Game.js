import { RoadRenderer } from './RoadRenderer.js';
import { Player } from '../entities/Player.js';
import { PotholeManager } from '../entities/Potholes.js';
import { MoonpieManager } from '../entities/Moonpie.js';
import { DragonBoss } from '../entities/DragonBoss.js';
import { InputHandler } from './InputHandler.js';
import { SoundSynth } from './SoundSynth.js';
import { HUD } from '../ui/HUD.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;

    this.state = 'MENU';

    this.speed = 4.5; // Comfortable highway cruising speed
    this.score = 0;
    this.potholesDodged = 0;
    this.goldenMoonpies = 0;
    this.moonpieAmmo = 10; // 10 shots per moonpie! Starts with 10 free shots.
    this.highScore = parseFloat(localStorage.getItem('pothole_panic_highscore') || '0');

    this.lastShopMilestone = 0;
    this.lastBossMilestone = 0;
    this.bossCount = 0;

    // Subsystems
    this.road = new RoadRenderer(this.width, this.height);
    this.player = new Player(this.width, this.height);
    this.potholeManager = new PotholeManager(this.width, this.height);
    this.moonpieManager = new MoonpieManager(this.width, this.height);
    this.dragonBoss = new DragonBoss(this.width, this.height);
    this.soundSynth = new SoundSynth();

    this.hud = new HUD(
      (item, cost) => this.handleBuyItem(item, cost),
      () => this.resumeRun(),
      () => this.startRun(),
      () => this.restartRun(),
      () => this.toggleSound()
    );

    const btnThrow = document.getElementById('throw-moonpie-btn');
    if (btnThrow) {
      btnThrow.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleThrowMoonpie();
      });
    }

    this.input = new InputHandler(
      () => this.player.moveLeft(),
      () => this.player.moveRight(),
      () => {
        if (this.state === 'BOSS_FIGHT') {
          this.handleThrowMoonpie();
        } else {
          this.player.jump();
        }
      }
    );

    this.lastTime = 0;
    this.spawnTimer = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  handleThrowMoonpie() {
    if (this.state !== 'BOSS_FIGHT' || !this.dragonBoss.active) return;

    if (this.moonpieAmmo > 0) {
      this.moonpieAmmo--; // Consume 1 ammo shot out of 10 per moonpie
      this.dragonBoss.throwMoonpie(this.player.x, this.player.y);
      this.soundSynth.playJump();
    } else {
      // Emergency shot if out of ammo
      this.dragonBoss.throwMoonpie(this.player.x, this.player.y);
      this.soundSynth.playJump();
    }
  }

  resize() {
    const container = document.getElementById('canvas-container');
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.road.resize(this.width, this.height);
    this.player.resize(this.width, this.height);
    this.potholeManager.resize(this.width, this.height);
    this.moonpieManager.resize(this.width, this.height);
    this.dragonBoss.resize(this.width, this.height);
  }

  toggleSound() {
    this.soundSynth.init();
    const muted = this.soundSynth.toggleMute();
    document.getElementById('sound-toggle-btn').innerText = muted ? '🔇' : '🔊';
  }

  startRun() {
    this.soundSynth.init();
    this.score = 0;
    this.potholesDodged = 0;
    this.goldenMoonpies = 0;
    this.moonpieAmmo = 10; // Starts with 10 ammo shots!
    this.speed = 4.5;
    this.lastShopMilestone = 0;
    this.lastBossMilestone = 0;
    this.bossCount = 0;

    this.potholeManager.reset();
    this.moonpieManager.reset();
    this.dragonBoss.defeat();

    this.player.hasShield = false;
    this.player.magnetActive = false;
    this.player.hoverActive = false;
    this.player.empBlasters = 0;

    this.state = 'RUNNING';
    this.hud.showGameHUD();
    this.hud.hideBossHUD();
  }

  restartRun() {
    this.startRun();
  }

  resumeRun() {
    this.state = 'RUNNING';
    this.hud.closeShop();
  }

  triggerShop() {
    this.state = 'SHOP';
    this.hud.openShop(this.goldenMoonpies);
  }

  triggerBossFight() {
    this.bossCount++;
    this.state = 'BOSS_FIGHT';
    this.hud.showWarning();
    this.soundSynth.playDragonRoar();

    setTimeout(() => {
      if (this.state === 'BOSS_FIGHT') {
        this.dragonBoss.spawn();
        this.hud.showBossHUD();

        if (this.player.empBlasters > 0) {
          this.dragonBoss.takeDamage(40 * this.player.empBlasters);
          this.soundSynth.playEmpBlast();
          this.player.empBlasters = 0;
        }
      }
    }, 1800);
  }

  handleBuyItem(item, cost) {
    if (this.goldenMoonpies >= cost) {
      this.goldenMoonpies -= cost;
      this.soundSynth.playShopBuy();

      if (item === 'shield') {
        this.player.hasShield = true;
      } else if (item === 'magnet') {
        this.player.magnetActive = true;
        this.player.magnetTimer = 15;
      } else if (item === 'jump') {
        this.player.hoverActive = true;
        this.player.hoverTimer = 8;
      } else if (item === 'emp') {
        this.player.empBlasters += 1;
      }

      this.hud.openShop(this.goldenMoonpies);
    }
  }

  gameOver(reason) {
    this.soundSynth.playPotholeCrash();
    this.state = 'GAMEOVER';

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pothole_panic_highscore', this.highScore.toString());
    }

    document.getElementById('gameover-reason').innerText = reason;
    this.hud.showGameOver(this.potholesDodged, this.goldenMoonpies, this.score, this.highScore);
  }

  update(dt) {
    if (this.state !== 'RUNNING' && this.state !== 'BOSS_FIGHT') return;

    if (!(this.state === 'BOSS_FIGHT' && this.dragonBoss.penaltyActive)) {
      this.score += dt * 10 * (this.speed / 4.5);
    }

    this.player.update(dt);

    // Smooth & gentle speed curve (max speed capped at 8.5)
    this.speed = 4.5 + Math.min(4.0, this.potholesDodged * 0.03);
    this.road.update(this.speed);

    this.spawnTimer += dt;
    if (this.spawnTimer > 1.4 / (this.speed / 4.5)) {
      this.spawnTimer = 0;
      const isBoss = (this.state === 'BOSS_FIGHT');
      this.potholeManager.spawnPothole(this.speed, isBoss, this.bossCount);
      if (!isBoss) {
        this.moonpieManager.maybeSpawnMoonpie(this.potholesDodged);
      }
    }

    this.potholeManager.update(
      this.speed,
      this.player,
      (count) => {
        this.potholesDodged = count;
        this.checkMilestones();
      },
      (pothole) => {
        if (this.player.hasShield) {
          this.player.hasShield = false;
          this.soundSynth.playPotholeCrash();
        } else {
          this.gameOver('Crushed in an I-10 Bayway Pothole Crater!');
        }
      }
    );

    this.moonpieManager.update(
      this.speed,
      this.player,
      (moonpie) => {
        this.goldenMoonpies++;
        this.moonpieAmmo += 10; // +10 Ammo Shots per Golden Moonpie collected!
        this.score += 500;
        this.soundSynth.playMoonpieChime();
      }
    );

    if (this.state === 'BOSS_FIGHT' && this.dragonBoss.active) {
      this.dragonBoss.update(
        dt,
        this.player,
        (fireball) => {
          if (this.player.hasShield) {
            this.player.hasShield = false;
            this.soundSynth.playPotholeCrash();
          } else {
            this.gameOver('Struck by Mobile Delta Gator Fireball!');
          }
        },
        (bonusPts) => {
          this.score += bonusPts;
        },
        () => {
          // Miss penalty
        },
        this.soundSynth
      );

      this.hud.updateBossHp((this.dragonBoss.hp / this.dragonBoss.maxHp) * 100);

      if (!this.dragonBoss.active) {
        this.hud.hideBossHUD();
        this.goldenMoonpies += 2;
        this.moonpieAmmo += 10; // Bonus ammo reward!
        this.score += 2500;
        this.state = 'RUNNING';
      }
    }

    this.hud.updateHUD(
      this.potholesDodged,
      this.goldenMoonpies,
      this.moonpieAmmo,
      this.moonpieManager.intervalMoonpiesSpawned,
      this.score,
      this.player
    );
  }

  checkMilestones() {
    // Quick routes: 1st boss at 25 potholes, 2nd boss at 50 potholes, 3rd+ at 75, 100...
    const bossMilestone = Math.floor(this.potholesDodged / 25);
    const shopMilestone = Math.floor(this.potholesDodged / 25);

    if (bossMilestone > this.lastBossMilestone && this.potholesDodged >= 25) {
      this.lastBossMilestone = bossMilestone;
      this.lastShopMilestone = shopMilestone;
      this.triggerBossFight();
      return;
    }

    if (shopMilestone > this.lastShopMilestone && this.potholesDodged >= 25 && this.state !== 'BOSS_FIGHT') {
      this.lastShopMilestone = shopMilestone;
      this.triggerShop();
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.road.draw(this.ctx);
    this.potholeManager.draw(this.ctx);
    this.moonpieManager.draw(this.ctx);
    this.player.draw(this.ctx);

    if (this.dragonBoss.active) {
      this.dragonBoss.draw(this.ctx);
    }
  }

  run(time = 0) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.run(t));
  }
}
