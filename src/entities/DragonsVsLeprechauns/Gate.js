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

  // Spawns Multiplier Gate Pairs with guaranteed positive start gate
  spawnGatePair(currentDragonCount = 10, isFirstGate = false) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const halfWidth = roadWidth / 2;

    let op1 = '+';
    let val1 = 15;
    let op2 = 'x';
    let val2 = 2;

    if (!isFirstGate) {
      const ops = ['+', 'x', '+', 'x'];
      op1 = ops[Math.floor(Math.random() * ops.length)];
      val1 = (op1 === 'x') ? 2 : (Math.floor(Math.random() * 10) + 5);

      op2 = ops[Math.floor(Math.random() * ops.length)];
      val2 = (op2 === 'x') ? 3 : (Math.floor(Math.random() * 15) + 10);
    } else {
      // First Gate is GUARANTEED MASSIVE POSITIVE BOOST (+20 or x3)
      op1 = '+';
      val1 = 20;
      op2 = 'x';
      val2 = 3;
    }

    const y = -90;

    this.gatePairs.push({
      y,
      gates: [
        { lane: 0, x: roadX + halfWidth / 2, width: halfWidth - 8, op: op1, val: val1, isPositive: true, passed: false },
        { lane: 1, x: roadX + halfWidth + halfWidth / 2, width: halfWidth - 8, op: op2, val: val2, isPositive: true, passed: false }
      ]
    });
  }

  update(speed, dragonSquad, particlePool, onHitGate) {
    for (let i = this.gatePairs.length - 1; i >= 0; i--) {
      const pair = this.gatePairs[i];
      pair.y += speed;

      for (const g of pair.gates) {
        // Fireball hits dynamically boost gate value!
        for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
          const fb = dragonSquad.fireballs[j];
          if (Math.abs(fb.x - g.x) < g.width / 2 && Math.abs(fb.y - pair.y) < 25) {
            dragonSquad.fireballs.splice(j, 1);
            g.val += 1;

            particlePool.spawnExplosion(fb.x, fb.y, '#10b981', 3);
            particlePool.spawnDamagePopup(fb.x, fb.y - 10, '+1', '#60a5fa');
          }
        }

        // Dragon Mob Collision with Gate
        if (!g.passed && Math.abs(pair.y - dragonSquad.y) < 30 && g.lane === dragonSquad.lane) {
          g.passed = true;
          pair.gates.forEach(gate => gate.passed = true);
          particlePool.spawnExplosion(g.x, pair.y, '#10b981', 15);
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

        const color = '#10b981';
        const label = `${g.op}${g.val}`;

        ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.roundRect(-g.width / 2, -28, g.width, 56, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, -3);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '800 9px Outfit';
        ctx.fillText('DYNAMIC MULTIPLIER 🚀', 0, 16);

        ctx.restore();
      }
    }
    ctx.restore();
  }
}
