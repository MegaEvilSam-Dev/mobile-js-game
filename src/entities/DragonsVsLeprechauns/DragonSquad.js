export class DragonSquad {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.numLanes = 2;
    this.lane = 0;
    this.x = canvasWidth / 2;
    this.targetX = canvasWidth / 2;
    this.y = canvasHeight - 160;

    this.squadSize = 5; // Starts with a mini mob of 5 dragons!
    this.units = [];
    this.fireballs = [];
    this.shootTimer = 0;

    this.rebuildMob();
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

  setSquadSize(newSize) {
    this.squadSize = Math.max(0, Math.min(300, Math.round(newSize)));
    this.rebuildMob();
  }

  addDragons(count) {
    this.squadSize = Math.min(300, this.squadSize + Math.round(count));
    this.rebuildMob();
  }

  removeDragons(count) {
    this.squadSize = Math.max(0, this.squadSize - Math.round(count));
    this.rebuildMob();
  }

  // Organic Total War Mob Swarm positioning
  rebuildMob() {
    const targetVisualCount = Math.min(60, this.squadSize);
    while (this.units.length < targetVisualCount) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * Math.min(45, 12 + targetVisualCount * 1.2);
      this.units.push({
        offsetX: Math.cos(angle) * radius,
        offsetY: Math.sin(angle) * (radius * 0.6),
        vx: 0,
        vy: 0
      });
    }
    if (this.units.length > targetVisualCount) {
      this.units.length = targetVisualCount;
    }
  }

  update(dt, soundSynth) {
    // Fluid horizontal steering towards lane center
    this.x += (this.targetX - this.x) * 0.25;

    // Update Mob Swarm Unit Positions
    for (const unit of this.units) {
      const targetUnitX = this.x + unit.offsetX;
      const targetUnitY = this.y + unit.offsetY;
      unit.vx = (targetUnitX - (unit.currX || targetUnitX)) * 0.3;
      unit.vy = (targetUnitY - (unit.currY || targetUnitY)) * 0.3;
      unit.currX = (unit.currX || targetUnitX) + unit.vx;
      unit.currY = (unit.currY || targetUnitY) + unit.vy;
    }

    // Auto Fireball Salvo Stream
    this.shootTimer += dt;
    const shootCooldown = Math.max(0.08, 0.3 - (Math.min(20, this.squadSize) * 0.01));
    if (this.shootTimer > shootCooldown) {
      this.shootTimer = 0;

      // Front units fire upward fireballs
      const numShooters = Math.min(8, Math.max(1, Math.floor(this.squadSize / 3)));
      for (let i = 0; i < numShooters; i++) {
        const u = this.units[i % this.units.length];
        const fx = u ? (u.currX || this.x) : this.x;
        const fy = u ? (u.currY || this.y) : this.y;

        this.fireballs.push({
          x: fx,
          y: fy - 15,
          speed: 15,
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
    if (this.squadSize <= 0) return;

    ctx.save();

    // 1. Draw Total War Mob Swarm Units
    for (const unit of this.units) {
      const ux = unit.currX || this.x;
      const uy = unit.currY || this.y;

      ctx.save();
      ctx.translate(ux, uy);

      // Dragon Unit Body
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Dragon Wings
      ctx.fillStyle = '#047857';
      ctx.fillRect(-11, -3, 22, 3);
      ctx.restore();
    }

    // 2. Draw Mob Leader Badge & Squad Counter
    ctx.save();
    ctx.translate(this.x, this.y - 45);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-24, -12, 48, 24, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 13px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.squadSize} 🐉`, 0, 1);

    ctx.restore();

    // 3. Draw Fireball Salvoes
    ctx.fillStyle = '#f97316';
    for (const fb of this.fireballs) {
      ctx.beginPath();
      ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
