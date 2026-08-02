export class DragonBoss {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.active = false;
    this.hp = 100;
    this.maxHp = 100;

    this.x = canvasWidth / 2;
    this.y = -180;
    this.targetY = 165; // Lower position so dragon is 100% visible below HUD

    this.wingAngle = 0;
    this.fireballs = [];
    this.projectiles = [];
    this.numLanes = 3;

    this.attackTimer = 0;
    this.telegraphLane = -1;
    this.telegraphTimer = 0;
    
    this.survivalTimer = 25;

    this.penaltyActive = false;
    this.penaltyTimer = 0;
    this.lastFeedbackMsg = '';
    this.feedbackTimer = 0;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  spawn() {
    this.active = true;
    this.maxHp = 40;
    this.hp = 40;
    this.x = this.canvasWidth / 2;
    this.y = -180;
    this.targetY = 165;
    this.fireballs = [];
    this.projectiles = [];
    this.attackTimer = 0;
    this.telegraphLane = -1;
    this.telegraphTimer = 0;
    this.survivalTimer = 25;

    this.penaltyActive = false;
    this.penaltyTimer = 0;
    this.lastFeedbackMsg = '';
    this.feedbackTimer = 0;
  }

  throwMoonpie(playerX, playerY) {
    if (!this.active) return false;

    this.projectiles.push({
      x: playerX,
      y: playerY - 30,
      targetY: this.y + 20,
      speed: 14,
      size: 32,
      rotation: 0
    });
    return true;
  }

  takeDamage(amount) {
    if (!this.active) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.defeat();
    }
  }

  defeat() {
    this.active = false;
    this.fireballs = [];
    this.projectiles = [];
  }

  update(dt, player, onFireballHit, onHitDragon, onMissDragon, soundSynth) {
    if (!this.active) return;

    this.y += (this.targetY - this.y) * 0.05;
    this.x = (this.canvasWidth / 2) + Math.sin(Date.now() * 0.003) * (this.canvasWidth * 0.28);
    this.wingAngle = Math.sin(Date.now() * 0.012) * 0.55;

    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= dt;
    }

    if (this.penaltyActive) {
      this.penaltyTimer -= dt;
      if (this.penaltyTimer <= 0) {
        this.penaltyActive = false;
      }
    } else {
      this.survivalTimer -= dt;
      if (this.survivalTimer <= 0) {
        this.defeat();
        return;
      }
    }

    // Update Thrown Moonpie Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.y -= pr.speed;
      pr.rotation += 0.2;

      if (pr.y <= this.y + 40) {
        const hitDistance = Math.abs(pr.x - this.x);
        if (hitDistance < 65) {
          this.takeDamage(60);
          soundSynth.playMoonpieChime();
          this.lastFeedbackMsg = '💥 DIRECT MOONPIE HIT! +3,000 PTS!';
          this.feedbackTimer = 2.0;
          onHitDragon(3000);
        } else {
          soundSynth.playPotholeCrash();
          this.penaltyActive = true;
          this.penaltyTimer = 10.0;
          this.lastFeedbackMsg = '❌ MISSED! DODGE FOR 10 SECONDS (NO POINTS)!';
          this.feedbackTimer = 2.5;
          onMissDragon();
        }
        this.projectiles.splice(i, 1);
      }
    }

    // Dragon Fireball Attack Loop
    this.attackTimer += dt;
    if (this.attackTimer > (this.penaltyActive ? 1.4 : 2.2)) {
      this.attackTimer = 0;
      this.telegraphLane = Math.floor(Math.random() * this.numLanes);
      this.telegraphTimer = 0.7;
    }

    if (this.telegraphTimer > 0) {
      this.telegraphTimer -= dt;
      if (this.telegraphTimer <= 0 && this.telegraphLane !== -1) {
        const roadX = 24;
        const roadWidth = this.canvasWidth - 48;
        const laneWidth = roadWidth / this.numLanes;
        const fireX = roadX + (this.telegraphLane * laneWidth) + (laneWidth / 2);
        
        this.fireballs.push({
          lane: this.telegraphLane,
          x: fireX,
          y: this.y + 50,
          speed: 10,
          radius: 24
        });

        soundSynth.playDragonRoar();
        this.telegraphLane = -1;
      }
    }

    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.y += fb.speed;

      if (Math.abs(fb.y - player.y) < 45 && fb.lane === player.lane) {
        if (player.z <= 25 && !player.hoverActive) {
          onFireballHit(fb);
          this.fireballs.splice(i, 1);
          continue;
        }
      }

      if (fb.y > this.canvasHeight + 60) {
        this.fireballs.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    // 1. Telegraph Warning Box (Muted Matte Amber)
    if (this.telegraphLane !== -1) {
      const roadX = 24;
      const roadWidth = this.canvasWidth - 48;
      const laneWidth = roadWidth / this.numLanes;
      const warnX = roadX + (this.telegraphLane * laneWidth);

      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.fillRect(warnX, 0, laneWidth, this.canvasHeight);
      
      ctx.fillStyle = '#f59e0b';
      ctx.font = '700 14px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('🐊 GATOR FIREBALL! 🐊', warnX + laneWidth/2, this.canvasHeight / 2);
    }

    // 2. Render Dragon (Matte Swamp Green - No Canvas Glow)
    ctx.save();
    ctx.translate(this.x, this.y);

    // Left Wing
    ctx.save();
    ctx.rotate(this.wingAngle);
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-75, -50, -125, 10);
    ctx.quadraticCurveTo(-70, 45, 0, 0);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-125, 10);
    ctx.stroke();
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.rotate(-this.wingAngle);
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(75, -50, 125, 10);
    ctx.quadraticCurveTo(70, 45, 0, 0);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(125, 10);
    ctx.stroke();
    ctx.restore();

    // Body
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.roundRect(-16, 10, 32, 26, 6);
    ctx.fill();

    // Teeth
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-12, 36); ctx.lineTo(-8, 42); ctx.lineTo(-4, 36);
    ctx.moveTo(4, 36); ctx.lineTo(8, 42); ctx.lineTo(12, 36);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(-14, -8, 6, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(14, -8, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 3. Thrown Moonpie Projectiles
    for (const pr of this.projectiles) {
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.rotation);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, pr.size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, pr.size / 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 4. Fireballs (Matte Red/Orange - No Glow)
    for (const fb of this.fireballs) {
      ctx.save();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(fb.x, fb.y, fb.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 5. Feedback Message Banner
    if (this.feedbackTimer > 0) {
      ctx.fillStyle = this.penaltyActive ? '#ef4444' : '#10b981';
      ctx.font = '700 13px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(this.lastFeedbackMsg, this.canvasWidth / 2, 260);

      if (this.penaltyActive) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = '600 12px Outfit';
        ctx.fillText(`DODGE PENALTY: ${Math.ceil(this.penaltyTimer)}s REMAINING`, this.canvasWidth / 2, 278);
      }
    }

    ctx.restore();
  }
}
