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

  // Spawn Horizontally Bundled Enemy Cluster (Side-by-side row)
  spawnBundledCluster(speed) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const laneCenterX = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -60;

    // Spawn 2 to 3 enemies side-by-side horizontally across the lane
    const count = 2 + Math.floor(Math.random() * 2); // 2 or 3 enemies
    const offsets = [-20, 0, 20];

    for (let k = 0; k < count; k++) {
      const offsetX = offsets[k % offsets.length];
      this.leprechauns.push({
        lane,
        x: laneCenterX + offsetX,
        y,
        hp: 1,
        maxHp: 1,
        size: 28,
        isMiniBoss: false,
        escaped: false
      });
    }
  }

  // Spawn Giant Leprechaun King Mini-Boss (Toned down HP from 15 to 6)
  spawnMiniBoss(speed) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -80;

    this.leprechauns.push({
      lane,
      x,
      y,
      hp: 6, // Reduced HP from 15 to 6 for balanced difficulty!
      maxHp: 6,
      size: 46,
      isMiniBoss: true,
      escaped: false
    });
  }

  update(speed, dragonSquad, onEliminateLeprechaun, onEliminateMiniBoss, onLeprechaunEscaped) {
    for (let i = this.leprechauns.length - 1; i >= 0; i--) {
      const lep = this.leprechauns[i];
      lep.y += speed;

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
      if (Math.abs(lep.y - dragonSquad.y) < 38 && Math.abs(lep.x - dragonSquad.x) < 40) {
        const damage = lep.isMiniBoss ? 2 : 1;
        dragonSquad.removeDragons(damage);
        this.leprechauns.splice(i, 1);
        continue;
      }

      // Check if enemy ESCAPED past the player!
      if (!lep.escaped && lep.y > dragonSquad.y + 40) {
        lep.escaped = true;
        const penalty = lep.isMiniBoss ? 2 : 1;
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
        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.arc(0, 0, lep.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-16, -24);
        ctx.lineTo(-20, -42);
        ctx.lineTo(-7, -30);
        ctx.lineTo(0, -46);
        ctx.lineTo(7, -30);
        ctx.lineTo(20, -42);
        ctx.lineTo(16, -24);
        ctx.closePath();
        ctx.fill();

        const hpPercent = lep.hp / lep.maxHp;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-20, -54, 40, 5);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-20, -54, 40 * hpPercent, 5);

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 10px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(`MINI-BOSS ${lep.hp}HP`, 0, -60);
      } else {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, 0, lep.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#166534';
        ctx.fillRect(-14, -22, 28, 5);
        ctx.fillRect(-9, -36, 18, 14);

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-3, -26, 6, 6);
      }

      ctx.restore();
    }
    ctx.restore();
  }
}
