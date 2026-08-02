export class GateManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.gatePairs = [];
    this.numLanes = 2;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  reset() {
    this.gatePairs = [];
  }

  // Spawns Total War Style 2-Lane Multiplier Gate Pairs (+30, x3, x5, -15)
  spawnGatePair(currentDragonCount = 5) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const halfWidth = roadWidth / 2;

    const ops = ['+', 'x', '+', 'x'];
    const op1 = ops[Math.floor(Math.random() * ops.length)];
    const val1 = (op1 === 'x') ? 2 : (Math.floor(Math.random() * 10) + 5);

    const op2 = ops[Math.floor(Math.random() * ops.length)];
    const val2 = (op2 === 'x') ? 3 : (Math.floor(Math.random() * 15) + 10);

    const y = -90;

    this.gatePairs.push({
      y,
      gates: [
        { lane: 0, x: roadX + halfWidth / 2, width: halfWidth - 8, op: op1, val: val1, isPositive: op1 === '+' || op1 === 'x', passed: false },
        { lane: 1, x: roadX + halfWidth + halfWidth / 2, width: halfWidth - 8, op: op2, val: val2, isPositive: op2 === '+' || op2 === 'x', passed: false }
      ]
    });
  }

  update(speed, dragonSquad, onHitGate) {
    for (let i = this.gatePairs.length - 1; i >= 0; i--) {
      const pair = this.gatePairs[i];
      pair.y += speed;

      for (const g of pair.gates) {
        // Fireball hits dynamically boost gate value!
        for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
          const fb = dragonSquad.fireballs[j];
          if (Math.abs(fb.x - g.x) < g.width / 2 && Math.abs(fb.y - pair.y) < 25) {
            dragonSquad.fireballs.splice(j, 1);
            if (g.op === '+' || g.op === 'x') {
              g.val += 1;
            } else if (g.op === '-') {
              g.val -= 1;
              if (g.val <= 0) {
                g.op = '+';
                g.val = Math.abs(g.val) + 1;
                g.isPositive = true;
              }
            }
          }
        }

        // Dragon Mob Collision with Gate
        if (!g.passed && Math.abs(pair.y - dragonSquad.y) < 30 && g.lane === dragonSquad.lane) {
          g.passed = true;
          pair.gates.forEach(gate => gate.passed = true);
          onHitGate(g);
          this.gatePairs.splice(i, 1);
          break;
        }
      }

      if (pair.y > this.canvasHeight + 90) {
        this.gatePairs.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const pair of this.gatePairs) {
      for (const g of pair.gates) {
        if (g.passed) continue;

        ctx.save();
        ctx.translate(g.x, pair.y);

        const color = g.isPositive ? '#10b981' : '#ef4444';
        const label = `${g.op}${g.val}`;

        // Total War Glass Multiplier Gate
        ctx.fillStyle = g.isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.45)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.roundRect(-g.width / 2, -28, g.width, 56, 12);
        ctx.fill();
        ctx.stroke();

        // Multiplier Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, -3);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '800 9px Outfit';
        ctx.fillText(g.isPositive ? 'TOTAL WAR MULTIPLIER 🚀' : 'SHOOT TO REDUCE! 💥', 0, 16);

        ctx.restore();
      }
    }
    ctx.restore();
  }
}
