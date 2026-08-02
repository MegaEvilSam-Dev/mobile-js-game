export class Player {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.lane = 1;
    this.numLanes = 3;
    
    this.x = 0;
    this.targetX = 0;
    this.y = canvasHeight - 160;
    
    this.width = 56;
    this.height = 90;
    
    this.z = 0;
    this.velocityZ = 0;
    this.isJumping = false;
    this.gravity = 0.8;

    this.hasShield = false;
    this.magnetActive = false;
    this.magnetTimer = 0;
    this.hoverActive = false;
    this.hoverTimer = 0;
    this.empBlasters = 0;

    this.updateLanePosition(true);
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.y = height - 160;
    this.updateLanePosition(true);
  }

  updateLanePosition(immediate = false) {
    const roadX = 24;
    const roadWidth = this.canvasWidth - 48;
    const laneWidth = roadWidth / this.numLanes;
    this.targetX = roadX + (this.lane * laneWidth) + (laneWidth / 2);
    if (immediate) {
      this.x = this.targetX;
    }
  }

  moveLeft() {
    if (this.lane > 0) {
      this.lane--;
      this.updateLanePosition();
    }
  }

  moveRight() {
    if (this.lane < this.numLanes - 1) {
      this.lane++;
      this.updateLanePosition();
    }
  }

  jump() {
    if (!this.isJumping || this.hoverActive) {
      this.isJumping = true;
      this.velocityZ = 16;
    }
  }

  update(dt) {
    this.x += (this.targetX - this.x) * 0.25;

    if (this.hoverActive) {
      this.hoverTimer -= dt;
      this.z = 70 + Math.sin(Date.now() * 0.008) * 8;
      if (this.hoverTimer <= 0) {
        this.hoverActive = false;
        this.isJumping = true;
        this.velocityZ = 0;
      }
    } else if (this.isJumping) {
      this.z += this.velocityZ;
      this.velocityZ -= this.gravity;
      if (this.z <= 0) {
        this.z = 0;
        this.velocityZ = 0;
        this.isJumping = false;
      }
    }

    if (this.magnetActive) {
      this.magnetTimer -= dt;
      if (this.magnetTimer <= 0) {
        this.magnetActive = false;
      }
    }
  }

  draw(ctx) {
    ctx.save();

    const renderY = this.y - this.z;

    // 1. Road Contact Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.height / 2 - 4, (this.width / 2 + 2) * (1 - this.z / 160), 10 * (1 - this.z / 160), 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Soft Headlight Beams (No glaring glow)
    const beamGrad = ctx.createLinearGradient(0, renderY - 30, 0, renderY - 200);
    beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(this.x - this.width/2 + 4, renderY - this.height/2);
    ctx.lineTo(this.x - this.width * 0.8, renderY - 200);
    ctx.lineTo(this.x + this.width * 0.8, renderY - 200);
    ctx.lineTo(this.x + this.width/2 - 4, renderY - this.height/2);
    ctx.closePath();
    ctx.fill();

    // 3. Shield Ring (Matte Blue)
    if (this.hasShield) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, renderY, this.width * 0.85, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. Magnet Field Ring (Matte Amber)
    if (this.magnetActive) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, renderY, this.width * 1.05, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Sports Car Body (Matte Slate & Amber accent)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(this.x - this.width/2 - 3, renderY - this.height/2 + 10, 5, 18, 2); // Tires
    ctx.roundRect(this.x + this.width/2 - 2, renderY - this.height/2 + 10, 5, 18, 2);
    ctx.roundRect(this.x - this.width/2 - 3, renderY + this.height/2 - 28, 5, 20, 2);
    ctx.roundRect(this.x + this.width/2 - 2, renderY + this.height/2 - 28, 5, 20, 2);
    ctx.fill();

    // Car Body Base
    const bodyGrad = ctx.createLinearGradient(this.x - this.width/2, renderY - this.height/2, this.x + this.width/2, renderY + this.height/2);
    bodyGrad.addColorStop(0, '#2563eb');
    bodyGrad.addColorStop(1, '#1e293b');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(this.x - this.width/2, renderY - this.height/2, this.width, this.height, 12);
    ctx.fill();

    // Tinted Windshield Glass
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(this.x - this.width/3, renderY - this.height/3, this.width * 0.66, this.height * 0.3, 6);
    ctx.fill();

    // Headlights & Tail Lights
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(this.x - this.width/2 + 4, renderY - this.height/2 + 2, 8, 4);
    ctx.fillRect(this.x + this.width/2 - 12, renderY - this.height/2 + 2, 8, 4);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x - this.width/2 + 4, renderY + this.height/2 - 4, 10, 4);
    ctx.fillRect(this.x + this.width/2 - 14, renderY + this.height/2 - 4, 10, 4);

    ctx.restore();
  }
}
