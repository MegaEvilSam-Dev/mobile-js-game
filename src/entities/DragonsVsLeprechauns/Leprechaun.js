export class LeprechaunManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.armyMobs = [];
    this.boss = null;
    this.numLanes = 2;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    if (this.boss) {
      this.boss.x = width / 2;
    }
  }

  reset() {
    this.armyMobs = [];
    this.boss = null;
  }

  // Spawn Total War Red Leprechaun Army Mob with distance-scaled difficulty!
  spawnEnemyArmyMob(speed, distance = 0) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -100;

    const progress = Math.min(1.0, distance / 250);
    const isGoldTank = Math.random() < (0.2 + progress * 0.25);
    const minSize = Math.floor(6 + progress * 8);
    const maxSize = Math.floor(12 + progress * 16);
    const mobSize = minSize + Math.floor(Math.random() * (maxSize - minSize));

    const units = [];
    for (let k = 0; k < mobSize; k++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * Math.min(38, 10 + mobSize * 0.7);
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
      isGoldTank,
      hpPerUnit: isGoldTank ? 4 : 1,
      escaped: false
    });
  }

  // Spawn End-of-Level Giant Leprechaun King Boss
  spawnBoss(hp = 250) {
    this.boss = {
      x: this.canvasWidth / 2,
      y: 120,
      hp,
      maxHp: hp,
      size: 70,
      active: true
    };
  }

  update(speed, dragonSquad, particlePool, onEliminateArmy, onArmyClash, onArmyEscaped, onBossDefeated) {
    // 1. Update Boss Arena Phase (if Boss is active)
    if (this.boss && this.boss.active) {
      // Check fireball hits on Boss
      for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
        const fb = dragonSquad.fireballs[j];
        if (Math.hypot(fb.x - this.boss.x, fb.y - this.boss.y) < this.boss.size / 2 + fb.radius) {
          dragonSquad.fireballs.splice(j, 1);
          this.boss.hp -= 2;

          particlePool.spawnExplosion(fb.x, fb.y, '#eab308', 3);
          particlePool.spawnDamagePopup(fb.x, fb.y - 10, '-2', '#facc15');

          if (this.boss.hp <= 0) {
            this.boss.active = false;
            particlePool.spawnExplosion(this.boss.x, this.boss.y, '#f59e0b', 30);
            particlePool.triggerShake(12, 0.5);
            onBossDefeated();
            break;
          }
        }
      }
      return;
    }

    // 2. Update Regular Army Mobs
    for (let i = this.armyMobs.length - 1; i >= 0; i--) {
      const mob = this.armyMobs[i];
      mob.y += mob.isGoldTank ? (speed * 0.75) : speed;

      // Fireball hits
      for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
        const fb = dragonSquad.fireballs[j];
        if (Math.abs(fb.x - mob.x) < 45 && Math.abs(fb.y - mob.y) < 40) {
          dragonSquad.fireballs.splice(j, 1);
          mob.hpPerUnit -= 1;

          particlePool.spawnExplosion(fb.x, fb.y, '#ef4444', 2);
          particlePool.spawnDamagePopup(fb.x, fb.y - 10, '-1', '#f87171');

          if (mob.hpPerUnit <= 0) {
            mob.hpPerUnit = mob.isGoldTank ? 4 : 1;
            mob.mobSize -= 1;
            if (mob.units.length > mob.mobSize) mob.units.pop();

            if (mob.mobSize <= 0) {
              onEliminateArmy(mob);
              this.armyMobs.splice(i, 1);
              break;
            }
          }
        }
      }

      // Total War Mob Clash with Dragon Squad
      if (Math.abs(mob.y - dragonSquad.y) < 45 && mob.lane === dragonSquad.lane) {
        const clashRate = 2;
        const clashAmount = Math.min(mob.mobSize, Math.min(dragonSquad.squadSize, clashRate));

        mob.mobSize -= clashAmount;
        dragonSquad.removeDragons(clashAmount);

        particlePool.triggerShake(5, 0.15);
        particlePool.spawnExplosion(mob.x, mob.y, '#f59e0b', 6);

        while (mob.units.length > mob.mobSize) mob.units.pop();
        onArmyClash();

        if (mob.mobSize <= 0) {
          this.armyMobs.splice(i, 1);
          continue;
        }
      }

      // Escaped Army
      if (!mob.escaped && mob.y > dragonSquad.y + 40) {
        mob.escaped = true;
        onArmyEscaped(mob.mobSize);
      }

      if (mob.y > this.canvasHeight + 100) {
        this.armyMobs.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // 1. Draw Boss if Active
    if (this.boss && this.boss.active) {
      ctx.save();
      ctx.translate(this.boss.x, this.boss.y);

      // Giant Crown
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-24, -36);
      ctx.lineTo(-32, -65);
      ctx.lineTo(-12, -45);
      ctx.lineTo(0, -70);
      ctx.lineTo(12, -45);
      ctx.lineTo(32, -65);
      ctx.lineTo(24, -36);
      ctx.fill();

      // Giant Leprechaun Head
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, 0, this.boss.size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Gold Pot Armor
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 10, 16, 0, Math.PI * 2);
      ctx.fill();

      // Giant Health Bar Overhead
      const hpPercent = Math.max(0, this.boss.hp / this.boss.maxHp);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(-60, -85, 120, 12);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-60, -85, 120 * hpPercent, 12);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(`LEPRECHAUN KING HP: ${Math.max(0, this.boss.hp)}`, 0, -76);

      ctx.restore();
    }

    // 2. Draw Regular Army Mobs
    for (const mob of this.armyMobs) {
      ctx.save();
      ctx.translate(mob.x, mob.y);

      for (const u of mob.units) {
        ctx.fillStyle = mob.isGoldTank ? '#eab308' : '#ef4444';
        ctx.beginPath();
        ctx.arc(u.offsetX, u.offsetY, mob.isGoldTank ? 9 : 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = mob.isGoldTank ? '#ca8a04' : '#991b1b';
        ctx.fillRect(u.offsetX - 5, u.offsetY - 11, 10, 4);
      }

      // Army Badge Counter
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = mob.isGoldTank ? '#eab308' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-24, -40, 48, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = mob.isGoldTank ? '#facc15' : '#ef4444';
      ctx.font = '900 12px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mob.isGoldTank ? `${mob.mobSize} 🪙` : `${mob.mobSize} ☘️`, 0, -29);

      ctx.restore();
    }

    ctx.restore();
  }
}
