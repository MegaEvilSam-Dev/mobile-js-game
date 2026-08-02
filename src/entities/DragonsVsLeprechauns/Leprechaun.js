export class LeprechaunManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.armyMobs = [];
    this.numLanes = 2;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  reset() {
    this.armyMobs = [];
  }

  // Spawn Total War Red Leprechaun Army Mob
  spawnEnemyArmyMob(speed) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -100;

    const mobSize = 15 + Math.floor(Math.random() * 35); // Army mob of 15-50 enemy units!

    // Build visual unit array for enemy mob
    const units = [];
    for (let k = 0; k < mobSize; k++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * Math.min(40, 10 + mobSize * 0.8);
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

  update(speed, dragonSquad, onEliminateArmy, onArmyClash, onArmyEscaped) {
    for (let i = this.armyMobs.length - 1; i >= 0; i--) {
      const mob = this.armyMobs[i];
      mob.y += speed;

      // Check hits from dragon fireball salvoes
      for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
        const fb = dragonSquad.fireballs[j];
        if (Math.abs(fb.x - mob.x) < 45 && Math.abs(fb.y - mob.y) < 40) {
          dragonSquad.fireballs.splice(j, 1);
          mob.mobSize -= 1;
          if (mob.units.length > mob.mobSize) mob.units.pop();

          if (mob.mobSize <= 0) {
            onEliminateArmy(mob);
            this.armyMobs.splice(i, 1);
            break;
          }
        }
      }

      // Check Total War Mob Clash (Green Dragon Mob vs Red Leprechaun Army)
      if (Math.abs(mob.y - dragonSquad.y) < 45 && mob.lane === dragonSquad.lane) {
        // Real-time mass clash!
        const clashRate = 2; // Clash 2 units per frame tick
        const clashAmount = Math.min(mob.mobSize, Math.min(dragonSquad.squadSize, clashRate));

        mob.mobSize -= clashAmount;
        dragonSquad.removeDragons(clashAmount);

        while (mob.units.length > mob.mobSize) mob.units.pop();
        onArmyClash();

        if (mob.mobSize <= 0) {
          this.armyMobs.splice(i, 1);
          continue;
        }
      }

      // Check if Red Army Mob ESCAPES past player
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
    for (const mob of this.armyMobs) {
      ctx.save();
      ctx.translate(mob.x, mob.y);

      // Draw Red Leprechaun Mob Units
      for (const u of mob.units) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(u.offsetX, u.offsetY, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#991b1b';
        ctx.fillRect(u.offsetX - 5, u.offsetY - 11, 10, 4);
      }

      // Draw Red Army Badge Counter
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
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
