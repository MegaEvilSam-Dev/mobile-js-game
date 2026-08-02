export class GateManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.gates = [];
    this.numLanes = 2;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  reset() {
    this.gates = [];
  }

  spawnSingleStaggeredGate() {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    // Pick 1 lane (0 or 1) for staggered gate spawn
    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    
    // Gate value ranges from -2 to +4
    const value = Math.floor(Math.random() * 7) - 2;
    const y = -80;

    this.gates.push({
      lane,
      x,
      y,
      width: laneWidth - 12,
      value,
      passed: false
    });
  }

  update(speed, dragonSquad, onHitGate) {
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const g = this.gates[i];
      g.y += speed;

      // Check fireball hits -> INCREASES THE GATE VALUE!
      for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
        const fb = dragonSquad.fireballs[j];
        if (Math.abs(fb.x - g.x) < g.width / 2 && Math.abs(fb.y - g.y) < 25) {
          dragonSquad.fireballs.splice(j, 1);
          g.value += 1; // Shooting the gate increases value!
        }
      }

      // Check Dragon collision with gate
      if (!g.passed && Math.abs(g.y - dragonSquad.y) < 30 && g.lane === dragonSquad.lane) {
        g.passed = true;
        onHitGate(g.value);
        this.gates.splice(i, 1);
        continue;
      }

      if (g.y > this.canvasHeight + 80) {
        this.gates.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const g of this.gates) {
      if (g.passed) continue;

      ctx.save();
      ctx.translate(g.x, g.y);

      const isPositive = g.value >= 0;
      const color = isPositive ? '#10b981' : '#ef4444';
      const label = isPositive ? `+${g.value}` : `${g.value}`;

      // Archway Box
      ctx.fillStyle = isPositive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.roundRect(-g.width / 2, -25, g.width, 50, 10);
      ctx.fill();
      ctx.stroke();

      // Posts
      ctx.fillStyle = color;
      ctx.fillRect(-g.width / 2, -25, 6, 50);
      ctx.fillRect(g.width / 2 - 6, -25, 6, 50);

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 18px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, -2);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '600 10px Outfit';
      ctx.fillText('SHOOT TO BOOST 🎯', 0, 15);

      ctx.restore();
    }
    ctx.restore();
  }
}
