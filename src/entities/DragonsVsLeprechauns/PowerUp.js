export class PowerUpManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.items = [];
    this.numLanes = 2;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  reset() {
    this.items = [];
  }

  spawnPowerUp(speed) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -60;

    const types = ['shield', 'multifire', 'speedshoot'];
    const type = types[Math.floor(Math.random() * types.length)];

    this.items.push({
      lane,
      x,
      y,
      type,
      radius: 18,
      rotation: 0
    });
  }

  update(speed, dragonSquad, onCollectPowerUp) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += speed;
      item.rotation += 0.05;

      // Check collision with dragon squad
      if (Math.hypot(item.x - dragonSquad.x, item.y - dragonSquad.y) < item.radius + 24) {
        onCollectPowerUp(item.type);
        this.items.splice(i, 1);
        continue;
      }

      if (item.y > this.canvasHeight + 60) {
        this.items.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const item of this.items) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);

      if (item.type === 'shield') {
        // Shield Orb
        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', 0, 0);

      } else if (item.type === 'multifire') {
        // Multi-Fire Flame Orb
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#fb923c';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', 0, 0);

      } else if (item.type === 'speedshoot') {
        // Speed-Shoot Lightning Orb
        ctx.fillStyle = '#eab308';
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);
      }

      ctx.restore();
    }
    ctx.restore();
  }
}
