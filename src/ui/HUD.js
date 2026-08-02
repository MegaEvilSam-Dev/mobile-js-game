export class HUD {
  constructor(onBuyItem, onResumeRun, onStartRun, onRestartRun, onToggleSound) {
    this.onBuyItem = onBuyItem;
    this.onResumeRun = onResumeRun;
    this.onStartRun = onStartRun;
    this.onRestartRun = onRestartRun;
    this.onToggleSound = onToggleSound;

    // DOM Elements
    this.hudLayer = document.getElementById('hud');
    this.menuScreen = document.getElementById('menu-screen');
    this.shopScreen = document.getElementById('shop-screen');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.bossHud = document.getElementById('boss-hud');
    this.warningBanner = document.getElementById('warning-banner');

    this.elPotholes = document.getElementById('hud-potholes');
    this.elNextMilestone = document.getElementById('hud-next-milestone');
    this.elMoonpies = document.getElementById('hud-moonpies');
    this.elAmmoCount = document.getElementById('hud-ammo-count');
    this.elIntervalMoonpies = document.getElementById('hud-interval-moonpies');
    this.elScore = document.getElementById('hud-score');
    this.elPowerupBar = document.getElementById('powerup-status');

    this.elBossHpText = document.getElementById('boss-hp-text');
    this.elBossHpFill = document.getElementById('boss-hp-fill');

    this.elShopMoonpies = document.getElementById('shop-moonpie-count');

    this.elGoPotholes = document.getElementById('go-potholes');
    this.elGoMoonpies = document.getElementById('go-moonpies');
    this.elGoScore = document.getElementById('go-score');
    this.elGoHighscore = document.getElementById('go-highscore');

    this.soundBtn = document.getElementById('sound-toggle-btn');

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('start-btn').addEventListener('click', () => this.onStartRun());
    document.getElementById('restart-btn').addEventListener('click', () => this.onRestartRun());
    document.getElementById('resume-btn').addEventListener('click', () => this.onResumeRun());
    this.soundBtn.addEventListener('click', () => this.onToggleSound());

    // Shop Buy Buttons
    document.querySelectorAll('.buy-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = e.target.getAttribute('data-item');
        const cost = parseInt(e.target.getAttribute('data-cost'), 10);
        this.onBuyItem(item, cost);
      });
    });
  }

  showMenu() {
    this.menuScreen.classList.remove('hidden');
    this.hudLayer.classList.add('hidden');
    this.shopScreen.classList.add('hidden');
    this.gameoverScreen.classList.add('hidden');
  }

  showGameHUD() {
    this.menuScreen.classList.add('hidden');
    this.shopScreen.classList.add('hidden');
    this.gameoverScreen.classList.add('hidden');
    this.hudLayer.classList.remove('hidden');
  }

  openShop(moonpies) {
    this.elShopMoonpies.innerText = `${moonpies} 🥮`;
    
    // Update button states based on affordable moonpies
    document.querySelectorAll('.buy-btn').forEach((btn) => {
      const cost = parseInt(btn.getAttribute('data-cost'), 10);
      if (moonpies < cost) {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }
    });

    this.shopScreen.classList.remove('hidden');
  }

  closeShop() {
    this.shopScreen.classList.add('hidden');
  }

  showWarning() {
    this.warningBanner.classList.remove('hidden');
    setTimeout(() => {
      this.warningBanner.classList.add('hidden');
    }, 2500);
  }

  showBossHUD() {
    this.bossHud.classList.remove('hidden');
  }

  hideBossHUD() {
    this.bossHud.classList.add('hidden');
  }

  updateBossHp(hpPercent) {
    this.elBossHpText.innerText = `${Math.round(hpPercent)}%`;
    this.elBossHpFill.style.width = `${Math.max(0, hpPercent)}%`;
  }

  showGameOver(potholes, moonpies, score, highscore) {
    this.elGoPotholes.innerText = potholes;
    this.elGoMoonpies.innerText = `${moonpies} 🥮`;
    this.elGoScore.innerText = Math.round(score);
    this.elGoHighscore.innerText = Math.round(highscore);

    this.gameoverScreen.classList.remove('hidden');
  }

  updateHUD(potholes, moonpies, ammo, intervalMoonpies, score, player) {
    this.elPotholes.innerText = potholes;
    let nextShop = 25;
    if (potholes >= 25) {
      nextShop = (Math.floor(potholes / 25) + 1) * 25;
    }
    this.elNextMilestone.innerText = `/ ${nextShop} (Milestone)`;

    this.elMoonpies.innerText = moonpies;
    if (this.elAmmoCount) {
      this.elAmmoCount.innerText = `(${ammo} Shots)`;
    }
    this.elIntervalMoonpies.innerText = `This interval: ${intervalMoonpies}/3`;

    this.elScore.innerText = Math.round(score).toString().padStart(5, '0');

    // Update active powerup pills
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
      pillsHTML += `<div class="powerup-pill">💥 EMP BLAST (${player.empBlasters})</div>`;
    }
    this.elPowerupBar.innerHTML = pillsHTML;
  }
}
