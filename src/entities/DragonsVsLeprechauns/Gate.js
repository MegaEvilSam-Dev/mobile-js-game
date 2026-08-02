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

  // Spawns Multiplier Gates: Single Lane Gates & Gate Pairs with 85%+ Negative Gate frequency!
  spawnGatePair(currentDragonCount = 5, isFirstGate = false) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const halfWidth = roadWidth / 2;

    const isSingleGate = !isFirstGate && (Math.random() < 0.55); // 55% chance for a Single Lane Gate!
    const activeGates = [];

    if (!isFirstGate) {
      if (isSingleGate) {
        const lane = Math.floor(Math.random() * 2);
        const x = roadX + (lane * halfWidth) + (halfWidth / 2);
        const isNeg = Math.random() < 0.85; // 85% chance for Negative Gate!
        
        const op = isNeg ? (Math.random() < 0.25 ? '÷' : '-') : '+';
        const val = isNeg ? (op === '÷' ? 2 : Math.floor(Math.random() * 10) + 5) : (Math.floor(Math.random() * 5) + 3);

        activeGates.push({
          lane,
          x,
          width: halfWidth - 8,
          op,
          val,
          isPositive: !isNeg,
          passed: false
        });
      } else {
        const posLane = Math.floor(Math.random() * 2);
        for (let l = 0; l < 2; l++) {
          const x = roadX + (l * halfWidth) + (halfWidth / 2);
          const isPos = (l === posLane) && (Math.random() < 0.35);
          
          const op = isPos ? '+' : (Math.random() < 0.2 ? '÷' : '-');
          const val = isPos ? (Math.floor(Math.random() * 5) + 3) : (op === '÷' ? 2 : Math.floor(Math.random() * 10) + 5);

          activeGates.push({
            lane: l,
            x,
            width: halfWidth - 8,
            op,
            val,
            isPositive: isPos,
            passed: false
          });
        }
      }
    } else {
      const x = roadX + (halfWidth / 2);
      activeGates.push({
        lane: 0,
        x,
        width: halfWidth - 8,
        op: '+',
        val: 4,
        isPositive: true,
        passed: false
      });
    }

    const y = -90;
    this.gatePairs.push({ y, gates: activeGates });
  }

  update(speed, dragonSquad, particlePool, onHitGate) {
    for (let i = this.gatePairs.length - 1; i >= 0; i--) {
      const pair = this.gatePairs[i];
      pair.y += speed;

      for (const g of pair.gates) {
        // Fireballs continue past gates! Piercing shot collision logic:
        for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
          const fb = dragonSquad.fireballs[j];
          if (!fb.hitGates) fb.hitGates = new Set();

          if (!fb.hitGates.has(g) && Math.abs(fb.x - g.x) < g.width / 2 && Math.abs(fb.y - pair.y) < 28) {
            fb.hitGates.add(g); // Record hit so fireball continues traveling past gate!

            if (g.op === '+' || g.op === 'x') {
              g.val += 1;
            } else if (g.op === '-') {
              g.val -= 1;
              if (g.val <= 0) {
                g.op = '+';
                g.val = Math.abs(g.val) + 1;
                g.isPositive = true;
              }
            } else if (g.op === '÷') {
              g.op = '-';
              g.val = 3;
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
        ctx.fillText(g.isPositive ? 'MULTIPLIER 🚀' : 'SHOOT TO REDUCE! 💥', 0, 16);

        ctx.restore();
      }
    }
    ctx.restore();
  }
}
