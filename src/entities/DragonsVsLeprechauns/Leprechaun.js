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

  spawnLeprechaun(speed) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -60;

    this.leprechauns.push({
      lane,
      x,
      y,
      hp: 2,
      maxHp: 2,
      size: 32,
      escaped: false
    });
  }

  update(speed, dragonSquad, onEliminateLeprechaun, onLeprechaunEscaped) {
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
        if (Math.hypot(fb.x - lep.x, fb.y - lep.y) < lep.size + fb.radius) {
          dragonSquad.fireballs.splice(j, 1);
          lep.hp--;
          if (lep.hp <= 0) {
            onEliminateLeprechaun(lep);
            this.leprechauns.splice(i, 1);
            break;
          }
        }
      }

      // Check collision with main dragon
      if (Math.abs(lep.y - dragonSquad.y) < 40 && lep.lane === dragonSquad.lane) {
        dragonSquad.removeDragons(1);
        this.leprechauns.splice(i, 1);
        continue;
      }

      // Check if Leprechaun ESCAPED past the player!
      if (!lep.escaped && lep.y > dragonSquad.y + 40) {
        lep.escaped = true;
        onLeprechaunEscaped(lep); // -1 to player dragon total!
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

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, 0, lep.size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#166534';
      ctx.fillRect(-16, -26, 32, 6);
      ctx.fillRect(-10, -42, 20, 16);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-4, -30, 8, 8);

      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 4, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }
}
