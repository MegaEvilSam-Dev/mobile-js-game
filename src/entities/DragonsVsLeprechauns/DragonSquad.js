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
    if (this.squadSize >= 25) return { name: 'ANCIENT DRAGON', scale: 1.45, primary: '#047857', secondary: '#065f46', horn: '#d97706', eye: '#ef4444' };
    if (this.squadSize >= 10) return { name: 'DRAKE DRAGON', scale: 1.25, primary: '#059669', secondary: '#047857', horn: '#f59e0b', eye: '#facc15' };
    return { name: 'HATCHLING', scale: 1.0, primary: '#10b981', secondary: '#059669', horn: '#fef08a', eye: '#38bdf8' };
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

    // 1. Draw Realistic Trailing Squad Clones
    for (const unit of this.units) {
      ctx.save();
      ctx.translate(unit.currX, unit.currY);

      // Draconian Body
      ctx.fillStyle = evo.primary;
      ctx.beginPath();
      ctx.arc(0, 0, 7.5 * evo.scale, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = evo.eye;
      ctx.shadowColor = evo.eye;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(-2.5, -2.5, 1.8, 0, Math.PI * 2);
      ctx.arc(2.5, -2.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 2. Draw Realistic Lead Dragon (Muscular Wing Bones & Slit Eyes)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(evo.scale, evo.scale);

    // Shield Energy Aura
    if (this.shieldTimer > 0) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ancient Dragon Spiked Gold Crown
    if (this.squadSize >= 25) {
      ctx.fillStyle = '#d97706';
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

    // Muscular Bat-Like Dragon Wings with Bone Struts
    ctx.fillStyle = evo.secondary;
    ctx.strokeStyle = evo.primary;
    ctx.lineWidth = 2;

    // Left Wing
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-48, -26);
    ctx.lineTo(-68, 6);
    ctx.lineTo(-42, 22);
    ctx.lineTo(-24, 10);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(48, -26);
    ctx.lineTo(68, 6);
    ctx.lineTo(42, 22);
    ctx.lineTo(24, 10);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Realistic Dragon Body & Scale Layer
    ctx.fillStyle = evo.primary;
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, Math.PI * 2);
    ctx.fill();

    // Obsidian Horns
    ctx.fillStyle = evo.horn;
    ctx.beginPath();
    ctx.moveTo(-9, -16); ctx.lineTo(-17, -36); ctx.lineTo(-3, -20); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -16); ctx.lineTo(17, -36); ctx.lineTo(3, -20); ctx.fill();

    // Snout & Brow Ridges
    ctx.fillStyle = evo.secondary;
    ctx.beginPath();
    ctx.roundRect(-10, -28, 20, 15, 5);
    ctx.fill();

    // Slit-Pupil Glowing Dragon Eyes
    ctx.fillStyle = evo.eye;
    ctx.shadowColor = evo.eye;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(-7, -13, 4.5, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(7, -13, 4.5, 3, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Slit Pupils
    ctx.fillStyle = '#0f172a';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(-7, -13, 1.2, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -13, 1.2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 3. Draw Squad Counter Badge
    ctx.save();
    ctx.translate(this.x, this.y - 52);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = evo.primary;
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

    // 4. Realistic Fireballs
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
