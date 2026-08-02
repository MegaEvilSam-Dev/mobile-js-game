export class HUD {
  constructor(onBuyItem, onResumeRun, onStartRun, onRestartRun, onToggleSound) {
    this.onBuyItem = onBuyItem;
    this.onResumeRun = onResumeRun;
    this.onStartRun = onStartRun;
    this.onRestartRun = onRestartRun;
    this.onToggleSound = onToggleSound;

    // DOM Elements with safe fallback checks
    this.hudLayer = document.getElementById('hud');
    this.menuScreen = document.getElementById('menu-screen');
    this.shopScreen = document.getElementById('shop-modal') || document.getElementById('shop-screen');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.bossHud = document.getElementById('boss-hud');
    this.warningBanner = document.getElementById('boss-warning') || document.getElementById('warning-banner');

    this.elPotholes = document.getElementById('hud-potholes');
    this.elNextMilestone = document.getElementById('hud-next-milestone');
    this.elMoonpies = document.getElementById('hud-moonpies');
    this.elAmmoCount = document.getElementById('hud-ammo-count');
    this.elIntervalMoonpies = document.getElementById('hud-interval-moonpies');
    this.elScore = document.getElementById('hud-score');
    this.elPowerupBar = document.getElementById('powerup-bar') || document.getElementById('powerup-status');

    this.elBossHpText = document.getElementById('boss-hp-text');
    this.elBossHpFill = document.getElementById('boss-hp-fill');

    this.elShopMoonpies = document.getElementById('shop-currency') || document.getElementById('shop-moonpie-count');

    this.elGoPotholes = document.getElementById('go-potholes');
    this.elGoMoonpies = document.getElementById('go-moonpies');
    this.elGoScore = document.getElementById('go-score');
    this.elGoHighscore = document.getElementById('go-highscore');

    this.soundBtn = document.getElementById('sound-toggle-btn');

    this.bindEvents();
  }

  bindEvents() {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.onclick = () => this.onStartRun();

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.onclick = () => this.onRestartRun();

    const resumeBtn = document.getElementById('shop-resume-btn') || document.getElementById('resume-btn');
    if (resumeBtn) resumeBtn.onclick = () => this.onResumeRun();

    const pauseResume = document.getElementById('pause-resume-btn');
    if (pauseResume) pauseResume.onclick = () => this.onResumeRun();

    if (this.soundBtn) this.soundBtn.onclick = () => this.onToggleSound();

    // Shop Buy Buttons
    document.querySelectorAll('.buy-btn').forEach((btn) => {
      btn.onclick = (e) => {
        try {
          const item = e.target.getAttribute('data-item');
          const cost = parseInt(e.target.getAttribute('data-cost'), 10);
          this.onBuyItem(item, cost);
        } catch (err) {}
      };
    });
  }

  showMenu() {
    if (this.menuScreen) this.menuScreen.classList.remove('hidden');
    if (this.hudLayer) this.hudLayer.classList.add('hidden');
    if (this.shopScreen) this.shopScreen.classList.add('hidden');
    if (this.gameoverScreen) this.gameoverScreen.classList.add('hidden');
    if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
  }

  showPause() {
    if (this.pauseScreen) this.pauseScreen.classList.remove('hidden');
  }

  hidePause() {
    if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
  }

  showGameHUD() {
    if (this.menuScreen) this.menuScreen.classList.add('hidden');
    if (this.shopScreen) this.shopScreen.classList.add('hidden');
    if (this.gameoverScreen) this.gameoverScreen.classList.add('hidden');
    if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
    if (this.hudLayer) this.hudLayer.classList.remove('hidden');
  }

  openShop(moonpies) {
    if (this.elShopMoonpies) this.elShopMoonpies.innerText = moonpies;
    
    document.querySelectorAll('.buy-btn').forEach((btn) => {
      const cost = parseInt(btn.getAttribute('data-cost'), 10);
      if (moonpies < cost) {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }
    });

    if (this.shopScreen) this.shopScreen.classList.remove('hidden');
  }

  closeShop() {
    if (this.shopScreen) this.shopScreen.classList.add('hidden');
  }

  showWarning() {
    if (this.warningBanner) {
      this.warningBanner.classList.remove('hidden');
      setTimeout(() => {
        if (this.warningBanner) this.warningBanner.classList.add('hidden');
      }, 2500);
    }
  }

  showBossHUD() {
    if (this.bossHud) this.bossHud.classList.remove('hidden');
  }

  hideBossHUD() {
    if (this.bossHud) this.bossHud.classList.add('hidden');
  }

  updateBossHp(hpPercent) {
    if (this.elBossHpText) this.elBossHpText.innerText = `${Math.round(hpPercent)}%`;
    if (this.elBossHpFill) this.elBossHpFill.style.width = `${Math.max(0, hpPercent)}%`;
  }

  showGameOver(potholes, moonpies, score, highscore) {
    if (this.elGoPotholes) this.elGoPotholes.innerText = potholes;
    if (this.elGoMoonpies) this.elGoMoonpies.innerText = `${moonpies} 🥮`;
    if (this.elGoScore) this.elGoScore.innerText = Math.round(score);
    if (this.elGoHighscore) this.elGoHighscore.innerText = Math.round(highscore);

    if (this.gameoverScreen) this.gameoverScreen.classList.remove('hidden');
  }

  updateHUD(potholes, moonpies, ammo, intervalMoonpies, score, player) {
    if (this.elPotholes) this.elPotholes.innerText = potholes;
    let nextShop = 25;
    if (potholes >= 25) {
      nextShop = (Math.floor(potholes / 25) + 1) * 25;
    }
    if (this.elNextMilestone) this.elNextMilestone.innerText = `/ ${nextShop} to Boss`;

    if (this.elMoonpies) this.elMoonpies.innerText = moonpies;
    if (this.elAmmoCount) {
      this.elAmmoCount.innerText = `${ammo} Ammo`;
    }
    if (this.elIntervalMoonpies) {
      this.elIntervalMoonpies.innerText = `This interval: ${intervalMoonpies}/3`;
    }

    if (this.elScore) this.elScore.innerText = Math.round(score).toString().padStart(5, '0');

    if (this.elPowerupBar && player) {
      let pillsHTML = '';
      if (player.hasShield) {
        pillsHTML += '<div class="powerup-pill">🛡️ SHIELD READY</div>';
      }
      if (player.magnetActive) {
        pillsHTML += `<div class="powerup-pill">🧲 MAGNET (${Math.ceil(player.magnetTimer)}s)</div>`;
      }
      if (player.hoverActive) {
        pillsHTML += `<div class="powerup-pill">🚀 HOVER (${Math.ceil(player.hoverTimer)}s)</div>`;
      }
      if (player.empBlasters > 0) {
        pillsHTML += `<div class="powerup-pill">💥 EMP CANNON (${player.empBlasters})</div>`;
      }
      this.elPowerupBar.innerHTML = pillsHTML;
    }
  }
}
