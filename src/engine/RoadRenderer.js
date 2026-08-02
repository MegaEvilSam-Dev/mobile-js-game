export class RoadRenderer {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.scrollOffsetY = 0;
    this.numLanes = 3;

    // Generate asphalt pavement noise texture
    this.noiseCanvas = document.createElement('canvas');
    this.noiseCanvas.width = 128;
    this.noiseCanvas.height = 128;
    const nCtx = this.noiseCanvas.getContext('2d');
    const imgData = nCtx.createImageData(128, 128);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const val = 34 + Math.floor(Math.random() * 20);
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

    // 1. Mobile Bay Coast Sky & Horizon Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    skyGrad.addColorStop(0, '#0a1120');
    skyGrad.addColorStop(0.4, '#172554');
    skyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 2. Mobile Bay Water Margins
    ctx.fillStyle = '#0b2545';
    ctx.fillRect(0, 0, 24, this.canvasHeight);
    ctx.fillRect(this.canvasWidth - 24, 0, 24, this.canvasHeight);

    // Concrete Highway Barriers & Shoulders
    ctx.fillStyle = '#334155';
    ctx.fillRect(20, 0, 4, this.canvasHeight);
    ctx.fillRect(this.canvasWidth - 24, 0, 4, this.canvasHeight);

    // 3. Realistic Asphalt Pavement Texture
    const roadX = 24;
    const roadWidth = this.canvasWidth - 48;

    const pattern = ctx.createPattern(this.noiseCanvas, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(roadX, 0, roadWidth, this.canvasHeight);

    // Asphalt Shading Gradient
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(roadX, 0, roadWidth, this.canvasHeight);

    // 4. Solid White Outer Highway Lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(roadX + 4, 0);
    ctx.lineTo(roadX + 4, this.canvasHeight);
    ctx.moveTo(this.canvasWidth - roadX - 4, 0);
    ctx.lineTo(this.canvasWidth - roadX - 4, this.canvasHeight);
    ctx.stroke();

    // 5. High-Visibility Yellow Highway Lane Dividers
    const laneWidth = roadWidth / this.numLanes;
    ctx.strokeStyle = '#eab308';
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

    // 6. Roadside Reflective Markers
    for (let y = -90 + this.scrollOffsetY; y < this.canvasHeight + 90; y += 120) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(16, y, 6, 14);
      ctx.fillRect(this.canvasWidth - 22, y, 6, 14);
    }

    ctx.restore();
  }
}
