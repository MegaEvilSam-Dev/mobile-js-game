export class ParticlePool {
  constructor(maxParticles = 150) {
    this.maxParticles = maxParticles;
    this.pool = [];
    this.activeParticles = [];
    this.damagePopups = [];
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;

    for (let i = 0; i < maxParticles; i++) {
      this.pool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: '#ffffff',
        radius: 4,
        life: 0,
        maxLife: 1
      });
    }
  }

  triggerShake(intensity = 6, duration = 0.25) {
    this.screenShakeIntensity = intensity;
    this.screenShakeTime = duration;
  }

  spawnExplosion(x, y, color = '#f97316', count = 12) {
    for (let i = 0; i < count; i++) {
      if (this.pool.length === 0) break;
      const p = this.pool.pop();

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.color = color;
      p.radius = 3 + Math.random() * 4;
      p.life = 0.3 + Math.random() * 0.3;
      p.maxLife = p.life;

      this.activeParticles.push(p);
    }
  }

  spawnDamagePopup(x, y, text, color = '#ffffff') {
    this.damagePopups.push({
      x,
      y,
      text,
      color,
      life: 0.8,
      maxLife: 0.8
    });
  }

  update(dt) {
    // Update Screen Shake
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
      if (this.screenShakeTime <= 0) {
        this.screenShakeIntensity = 0;
      }
    }

    // Update Particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;

      if (p.life <= 0) {
        this.activeParticles.splice(i, 1);
        this.pool.push(p);
      }
    }

    // Update Floating Damage Popups
    for (let i = this.damagePopups.length - 1; i >= 0; i--) {
      const pop = this.damagePopups[i];
      pop.y -= 1.2;
      pop.life -= dt;
      if (pop.life <= 0) {
        this.damagePopups.splice(i, 1);
      }
    }
  }

  applyShakeTransform(ctx) {
    if (this.screenShakeTime > 0) {
      const offsetX = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
      const offsetY = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
      ctx.translate(offsetX, offsetY);
    }
  }

  draw(ctx) {
    ctx.save();
    // Render Particles
    for (const p of this.activeParticles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Floating Damage Popups
    ctx.globalAlpha = 1.0;
    for (const pop of this.damagePopups) {
      const alpha = Math.max(0, pop.life / pop.maxLife);
      ctx.fillStyle = pop.color;
      ctx.globalAlpha = alpha;
      ctx.font = '800 16px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, pop.x, pop.y);
    }

    ctx.restore();
  }
}
