export class PotholeManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.potholes = [];
    this.numLanes = 3;
    this.totalPotholesPassed = 0;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  reset() {
    this.potholes = [];
    this.totalPotholesPassed = 0;
  }

  spawnPothole(speed, isBossFight = false, bossCount = 0) {
    // 1st Dragon Boss Fight: NO potholes spawn!
    if (isBossFight) {
      if (bossCount <= 1) return;
      if (Math.random() > 0.45) return;
    }

    const roadX = 24;
    const roadWidth = this.canvasWidth - 48;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -90;
    const radius = 30 + Math.random() * 8;

    const vertices = [];
    const numPoints = 9 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const dist = radius * (0.8 + Math.random() * 0.4);
      vertices.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.65
      });
    }

    this.potholes.push({
      lane,
      x,
      y,
      radius,
      vertices,
      passed: false
    });
  }

  update(speed, player, onPotholePassed, onPotholeHit) {
    const roadX = 24;
    const roadWidth = this.canvasWidth - 48;
    const laneWidth = roadWidth / this.numLanes;

    for (let i = this.potholes.length - 1; i >= 0; i--) {
      const p = this.potholes[i];
      p.y += speed;
      p.x = roadX + (p.lane * laneWidth) + (laneWidth / 2);

      if (!p.passed && p.y > player.y + 40) {
        p.passed = true;
        this.totalPotholesPassed++;
        onPotholePassed(this.totalPotholesPassed);
      }

      if (Math.abs(p.y - player.y) < 45 && p.lane === player.lane) {
        if (player.z <= 25 && !player.hoverActive) {
          onPotholeHit(p);
          this.potholes.splice(i, 1);
          continue;
        }
      }

      if (p.y > this.canvasHeight + 100) {
        this.potholes.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.potholes) {
      ctx.save();
      ctx.translate(p.x, p.y);

      // 1. Outer Crumbled Asphalt Shadow
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(p.vertices[0].x * 1.18, p.vertices[0].y * 1.18);
      for (let i = 1; i < p.vertices.length; i++) {
        ctx.lineTo(p.vertices[i].x * 1.18, p.vertices[i].y * 1.18);
      }
      ctx.closePath();
      ctx.fill();

      // 2. Deep Asphalt Crater Pit
      const holeGradient = ctx.createRadialGradient(0, 0, p.radius * 0.15, 0, 0, p.radius * 1.05);
      holeGradient.addColorStop(0, '#020617'); // Dark bottom pit
      holeGradient.addColorStop(0.65, '#0f172a');
      holeGradient.addColorStop(1, '#334155'); // Rim asphalt edge

      ctx.fillStyle = holeGradient;
      ctx.beginPath();
      ctx.moveTo(p.vertices[0].x, p.vertices[0].y);
      for (let i = 1; i < p.vertices.length; i++) {
        ctx.lineTo(p.vertices[i].x, p.vertices[i].y);
      }
      ctx.closePath();
      ctx.fill();

      // 3. Jagged Fracture Crack Lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < p.vertices.length; i += 2) {
        const v = p.vertices[i];
        ctx.beginPath();
        ctx.moveTo(v.x * 0.75, v.y * 0.75);
        ctx.lineTo(v.x * 1.35, v.y * 1.35);
        ctx.stroke();
      }

      // 4. Loose Rock Fragment Details
      ctx.fillStyle = '#64748b';
      ctx.fillRect(p.vertices[0].x * 1.25, p.vertices[0].y * 1.25, 3, 3);
      ctx.fillRect(p.vertices[2].x * 1.2, p.vertices[2].y * 1.3, 4, 3);
      ctx.fillRect(p.vertices[4].x * 1.25, p.vertices[4].y * 1.1, 3, 4);

      ctx.restore();
    }
    ctx.restore();
  }
}
