export class RoadRenderer {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.scrollOffsetY = 0;
    this.numLanes = 3;

    // Generate asphalt texture noise pattern
    this.noiseCanvas = document.createElement('canvas');
    this.noiseCanvas.width = 128;
    this.noiseCanvas.height = 128;
    const nCtx = this.noiseCanvas.getContext('2d');
    const imgData = nCtx.createImageData(128, 128);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const val = 32 + Math.floor(Math.random() * 20);
      imgData.data[i] = val;
      imgData.data[i+1] = val + 2;
      imgData.data[i+2] = val + 4;
      imgData.data[i+3] = 255;
    }
    nCtx.putImageData(imgData, 0, 0);
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  update(speed) {
    this.scrollOffsetY = (this.scrollOffsetY + speed) % 90;
  }

  draw(ctx) {
    ctx.save();

    // 1. Mobile Bay Soft Twilight Sky & Horizon (Matte Navy)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.5, '#1e293b');
    skyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 2. Mobile Bay Water Margins
    ctx.fillStyle = '#0f2942';
    ctx.fillRect(0, 0, 24, this.canvasHeight);
    ctx.fillRect(this.canvasWidth - 24, 0, 24, this.canvasHeight);

    // Guardrail Metal Ribbons
    ctx.fillStyle = '#475569';
    ctx.fillRect(20, 0, 4, this.canvasHeight);
    ctx.fillRect(this.canvasWidth - 24, 0, 4, this.canvasHeight);

    // 3. Mardi Gras Beads (Subtle, Muted Colors - No Glow)
    const beads = ['#7c3aed', '#d97706', '#059669'];
    for (let y = -90 + this.scrollOffsetY; y < this.canvasHeight + 90; y += 45) {
      const color = beads[Math.abs(Math.floor(y / 45)) % 3];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(18, y, 3, 0, Math.PI * 2);
      ctx.arc(this.canvasWidth - 18, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Textured Asphalt Road Surface
    const roadX = 24;
    const roadWidth = this.canvasWidth - 48;

    const pattern = ctx.createPattern(this.noiseCanvas, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(roadX, 0, roadWidth, this.canvasHeight);

    // Muted Shading
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(roadX, 0, roadWidth, this.canvasHeight);

    // 5. Solid White Outer Road Lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(roadX + 4, 0);
    ctx.lineTo(roadX + 4, this.canvasHeight);
    ctx.moveTo(this.canvasWidth - roadX - 4, 0);
    ctx.lineTo(this.canvasWidth - roadX - 4, this.canvasHeight);
    ctx.stroke();

    // 6. Yellow Highway Lane Lines (Dashed Motion Lines)
    const laneWidth = roadWidth / this.numLanes;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([40, 40]);
    ctx.lineDashOffset = -this.scrollOffsetY;

    ctx.beginPath();
    ctx.moveTo(roadX + laneWidth, 0);
    ctx.lineTo(roadX + laneWidth, this.canvasHeight);
    ctx.moveTo(roadX + laneWidth * 2, 0);
    ctx.lineTo(roadX + laneWidth * 2, this.canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}
