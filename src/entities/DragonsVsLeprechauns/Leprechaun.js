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
  }

  reset() {
    this.armyMobs = [];
    this.bosses = [];
  }

  // Spawn Enemy Mobs
  spawnEnemyArmyMob(speed, distance = 0) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -100;

    const progress = Math.min(2.0, distance / 500);
    const isGoldTank = distance > 100 && (Math.random() < (0.2 + progress * 0.15));

    let mobSize = 2;
    if (distance < 60) {
      mobSize = Math.floor(Math.random() * 2) + 1; // Fragile warm-up
    } else {
      const minSize = Math.floor(3 + progress * 6);
      const maxSize = Math.floor(6 + progress * 12);
      mobSize = minSize + Math.floor(Math.random() * (maxSize - minSize));
    }

    const units = [];
    for (let k = 0; k < mobSize; k++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * Math.min(35, 8 + mobSize * 0.6);
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
      hpPerUnit: isGoldTank ? 3 : 1,
      escaped: false
    });
  }

  // Spawn Boss in a Specific Lane (NOT centered)
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
      isEngaged: false // Set to true when meeting player, pausing damage & track!
    });
  }

  update(speed, dragonSquad, particlePool, onEliminateArmy, onArmyClash, onArmyEscaped, onBossDefeated) {
    let isAnyBossEngaged = false;

    // 1. Update Lane Bosses
    for (let i = this.bosses.length - 1; i >= 0; i--) {
      const boss = this.bosses[i];

      // Check if boss meets player line in same lane
      if (!boss.isEngaged && Math.abs(boss.y - dragonSquad.y) < 40 && boss.lane === dragonSquad.lane) {
        boss.isEngaged = true;
        particlePool.triggerShake(6, 0.3);
      }

      // If engaged, pause downward movement (stops at player line)
      if (boss.isEngaged) {
        isAnyBossEngaged = true;
        boss.y = dragonSquad.y - 35; // Locked at meeting position
      } else {
        boss.y += speed * 0.45; // Moves downward with traffic until meeting player
      }

      // Fireball hits on Boss (Damage to player is 0 while engaged!)
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

    // 2. Update Regular Mobs (only move if boss not engaged)
    const activeSpeed = isAnyBossEngaged ? 0 : speed;
    for (let i = this.armyMobs.length - 1; i >= 0; i--) {
      const mob = this.armyMobs[i];
      mob.y += mob.isGoldTank ? (activeSpeed * 0.75) : activeSpeed;

      // Fireball hits
      for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
        const fb = dragonSquad.fireballs[j];
        if (Math.abs(fb.x - mob.x) < 45 && Math.abs(fb.y - mob.y) < 40) {
          dragonSquad.fireballs.splice(j, 1);
          
          if (mob.isGoldTank) {
            mob.hpPerUnit -= 1;
            if (mob.hpPerUnit <= 0) {
              mob.hpPerUnit = 3;
              mob.mobSize -= 1;
              if (mob.units.length > 0) mob.units.pop();
            }
          } else {
            mob.mobSize -= 1;
            if (mob.units.length > 0) mob.units.pop();
          }

          particlePool.spawnExplosion(fb.x, fb.y, '#ef4444', 3);
          particlePool.spawnDamagePopup(fb.x, fb.y - 10, '-1', '#f87171');

          if (mob.mobSize <= 0) {
            onEliminateArmy(mob);
            this.armyMobs.splice(i, 1);
            break;
          }
        }
      }

      // Total War Mob Clash
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

      // Escaped Army
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

    // 1. Draw Lane Bosses
    for (const boss of this.bosses) {
      ctx.save();
      ctx.translate(boss.x, boss.y);

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

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, 0, boss.size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 10, 16, 0, Math.PI * 2);
      ctx.fill();

      const hpPercent = Math.max(0, boss.hp / boss.maxHp);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(-50, -85, 100, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-50, -85, 100 * hpPercent, 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 10px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(`LANE ${boss.lane + 1} BOSS HP: ${Math.max(0, boss.hp)}`, 0, -76);

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
