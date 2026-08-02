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
      if (bossCount <= 1) return; // Zero potholes on 1st boss fight
      // Subsequent boss fights: spawn fewer potholes for balanced difficulty
      if (Math.random() > 0.45) return;
    }

    const roadX = 24;
    const roadWidth = this.canvasWidth - 48;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -90;
    const radius = 32 + Math.random() * 10;

    const vertices = [];
    const numPoints = 8 + Math.floor(Math.random() * 4);
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

      ctx.fillStyle = '#181d2e';
      ctx.beginPath();
      ctx.moveTo(p.vertices[0].x * 1.2, p.vertices[0].y * 1.2);
      for (let i = 1; i < p.vertices.length; i++) {
        ctx.lineTo(p.vertices[i].x * 1.2, p.vertices[i].y * 1.2);
      }
      ctx.closePath();
      ctx.fill();

      const holeGradient = ctx.createRadialGradient(0, 0, p.radius * 0.2, 0, 0, p.radius * 1.1);
      holeGradient.addColorStop(0, '#020308');
      holeGradient.addColorStop(0.7, '#0b0e1a');
      holeGradient.addColorStop(1, '#1e243b');

      ctx.fillStyle = holeGradient;
      ctx.beginPath();
      ctx.moveTo(p.vertices[0].x, p.vertices[0].y);
      for (let i = 1; i < p.vertices.length; i++) {
        ctx.lineTo(p.vertices[i].x, p.vertices[i].y);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ff2a6d';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff2a6d';
      ctx.shadowBlur = 4;
      for (let i = 0; i < p.vertices.length; i += 2) {
        const v = p.vertices[i];
        ctx.beginPath();
        ctx.moveTo(v.x * 0.8, v.y * 0.8);
        ctx.lineTo(v.x * 1.4, v.y * 1.4);
        ctx.stroke();
      }

      ctx.fillStyle = '#4a5568';
      ctx.fillRect(p.vertices[0].x * 1.3, p.vertices[0].y * 1.3, 3, 3);
      ctx.fillRect(p.vertices[2].x * 1.2, p.vertices[2].y * 1.4, 4, 3);
      ctx.fillRect(p.vertices[4].x * 1.3, p.vertices[4].y * 1.1, 3, 4);

      ctx.restore();
    }
    ctx.restore();
  }
}
