export class MoonpieManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.moonpies = [];
    this.numLanes = 3;

    this.intervalMoonpiesSpawned = 0;
    this.maxPerInterval = 3;
    this.currentInterval = 0;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  reset() {
    this.moonpies = [];
    this.intervalMoonpiesSpawned = 0;
    this.currentInterval = 0;
  }

  checkIntervalReset(totalPotholesPassed) {
    const intervalIndex = Math.floor(totalPotholesPassed / 50);
    if (intervalIndex !== this.currentInterval) {
      this.currentInterval = intervalIndex;
      this.intervalMoonpiesSpawned = 0;
    }
  }

  maybeSpawnMoonpie(totalPotholesPassed) {
    this.checkIntervalReset(totalPotholesPassed);

    if (this.intervalMoonpiesSpawned >= this.maxPerInterval) return;

    if (Math.random() < 0.12) {
      const roadX = 24;
      const roadWidth = this.canvasWidth - 48;
      const laneWidth = roadWidth / this.numLanes;

      const lane = Math.floor(Math.random() * this.numLanes);
      const x = roadX + (lane * laneWidth) + (laneWidth / 2);
      const y = -60;

      this.moonpies.push({
        lane,
        x,
        y,
        size: 36,
        rotation: 0
      });

      this.intervalMoonpiesSpawned++;
    }
  }

  update(speed, player, onCollect) {
    const roadX = 24;
    const roadWidth = this.canvasWidth - 48;
    const laneWidth = roadWidth / this.numLanes;

    for (let i = this.moonpies.length - 1; i >= 0; i--) {
      const m = this.moonpies[i];
      m.y += speed;
      m.rotation += 0.03;

      if (player.magnetActive) {
        const dist = Math.hypot(player.x - m.x, (player.y - player.z) - m.y);
        if (dist < 250) {
          m.x += (player.x - m.x) * 0.18;
          m.y += ((player.y - player.z) - m.y) * 0.18;
        }
      } else {
        m.x = roadX + (m.lane * laneWidth) + (laneWidth / 2);
      }

      const distToPlayer = Math.hypot(player.x - m.x, (player.y - player.z) - m.y);
      if (distToPlayer < 48) {
        onCollect(m);
        this.moonpies.splice(i, 1);
        continue;
      }

      if (m.y > this.canvasHeight + 80) {
        this.moonpies.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const m of this.moonpies) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(Math.sin(m.rotation) * 0.12);

      // Biscuit Base (Matte Amber - No Glow)
      const r = m.size / 2;
      const biscuitGrad = ctx.createRadialGradient(-r*0.2, -r*0.2, r*0.1, 0, 0, r);
      biscuitGrad.addColorStop(0, '#fef08a');
      biscuitGrad.addColorStop(0.5, '#f59e0b');
      biscuitGrad.addColorStop(1, '#b45309');

      ctx.fillStyle = biscuitGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Cream Fill
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
      ctx.fill();

      // Chocolate Center
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }
}
