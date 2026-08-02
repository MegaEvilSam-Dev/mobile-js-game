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
      mobSize = Math.floor(Math.random() * 2) + 1;
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

  update(speed, dragonSquad, particlePool, onEliminateArmy, onArmyClash, onArmyEscaped, onBossDefeated) {
    let isAnyBossEngaged = false;

    // 1. Update Lane Bosses
    for (let i = this.bosses.length - 1; i >= 0; i--) {
      const boss = this.bosses[i];

      if (!boss.isEngaged && Math.abs(boss.y - dragonSquad.y) < 40 && boss.lane === dragonSquad.lane) {
        boss.isEngaged = true;
        particlePool.triggerShake(6, 0.3);
      }

      if (boss.isEngaged) {
        isAnyBossEngaged = true;
        boss.y = dragonSquad.y - 35;
      } else {
        boss.y += speed * 0.45;
      }

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
    const activeSpeed = isAnyBossEngaged ? 0 : speed;
    for (let i = this.armyMobs.length - 1; i >= 0; i--) {
      const mob = this.armyMobs[i];
      mob.y += mob.isGoldTank ? (activeSpeed * 0.75) : activeSpeed;

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

    // 1. Draw Cute Cartoon Lane Bosses
    for (const boss of this.bosses) {
      ctx.save();
      ctx.translate(boss.x, boss.y);

      // Cartoon Crown
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-20, -38);
      ctx.lineTo(-28, -62);
      ctx.lineTo(-10, -45);
      ctx.lineTo(0, -68);
      ctx.lineTo(10, -45);
      ctx.lineTo(28, -62);
      ctx.lineTo(20, -38);
      ctx.fill();

      // Cartoon Green Top Hat
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-22, -38, 44, 25);
      ctx.fillRect(-30, -15, 60, 6);

      // Gold Hat Buckle
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-8, -25, 16, 10);

      // Cute Cartoon Head & Face
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, 5, 24, 0, Math.PI * 2);
      ctx.fill();

      // Silly Orange Beard
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(0, 14, 22, 0, Math.PI);
      ctx.fill();

      // Cute Big Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-8, 2, 5, 0, Math.PI * 2);
      ctx.arc(8, 2, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-8, 2, 2.5, 0, Math.PI * 2);
      ctx.arc(8, 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Health Bar
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

    // 2. Draw Cute Cartoon Leprechaun Mobs & Gold Pot Tanks
    for (const mob of this.armyMobs) {
      ctx.save();
      ctx.translate(mob.x, mob.y);

      for (const u of mob.units) {
        ctx.save();
        ctx.translate(u.offsetX, u.offsetY);

        if (mob.isGoldTank) {
          // Cartoon Gold Pot Tank
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(0, 2, 11, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, -3, 8, 0, Math.PI);
          ctx.fill();
        } else {
          // Cartoon Cute Leprechaun
          ctx.fillStyle = '#ea580c'; // Orange beard
          ctx.beginPath();
          ctx.arc(0, 4, 8, 0, Math.PI);
          ctx.fill();

          ctx.fillStyle = '#fed7aa'; // Face
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#15803d'; // Green Top Hat
          ctx.fillRect(-6, -11, 12, 6);
          ctx.fillRect(-8, -5, 16, 2);

          ctx.fillStyle = '#ffffff'; // Eyes
          ctx.beginPath();
          ctx.arc(-2.5, -1, 1.8, 0, Math.PI * 2);
          ctx.arc(2.5, -1, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Mob Size Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = mob.isGoldTank ? '#facc15' : '#ef4444';
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
