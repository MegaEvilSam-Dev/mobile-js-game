export class DragonSquad {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.numLanes = 2; // Mode 2 is 2 lanes!
    this.lane = 0; // 0 = Left Lane, 1 = Right Lane (or position between lanes)
    this.x = canvasWidth / 2;
    this.targetX = canvasWidth / 2;
    this.y = canvasHeight - 160;

    this.dragonCount = 1; // Starts with 1 main dragon!
    this.fireballs = [];
    this.shootTimer = 0;
    this.wingAngle = 0;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.y = height - 160;
    this.updatePosition(true);
  }

  updatePosition(immediate = false) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;
    
    // Calculate X coordinate based on lane (0 = Left, 1 = Right)
    this.targetX = roadX + (this.lane * laneWidth) + (laneWidth / 2);
    if (immediate) {
      this.x = this.targetX;
    }
  }

  moveLeft() {
    if (this.lane > 0) {
      this.lane--;
      this.updatePosition();
    }
  }

  moveRight() {
    if (this.lane < this.numLanes - 1) {
      this.lane++;
      this.updatePosition();
    }
  }

  addDragons(count) {
    this.dragonCount += count;
  }

  removeDragons(count) {
    this.dragonCount = Math.max(0, this.dragonCount - count);
  }

  update(dt, soundSynth) {
    // Smooth lane transition
    this.x += (this.targetX - this.x) * 0.25;
    this.wingAngle = Math.sin(Date.now() * 0.015) * 0.4;

    // Automatic Fireball Shooting
    this.shootTimer += dt;
    if (this.shootTimer > 0.25) {
      this.shootTimer = 0;

      // Main dragon shoots
      this.fireballs.push({
        x: this.x,
        y: this.y - 30,
        speed: 14,
        radius: 8
      });

      // Mini dragons also shoot!
      const numMiniShooters = Math.min(6, this.dragonCount - 1);
      for (let i = 0; i < numMiniShooters; i++) {
        const offsetAngle = ((i / numMiniShooters) * Math.PI) - (Math.PI / 2);
        const offsetX = Math.cos(offsetAngle) * 35;
        this.fireballs.push({
          x: this.x + offsetX,
          y: this.y - 15,
          speed: 14,
          radius: 6
        });
      }
    }

    // Update Fireballs
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.y -= fb.speed;
      if (fb.y < -40) {
        this.fireballs.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    if (this.dragonCount <= 0) return;

    ctx.save();

    // 1. Draw Mini Dragons (Flock flying alongside main dragon)
    const miniCount = Math.min(20, this.dragonCount - 1);
    for (let i = 0; i < miniCount; i++) {
      const radiusOffset = 38 + Math.floor(i / 6) * 22;
      const angle = (i * 0.8) + (Date.now() * 0.003);
      const mx = this.x + Math.cos(angle) * radiusOffset;
      const my = this.y + Math.sin(angle) * (radiusOffset * 0.5);

      ctx.save();
      ctx.translate(mx, my);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      // Mini Wings
      ctx.fillStyle = '#065f46';
      ctx.fillRect(-14, -4, 28, 4);
      ctx.restore();
    }

    // 2. Draw Main Player Dragon
    ctx.save();
    ctx.translate(this.x, this.y);

    // Wings
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-45, -30, -65, 10);
    ctx.quadraticCurveTo(-40, 30, 0, 0);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(45, -30, 65, 10);
    ctx.quadraticCurveTo(40, 30, 0, 0);
    ctx.fill();

    // Body
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.roundRect(-10, -30, 20, 18, 4);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(-8, -12, 4, 0, Math.PI * 2);
    ctx.arc(8, -12, 4, 0, Math.PI * 2);
    ctx.fill();

    // Squad Counter Badge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.font = '800 12px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.dragonCount.toString(), 0, 1);

    ctx.restore();

    // 3. Draw Fireball Projectiles
    ctx.fillStyle = '#f97316';
    for (const fb of this.fireballs) {
      ctx.beginPath();
      ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
