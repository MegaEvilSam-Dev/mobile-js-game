export class DragonSquad {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.numLanes = 2;
    this.lane = 0;
    this.x = canvasWidth / 2;
    this.targetX = canvasWidth / 2;
    this.y = canvasHeight - 160;

    this.squadSize = 1;
    this.units = [];
    this.fireballs = [];
    this.shootTimer = 0;

    this.shieldTimer = 0;
    this.multiFireTimer = 0;
    this.speedShootTimer = 0;

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
    const val = Number(newSize);
    if (isNaN(val) || !isFinite(val)) return;
    this.squadSize = Math.max(0, Math.min(300, Math.round(val)));
    this.rebuildMob();
  }

  addDragons(count) {
    const val = Number(count);
    if (isNaN(val) || !isFinite(val)) return;
    this.squadSize = Math.min(300, this.squadSize + Math.round(val));
    this.rebuildMob();
  }

  removeDragons(count) {
    if (this.shieldTimer > 0) return;
    const val = Number(count);
    if (isNaN(val) || !isFinite(val)) return;
    this.squadSize = Math.max(0, this.squadSize - Math.round(val));
    this.rebuildMob();
  }

  applyPowerUp(type) {
    if (type === 'shield') this.shieldTimer = 10;
    if (type === 'multifire') this.multiFireTimer = 10;
    if (type === 'speedshoot') this.speedShootTimer = 10;
  }

  getEvolutionTier() {
    if (this.squadSize >= 25) return { name: 'ANCIENT DRAGON', scale: 1.45, color: '#10b981', body: '#047857', horn: '#f59e0b', eye: '#fef08a' };
    if (this.squadSize >= 10) return { name: 'DRAKE DRAGON', scale: 1.25, color: '#34d399', body: '#059669', horn: '#fbbf24', eye: '#ffffff' };
    return { name: 'HATCHLING', scale: 1.0, color: '#6ee7b7', body: '#10b981', horn: '#fef08a', eye: '#ffffff' };
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
    this.x += (this.targetX - this.x) * 0.28;

    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.multiFireTimer > 0) this.multiFireTimer -= dt;
    if (this.speedShootTimer > 0) this.speedShootTimer -= dt;

    for (const unit of this.units) {
      const targetUnitX = this.x + unit.offsetX;
      const targetUnitY = this.y + unit.offsetY;
      unit.currX += (targetUnitX - unit.currX) * 0.35;
      unit.currY += (targetUnitY - unit.currY) * 0.35;
    }

    // Fireball Salvo System (Throttled for balanced arcade feel)
    this.shootTimer += dt;
    let baseCooldown = Math.max(0.12, 0.28 - (Math.min(15, this.squadSize) * 0.008));
    if (this.speedShootTimer > 0) baseCooldown /= 2;

    if (this.shootTimer > baseCooldown) {
      this.shootTimer = 0;

      const numShooters = Math.min(8, Math.max(1, Math.floor(this.squadSize / 3)));
      for (let i = 0; i < numShooters; i++) {
        const u = this.units[i % this.units.length];
        const fx = u ? u.currX : this.x;
        const fy = u ? u.currY : this.y;

        if (this.multiFireTimer > 0) {
          this.fireballs.push({ x: fx, y: fy - 18, vx: -3, vy: -15, radius: 6.5 });
          this.fireballs.push({ x: fx, y: fy - 18, vx: 0, vy: -15, radius: 6.5 });
          this.fireballs.push({ x: fx, y: fy - 18, vx: 3, vy: -15, radius: 6.5 });
        } else {
          this.fireballs.push({ x: fx, y: fy - 18, vx: 0, vy: -15, radius: 6.5 });
        }
      }
    }

    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.x += (fb.vx || 0);
      fb.y += (fb.vy || -15);
      if (fb.y < -40 || fb.x < -20 || fb.x > this.canvasWidth + 20) {
        this.fireballs.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    if (this.squadSize <= 0) return;

    const evo = this.getEvolutionTier();

    ctx.save();

    // 1. Draw Trailing Cartoon Dragon Clones
    for (const unit of this.units) {
      ctx.save();
      ctx.translate(unit.currX, unit.currY);

      // Cute Cartoon Body
      ctx.fillStyle = evo.color;
      ctx.beginPath();
      ctx.arc(0, 0, 8 * evo.scale, 0, Math.PI * 2);
      ctx.fill();

      // Cute Big Eyes
      ctx.fillStyle = evo.eye;
      ctx.beginPath();
      ctx.arc(-3, -3, 2.5, 0, Math.PI * 2);
      ctx.arc(3, -3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-3, -3, 1.2, 0, Math.PI * 2);
      ctx.arc(3, -3, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 2. Draw Lead Highly Stylized Dragon
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(evo.scale, evo.scale);

    // Shield Energy Bubble
    if (this.shieldTimer > 0) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ancient Dragon Majestic Golden Crown
    if (this.squadSize >= 25) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-14, -26);
      ctx.lineTo(-18, -44);
      ctx.lineTo(-6, -30);
      ctx.lineTo(0, -48);
      ctx.lineTo(6, -30);
      ctx.lineTo(18, -44);
      ctx.lineTo(14, -26);
      ctx.closePath();
      ctx.fill();
    }

    // Stylized Gradient Wings
    ctx.fillStyle = evo.body;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-45, -28, -68, 10);
    ctx.quadraticCurveTo(-40, 28, 0, 0);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(45, -28, 68, 10);
    ctx.quadraticCurveTo(40, 28, 0, 0);
    ctx.fill();

    // Stylized Body & Head
    ctx.fillStyle = evo.color;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Stylized Crest Horns
    ctx.fillStyle = evo.horn;
    ctx.beginPath();
    ctx.moveTo(-10, -18); ctx.lineTo(-18, -34); ctx.lineTo(-4, -22); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -18); ctx.lineTo(18, -34); ctx.lineTo(4, -22); ctx.fill();

    // Cartoon Cute Snout
    ctx.fillStyle = evo.body;
    ctx.beginPath();
    ctx.roundRect(-11, -28, 22, 16, 6);
    ctx.fill();

    // Expressive Cartoon Eyes with Dual Shine Highlights
    ctx.fillStyle = evo.eye;
    ctx.beginPath();
    ctx.arc(-8, -12, 6, 0, Math.PI * 2);
    ctx.arc(8, -12, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-8, -12, 3, 0, Math.PI * 2);
    ctx.arc(8, -12, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-9.5, -13.5, 1.3, 0, Math.PI * 2);
    ctx.arc(6.5, -13.5, 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 3. Draw Squad Counter Badge
    ctx.save();
    ctx.translate(this.x, this.y - 52);
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

    // 4. Stylized Glowing Fireballs
    for (const fb of this.fireballs) {
      ctx.save();
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(fb.x, fb.y, fb.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}
