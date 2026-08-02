export class LeprechaunManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.leprechauns = [];
    this.numLanes = 2;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  reset() {
    this.leprechauns = [];
  }

  // Spawn Bundled Cluster of 3-5 Basic Enemies
  spawnBundledCluster(speed) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const clusterSize = 3 + Math.floor(Math.random() * 3); // 3 to 5 enemies

    for (let k = 0; k < clusterSize; k++) {
      const y = -60 - (k * 36); // Stacked formation
      this.leprechauns.push({
        lane,
        x,
        y,
        hp: 1,
        maxHp: 1,
        size: 30,
        isMiniBoss: false,
        escaped: false
      });
    }
  }

  // Spawn Giant Leprechaun King Mini-Boss with Increased Health (15 HP)
  spawnMiniBoss(speed) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -90;

    this.leprechauns.push({
      lane,
      x,
      y,
      hp: 15, // Increased health!
      maxHp: 15,
      size: 52,
      isMiniBoss: true,
      escaped: false
    });
  }

  update(speed, dragonSquad, onEliminateLeprechaun, onEliminateMiniBoss, onLeprechaunEscaped) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    for (let i = this.leprechauns.length - 1; i >= 0; i--) {
      const lep = this.leprechauns[i];
      lep.y += speed;
      lep.x = roadX + (lep.lane * laneWidth) + (laneWidth / 2);

      // Check hits from dragon fireballs
      for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
        const fb = dragonSquad.fireballs[j];
        if (Math.hypot(fb.x - lep.x, fb.y - lep.y) < lep.size / 2 + fb.radius) {
          dragonSquad.fireballs.splice(j, 1);
          lep.hp--;
          if (lep.hp <= 0) {
            if (lep.isMiniBoss) {
              onEliminateMiniBoss(lep);
            } else {
              onEliminateLeprechaun(lep);
            }
            this.leprechauns.splice(i, 1);
            break;
          }
        }
      }

      // Check collision with main dragon
      if (Math.abs(lep.y - dragonSquad.y) < 40 && lep.lane === dragonSquad.lane) {
        const damage = lep.isMiniBoss ? 3 : 1;
        dragonSquad.removeDragons(damage);
        this.leprechauns.splice(i, 1);
        continue;
      }

      // Check if enemy ESCAPED past the player!
      if (!lep.escaped && lep.y > dragonSquad.y + 40) {
        lep.escaped = true;
        const penalty = lep.isMiniBoss ? 3 : 1;
        onLeprechaunEscaped(penalty);
      }

      if (lep.y > this.canvasHeight + 60) {
        this.leprechauns.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const lep of this.leprechauns) {
      ctx.save();
      ctx.translate(lep.x, lep.y);

      if (lep.isMiniBoss) {
        // --- GIANT LEPRECHAUN KING MINI-BOSS ---
        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.arc(0, 0, lep.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Giant Gold Crown
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-18, -26);
        ctx.lineTo(-24, -48);
        ctx.lineTo(-8, -34);
        ctx.lineTo(0, -52);
        ctx.lineTo(8, -34);
        ctx.lineTo(24, -48);
        ctx.lineTo(18, -26);
        ctx.closePath();
        ctx.fill();

        // Health Bar above Mini-Boss
        const hpPercent = lep.hp / lep.maxHp;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-22, -60, 44, 6);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-22, -60, 44 * hpPercent, 6);

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 10px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(`MINI-BOSS ${lep.hp}HP`, 0, -66);

      } else {
        // --- BASIC LEPRECHAUN ---
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, 0, lep.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#166534';
        ctx.fillRect(-16, -26, 32, 6);
        ctx.fillRect(-10, -42, 20, 16);

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-4, -30, 8, 8);
      }

      ctx.restore();
    }
    ctx.restore();
  }
}
