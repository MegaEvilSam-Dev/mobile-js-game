export class GateManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.gates = [];
    this.numLanes = 2;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  reset() {
    this.gates = [];
  }

  // Spawns Gate Pairs with Math Operators (+, x, -, ÷)
  spawnSingleStaggeredGate(currentDragonCount = 2) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    const y = -80;

    const ops = ['+', 'x', '-', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let val = (op === 'x' || op === '÷') ? (Math.floor(Math.random() * 2) + 2) : (Math.floor(Math.random() * 5) + 2);
    
    // Negative initial values for - and ÷
    if (op === '-') val = -(Math.floor(Math.random() * 4) + 2);

    this.gates.push({
      lane,
      x,
      y,
      width: laneWidth - 10,
      op,
      val,
      isPositive: op === '+' || op === 'x',
      passed: false
    });
  }

  update(speed, dragonSquad, onHitGate) {
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const g = this.gates[i];
      g.y += speed;

      // Check fireball hits -> TURNS NEGATIVE GATES POSITIVE & BOOSTS VALUES!
      for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
        const fb = dragonSquad.fireballs[j];
        if (Math.abs(fb.x - g.x) < g.width / 2 && Math.abs(fb.y - g.y) < 25) {
          dragonSquad.fireballs.splice(j, 1);
          
          if (g.op === '+' || g.op === 'x') {
            g.val += 1;
          } else if (g.op === '-') {
            g.val += 1;
            if (g.val >= 0) {
              g.op = '+';
              g.isPositive = true;
            }
          } else if (g.op === '÷') {
            g.val -= 1;
            if (g.val <= 1) {
              g.op = 'x';
              g.val = 2;
              g.isPositive = true;
            }
          }
        }
      }

      // Check Dragon direct collision with gate
      if (!g.passed && Math.abs(g.y - dragonSquad.y) < 30 && g.lane === dragonSquad.lane) {
        g.passed = true;
        onHitGate(g);
        this.gates.splice(i, 1);
        continue;
      }

      if (g.y > this.canvasHeight + 80) {
        this.gates.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const g of this.gates) {
      if (g.passed) continue;

      ctx.save();
      ctx.translate(g.x, g.y);

      const color = g.isPositive ? '#10b981' : '#ef4444';
      const label = `${g.op}${g.val}`;

      // Archway Box
      ctx.fillStyle = g.isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.45)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;

      ctx.beginPath();
      ctx.roundRect(-g.width / 2, -26, g.width, 52, 10);
      ctx.fill();
      ctx.stroke();

      // Posts
      ctx.fillStyle = color;
      ctx.fillRect(-g.width / 2, -26, 6, 52);
      ctx.fillRect(g.width / 2 - 6, -26, 6, 52);

      // Gate Value Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 20px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, -3);

      // Gate Action Hint
      ctx.fillStyle = g.isPositive ? 'rgba(255, 255, 255, 0.9)' : '#fef08a';
      ctx.font = '700 9.5px Outfit';
      ctx.fillText(g.isPositive ? 'BOOST READY! 🌟' : 'SHOOT TO CONVERT! 💥', 0, 15);

      ctx.restore();
    }
    ctx.restore();
  }
}
