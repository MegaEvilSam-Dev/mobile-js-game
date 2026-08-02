export class LeprechaunManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.armyMobs = [];
    this.bosses = [];
    this.numLanes = 2;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;

    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    for (const boss of this.bosses) {
      boss.x = roadX + (boss.lane * laneWidth) + (laneWidth / 2);
    }
  }

  reset() {
    this.armyMobs = [];
    this.bosses = [];
  }

  // Spawn Leprechaun Army Mobs & Individual Enemies (No Coins!)
  spawnEnemyArmyMob(speed, distance = 0) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -100;

    const progress = Math.min(2.0, distance / 500);

    let mobSize = 1;
    if (Math.random() < 0.65) {
      mobSize = Math.floor(Math.random() * 2) + 1; // 1 or 2 small individual units!
    } else {
      const minSize = Math.floor(2 + progress * 4);
      const maxSize = Math.floor(4 + progress * 8);
      mobSize = minSize + Math.floor(Math.random() * (maxSize - minSize));
    }

    const units = [];
    for (let k = 0; k < mobSize; k++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * Math.min(30, 6 + mobSize * 0.5);
      units.push({
        offsetX: Math.cos(angle) * radius,
        offsetY: Math.sin(angle) * (radius * 0.6)
      });
    }

    this.armyMobs.push({
      lane,
      x,
      y,
      mobSize,
      units,
      escaped: false
    });
  }

  spawnBoss(hp = 60) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;
    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);

    this.bosses.push({
      lane,
      x,
      y: -140,
      hp,
      maxHp: hp,
      size: 70,
      active: true,
      isEngaged: false
    });
  }

  update(dt, speed, dragonSquad, particlePool, onEliminateArmy, onArmyClash, onArmyEscaped, onBossDefeated) {
    let isAnyBossEngaged = false;

    // 1. Update Lane Bosses
    for (let i = this.bosses.length - 1; i >= 0; i--) {
      const boss = this.bosses[i];

      if (!boss.isEngaged && Math.abs(boss.y - dragonSquad.y) < 45 && boss.lane === dragonSquad.lane) {
        boss.isEngaged = true;

        // BOSS CLASH DAMAGE EQUALS CURRENT HP!
        const damage = Math.max(1, Math.round(boss.hp));
        dragonSquad.removeDragons(damage);

        particlePool.triggerShake(10, 0.4);
        particlePool.spawnExplosion(boss.x, boss.y, '#ef4444', 25);
        particlePool.spawnDamagePopup(dragonSquad.x, dragonSquad.y - 35, `-${damage} 🐉`, '#ef4444');

        onBossDefeated(boss);
        this.bosses.splice(i, 1);
        continue;
      } else {
        boss.y += speed * 0.45;
      }

      // Fireball hits on Boss
      for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
        const fb = dragonSquad.fireballs[j];
        if (Math.hypot(fb.x - boss.x, fb.y - boss.y) < boss.size / 2 + fb.radius + 10) {
          dragonSquad.fireballs.splice(j, 1);
          boss.hp -= 2;

          particlePool.spawnExplosion(fb.x, fb.y, '#eab308', 3);
          particlePool.spawnDamagePopup(fb.x, fb.y - 10, '-2', '#facc15');

          if (boss.hp <= 0) {
            particlePool.spawnExplosion(boss.x, boss.y, '#f59e0b', 35);
            particlePool.triggerShake(12, 0.4);
            onBossDefeated(boss);
            this.bosses.splice(i, 1);
            break;
          }
        }
      }

      if (boss.y > this.canvasHeight + 120) {
        this.bosses.splice(i, 1);
      }
    }

    // 2. Update Regular Mobs
    for (let i = this.armyMobs.length - 1; i >= 0; i--) {
      const mob = this.armyMobs[i];
      mob.y += speed;

      for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
        const fb = dragonSquad.fireballs[j];
        if (Math.abs(fb.x - mob.x) < 45 && Math.abs(fb.y - mob.y) < 40) {
          dragonSquad.fireballs.splice(j, 1);
          
          mob.mobSize -= 1;
          if (mob.units.length > 0) mob.units.pop();

          particlePool.spawnExplosion(fb.x, fb.y, '#ef4444', 3);
          particlePool.spawnDamagePopup(fb.x, fb.y - 10, '-1', '#f87171');

          if (mob.mobSize <= 0) {
            onEliminateArmy(mob);
            this.armyMobs.splice(i, 1);
            break;
          }
        }
      }

      if (Math.abs(mob.y - dragonSquad.y) < 40 && mob.lane === dragonSquad.lane) {
        const clashAmount = Math.min(mob.mobSize, Math.min(dragonSquad.squadSize, 2));
        mob.mobSize -= clashAmount;
        dragonSquad.removeDragons(clashAmount);

        particlePool.triggerShake(4, 0.12);
        particlePool.spawnExplosion(mob.x, mob.y, '#f59e0b', 5);

        while (mob.units.length > mob.mobSize) mob.units.pop();
        onArmyClash();

        if (mob.mobSize <= 0) {
          this.armyMobs.splice(i, 1);
          continue;
        }
      }

      if (!mob.escaped && mob.y > dragonSquad.y + 40) {
        mob.escaped = true;
        onArmyEscaped(mob.mobSize);
      }

      if (mob.y > this.canvasHeight + 100) {
        this.armyMobs.splice(i, 1);
      }
    }

    return isAnyBossEngaged;
  }

  draw(ctx) {
    ctx.save();

    // 1. Draw Realistic Fantasy Lane Bosses
    for (const boss of this.bosses) {
      ctx.save();
      ctx.translate(boss.x, boss.y);

      // Ermine Velvet Cloak
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.moveTo(-35, -20);
      ctx.lineTo(-45, 30);
      ctx.lineTo(45, 30);
      ctx.lineTo(35, -20);
      ctx.closePath();
      ctx.fill();

      // Heavy Gold & Ruby Crown
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(-22, -38);
      ctx.lineTo(-30, -66);
      ctx.lineTo(-12, -48);
      ctx.lineTo(0, -72);
      ctx.lineTo(12, -48);
      ctx.lineTo(30, -66);
      ctx.lineTo(22, -38);
      ctx.fill();

      // Ruby Gems on Crown
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -60, 3, 0, Math.PI * 2);
      ctx.arc(-22, -55, 2.5, 0, Math.PI * 2);
      ctx.arc(22, -55, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Buckled Leather Hat
      ctx.fillStyle = '#047857';
      ctx.fillRect(-24, -38, 48, 24);
      ctx.fillRect(-32, -14, 64, 6);

      // Gold Buckle
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-9, -26, 18, 12);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, -22, 10, 4);

      // Head & Braided Beard
      ctx.fillStyle = '#fdba74';
      ctx.beginPath();
      ctx.arc(0, 5, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.arc(0, 14, 22, 0, Math.PI);
      ctx.fill();

      // Glowing Boss Eyes
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(-8, 2, 4, 0, Math.PI * 2);
      ctx.arc(8, 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Health / Attack Damage Bar
      const hpPercent = Math.max(0, boss.hp / boss.maxHp);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(-50, -85, 100, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-50, -85, 100 * hpPercent, 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 10px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(`BOSS HP: ${Math.max(0, Math.round(boss.hp))} (DMG: ${Math.max(0, Math.round(boss.hp))})`, 0, -76);

      ctx.restore();
    }

    // 2. Draw Realistic Small Individual Enemies
    for (const mob of this.armyMobs) {
      ctx.save();
      ctx.translate(mob.x, mob.y);

      for (const u of mob.units) {
        ctx.save();
        ctx.translate(u.offsetX, u.offsetY);

        ctx.fillStyle = '#c2410c';
        ctx.beginPath();
        ctx.arc(0, 4, 8, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#047857';
        ctx.fillRect(-6, -11, 12, 6);
        ctx.fillRect(-8, -5, 16, 2);

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-3, -9, 6, 4);

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-2.5, -1, 1.5, 0, Math.PI * 2);
        ctx.arc(2.5, -1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-24, -40, 48, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = '900 12px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${mob.mobSize} ☘️`, 0, -29);

      ctx.restore();
    }

    ctx.restore();
  }
}
