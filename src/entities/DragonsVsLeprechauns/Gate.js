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

  spawnGatePair() {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    // Generate random values for Left & Right lane gates
    const val1 = Math.floor(Math.random() * 8) - 3; // -3 to +5
    let val2 = Math.floor(Math.random() * 8) - 3;
    if (val1 < 0 && val2 < 0) val2 = Math.abs(val2) + 2; // Guarantee at least 1 positive option

    const y = -80;

    this.gatePairs.push({
      y,
      gates: [
        { lane: 0, x: roadX + laneWidth / 2, width: laneWidth - 8, value: val1, passed: false },
        { lane: 1, x: roadX + laneWidth + laneWidth / 2, width: laneWidth - 8, value: val2, passed: false }
      ]
    });
  }

  update(speed, dragonSquad, onHitGate) {
    for (let i = this.gatePairs.length - 1; i >= 0; i--) {
      const pair = this.gatePairs[i];
      pair.y += speed;

      for (const gate of pair.gates) {
        // Check fireball hits on gates -> INCREASES THE GATE VALUE!
        for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
          const fb = dragonSquad.fireballs[j];
          if (Math.abs(fb.x - gate.x) < gate.width / 2 && Math.abs(fb.y - pair.y) < 25) {
            dragonSquad.fireballs.splice(j, 1);
            gate.value += 1; // Shooting gates increases value!
          }
        }

        // Check Dragon collision with gate
        if (!gate.passed && Math.abs(pair.y - dragonSquad.y) < 30 && gate.lane === dragonSquad.lane) {
          gate.passed = true;
          onHitGate(gate.value);
          pair.gates.forEach(g => g.passed = true); // Mark both passed
        }
      }

      if (pair.y > this.canvasHeight + 80) {
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

        const isPositive = g.value >= 0;
        const color = isPositive ? '#10b981' : '#ef4444'; // Green for positive, Red for negative
        const label = isPositive ? `+${g.value}` : `${g.value}`;

        // Gate Archway
        ctx.fillStyle = isPositive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.roundRect(-g.width / 2, -25, g.width, 50, 10);
        ctx.fill();
        ctx.stroke();

        // Gate Pillar Posts
        ctx.fillStyle = color;
        ctx.fillRect(-g.width / 2, -25, 6, 50);
        ctx.fillRect(g.width / 2 - 6, -25, 6, 50);

        // Gate Value Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 18px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);

        // Gate Action Hint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '600 10px Outfit';
        ctx.fillText('SHOOT TO INCREASE 🎯', 0, 16);

        ctx.restore();
      }
    }
    ctx.restore();
  }
}
