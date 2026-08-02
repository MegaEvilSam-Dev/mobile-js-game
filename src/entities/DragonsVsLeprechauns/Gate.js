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

  // Spawns Balanced Arcade Multiplier Gate Pairs
  spawnGatePair(currentDragonCount = 5, isFirstGate = false) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const halfWidth = roadWidth / 2;

    let op1 = '+';
    let val1 = 5;
    let op2 = 'x';
    let val2 = 2;
    let isPos1 = true;
    let isPos2 = true;

    if (!isFirstGate) {
      const posLane = Math.floor(Math.random() * 2);

      // Balanced Positive Gate (+3 to +8, or x2)
      const isMult = Math.random() < 0.35 && currentDragonCount < 40;
      const pOp = isMult ? 'x' : '+';
      const pVal = isMult ? 2 : (Math.floor(Math.random() * 6) + 3);

      // Balanced Negative Gate (-4 to -8)
      const nOp = '-';
      const nVal = Math.floor(Math.random() * 5) + 4;

      if (posLane === 0) {
        op1 = pOp; val1 = pVal; isPos1 = true;
        op2 = nOp; val2 = nVal; isPos2 = false;
      } else {
        op1 = nOp; val1 = nVal; isPos1 = false;
        op2 = pOp; val2 = pVal; isPos2 = true;
      }
    } else {
      // First Gate is a Balanced Warm-Up Boost (+5 or x2)
      op1 = '+'; val1 = 5; isPos1 = true;
      op2 = 'x'; val2 = 2; isPos2 = true;
    }

    const y = -90;

    this.gatePairs.push({
      y,
      gates: [
        { lane: 0, x: roadX + halfWidth / 2, width: halfWidth - 8, op: op1, val: val1, isPositive: isPos1, passed: false },
        { lane: 1, x: roadX + halfWidth + halfWidth / 2, width: halfWidth - 8, op: op2, val: val2, isPositive: isPos2, passed: false }
      ]
    });
  }

  update(speed, dragonSquad, particlePool, onHitGate) {
    for (let i = this.gatePairs.length - 1; i >= 0; i--) {
      const pair = this.gatePairs[i];
      pair.y += speed;

      for (const g of pair.gates) {
        // Fireball hits dynamically upgrade gate value!
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

            particlePool.spawnExplosion(fb.x, fb.y, g.isPositive ? '#10b981' : '#ef4444', 4);
            particlePool.spawnDamagePopup(fb.x, fb.y - 10, '+1', g.isPositive ? '#60a5fa' : '#f87171');
          }
        }

        // Dragon Mob Collision with Gate
        if (!g.passed && Math.abs(pair.y - dragonSquad.y) < 30 && g.lane === dragonSquad.lane) {
          g.passed = true;
          pair.gates.forEach(gate => gate.passed = true);
          particlePool.spawnExplosion(g.x, pair.y, g.isPositive ? '#10b981' : '#ef4444', 15);
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

        ctx.fillStyle = g.isPositive ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.5)';
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
        ctx.fillText(g.isPositive ? 'DYNAMIC MULTIPLIER 🚀' : 'SHOOT TO REDUCE! 💥', 0, 16);

        ctx.restore();
      }
    }
    ctx.restore();
  }
}
