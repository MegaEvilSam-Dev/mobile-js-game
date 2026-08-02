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

  // Spawn Horizontally Bundled Enemy Cluster with Varying Speeds & Types
  spawnBundledCluster(speed) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const laneCenterX = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -60;

    const count = 2 + Math.floor(Math.random() * 2);
    const offsets = [-20, 0, 20];

    // Varying Enemy Types & Speeds!
    for (let k = 0; k < count; k++) {
      const offsetX = offsets[k % offsets.length];
      const randType = Math.random();
      
      let speedMult = 1.0;
      let hp = 1;
      let type = 'standard';

      if (randType < 0.3) {
        speedMult = 1.35; // Fast Runner!
        type = 'runner';
      } else if (randType > 0.7) {
        speedMult = 0.75; // Armored Heavy!
        hp = 2;
        type = 'armored';
      }

      this.leprechauns.push({
        lane,
        x: laneCenterX + offsetX,
        y,
        baseSpeedMult: speedMult,
        hp,
        maxHp: hp,
        size: type === 'armored' ? 32 : 28,
        type,
        isMiniBoss: false,
        escaped: false
      });
    }
  }

  // Spawn Tougher Giant Leprechaun King Mini-Boss (10 HP)
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
      baseSpeedMult: 0.7, // Heavy boss approach speed
      hp: 10, // Tougher Mini-Boss (10 HP)!
      maxHp: 10,
      size: 48,
      isMiniBoss: true,
      escaped: false
    });
  }

  update(speed, dragonSquad, onEliminateLeprechaun, onEliminateMiniBoss, onLeprechaunEscaped) {
    for (let i = this.leprechauns.length - 1; i >= 0; i--) {
      const lep = this.leprechauns[i];
      
      // Move downward with varying enemy speeds
      lep.y += speed * lep.baseSpeedMult;

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
        // --- TOUGHER MINI-BOSS (10 HP) ---
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, lep.size / 2 + 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.arc(0, 0, lep.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Giant Gold Crown
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-16, -24);
        ctx.lineTo(-20, -44);
        ctx.lineTo(-7, -32);
        ctx.lineTo(0, -48);
        ctx.lineTo(7, -32);
        ctx.lineTo(20, -44);
        ctx.lineTo(16, -24);
        ctx.closePath();
        ctx.fill();

        const hpPercent = lep.hp / lep.maxHp;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-22, -56, 44, 6);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-22, -56, 44 * hpPercent, 6);

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 10px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(`TOUGH MINI-BOSS ${lep.hp}HP`, 0, -62);

      } else if (lep.type === 'runner') {
        // --- FAST RUNNER ENEMY (Green Fast Aura) ---
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(0, 0, lep.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#047857';
        ctx.fillRect(-14, -22, 28, 5);
        ctx.fillRect(-9, -36, 18, 14);

        ctx.fillStyle = '#f59e0b';
        ctx.font = '800 9px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ FAST', 0, 4);

      } else if (lep.type === 'armored') {
        // --- ARMORED HEAVY ENEMY (2 HP) ---
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, lep.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-16, -24, 32, 5);
        ctx.fillRect(-10, -38, 20, 14);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '800 9px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(`ARMORED ${lep.hp}HP`, 0, 4);

      } else {
        // --- STANDARD ENEMY (1 HP) ---
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
