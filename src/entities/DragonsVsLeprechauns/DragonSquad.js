export class DragonSquad {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.numLanes = 2;
    this.lane = 0;
    this.x = canvasWidth / 2;
    this.targetX = canvasWidth / 2;
    this.y = canvasHeight - 160;

    this.squadSize = 1; // Starts at 1 Hatchling
    this.units = [];
    this.fireballs = [];
    this.shootTimer = 0;

    // Power-Up Buff Timers
    this.shieldTimer = 0;
    this.multiFireTimer = 0;
    this.speedShootTimer = 0;

    this.isBossBreathAttack = false;

    this.rebuildMob();
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.y = height - 160;
    this.updatePosition(true);
  }

  setTargetX(mouseX) {
    const margin = 50;
    this.targetX = Math.max(margin, Math.min(this.canvasWidth - margin, mouseX));
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
    if (this.shieldTimer > 0) return; // Shield invulnerability!
    this.squadSize = Math.max(0, this.squadSize - Math.round(count));
    this.rebuildMob();
  }

  applyPowerUp(type) {
    if (type === 'shield') this.shieldTimer = 10;
    if (type === 'multifire') this.multiFireTimer = 10;
    if (type === 'speedshoot') this.speedShootTimer = 10;
  }

  getEvolutionTier() {
    if (this.squadSize >= 25) return { name: 'ANCIENT DRAGON', scale: 1.4, color: '#f59e0b', body: '#047857' };
    if (this.squadSize >= 10) return { name: 'DRAKE DRAGON', scale: 1.2, color: '#10b981', body: '#065f46' };
    return { name: 'HATCHLING', scale: 1.0, color: '#34d399', body: '#047857' };
  }

  rebuildMob() {
    const targetVisualCount = Math.min(50, this.squadSize);
    while (this.units.length < targetVisualCount) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * Math.min(45, 12 + targetVisualCount * 1.2);
      this.units.push({
        offsetX: Math.cos(angle) * radius,
        offsetY: Math.sin(angle) * (radius * 0.6),
        currX: this.x,
        currY: this.y
      });
    }
    if (this.units.length > targetVisualCount) {
      this.units.length = targetVisualCount;
    }
  }

  update(dt) {
    // Smooth Lerp Steering to Target X
    this.x += (this.targetX - this.x) * 0.28;

    // Update Buff Timers
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.multiFireTimer > 0) this.multiFireTimer -= dt;
    if (this.speedShootTimer > 0) this.speedShootTimer -= dt;

    // Trailing Breadcrumb Mob Physics
    for (const unit of this.units) {
      const targetUnitX = this.x + unit.offsetX;
      const targetUnitY = this.y + unit.offsetY;
      unit.currX += (targetUnitX - unit.currX) * 0.35;
      unit.currY += (targetUnitY - unit.currY) * 0.35;
    }

    // Auto Fireball System
    this.shootTimer += dt;
    let baseCooldown = Math.max(0.08, 0.28 - (Math.min(20, this.squadSize) * 0.01));
    if (this.speedShootTimer > 0) baseCooldown /= 2;
    if (this.isBossBreathAttack) baseCooldown = 0.04;

    if (this.shootTimer > baseCooldown) {
      this.shootTimer = 0;

      const numShooters = Math.min(12, Math.max(1, Math.floor(this.squadSize / 2)));
      for (let i = 0; i < numShooters; i++) {
        const u = this.units[i % this.units.length];
        const fx = u ? u.currX : this.x;
        const fy = u ? u.currY : this.y;

        if (this.multiFireTimer > 0) {
          this.fireballs.push({ x: fx, y: fy - 15, vx: -3, vy: -16, radius: 6 });
          this.fireballs.push({ x: fx, y: fy - 15, vx: 0, vy: -16, radius: 6 });
          this.fireballs.push({ x: fx, y: fy - 15, vx: 3, vy: -16, radius: 6 });
        } else {
          this.fireballs.push({ x: fx, y: fy - 15, vx: 0, vy: -16, radius: 6 });
        }
      }
    }

    // Update Fireballs
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.x += (fb.vx || 0);
      fb.y += (fb.vy || -16);
      if (fb.y < -40 || fb.x < -20 || fb.x > this.canvasWidth + 20) {
        this.fireballs.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    if (this.squadSize <= 0) return;

    const evo = this.getEvolutionTier();

    ctx.save();

    // 1. Draw Trailing Squad Clones
    for (const unit of this.units) {
      ctx.save();
      ctx.translate(unit.currX, unit.currY);
      ctx.fillStyle = evo.color;
      ctx.beginPath();
      ctx.arc(0, 0, 7 * evo.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = evo.body;
      ctx.fillRect(-10 * evo.scale, -3, 20 * evo.scale, 3);
      ctx.restore();
    }

    // 2. Draw Lead Dragon (with Evolution Scale & Buff Visuals)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(evo.scale, evo.scale);

    if (this.shieldTimer > 0) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.squadSize >= 25) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-12, -26);
      ctx.lineTo(-16, -42);
      ctx.lineTo(-5, -30);
      ctx.lineTo(0, -46);
      ctx.lineTo(5, -30);
      ctx.lineTo(16, -42);
      ctx.lineTo(12, -26);
      ctx.closePath();
      ctx.fill();
    }

    // Wings
    ctx.fillStyle = evo.body;
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

    // Body & Snout
    ctx.fillStyle = evo.color;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = evo.body;
    ctx.beginPath();
    ctx.roundRect(-10, -28, 20, 16, 4);
    ctx.fill();

    ctx.restore();

    // 3. Draw Squad Counter Badge
    ctx.save();
    ctx.translate(this.x, this.y - 50);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = evo.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-35, -12, 70, 24, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 12px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.squadSize} 🐉`, 0, 1);
    ctx.restore();

    // 4. Draw Fireballs
    ctx.fillStyle = '#f97316';
    for (const fb of this.fireballs) {
      ctx.beginPath();
      ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
