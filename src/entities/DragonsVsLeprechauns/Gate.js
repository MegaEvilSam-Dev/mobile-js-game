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

  // All bonus gates start negative and must be shot to become positive!
  // Dodged gates that pass by without collision do NOT negate dragons!
  spawnSingleStaggeredGate(currentDragonCount = 2) {
    const roadX = 40;
    const roadWidth = this.canvasWidth - 80;
    const laneWidth = roadWidth / this.numLanes;

    const lane = Math.floor(Math.random() * this.numLanes);
    const x = roadX + (lane * laneWidth) + (laneWidth / 2);
    
    // Scale initial negative value (-2 to -6)
    const maxNeg = Math.min(6, Math.max(2, Math.floor(currentDragonCount * 0.75)));
    const initialValue = -(Math.floor(Math.random() * maxNeg) + 2); // Starts negative!
    const y = -80;

    this.gates.push({
      lane,
      x,
      y,
      width: laneWidth - 10,
      value: initialValue,
      passed: false
    });
  }

  update(speed, dragonSquad, onHitGate) {
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const g = this.gates[i];
      g.y += speed;

      // Check fireball hits -> TURNS NEGATIVE BONUS GATES POSITIVE!
      for (let j = dragonSquad.fireballs.length - 1; j >= 0; j--) {
        const fb = dragonSquad.fireballs[j];
        if (Math.abs(fb.x - g.x) < g.width / 2 && Math.abs(fb.y - g.y) < 25) {
          dragonSquad.fireballs.splice(j, 1);
          g.value += 1; // Shooting increments gate value!
        }
      }

      // Check Dragon direct collision with gate
      // ONLY NEGATES DRAGONS IF DRAGON DIRECTLY COLLIDES/HITS THE GATE!
      if (!g.passed && Math.abs(g.y - dragonSquad.y) < 30 && g.lane === dragonSquad.lane) {
        g.passed = true;
        onHitGate(g.value); // Trigger hit effect (gain bonus dragons if positive, lose dragons if negative)
        this.gates.splice(i, 1);
        continue;
      }

      // Gate passes by without being hit -> NO PENALTY! Cleanly removed!
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

      const isPositive = g.value >= 0;
      const color = isPositive ? '#10b981' : '#ef4444';
      const label = isPositive ? `+${g.value}` : `${g.value}`;

      // Archway Box
      ctx.fillStyle = isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.45)';
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
      ctx.fillStyle = isPositive ? 'rgba(255, 255, 255, 0.9)' : '#fef08a';
      ctx.font = '700 9.5px Outfit';
      ctx.fillText(isPositive ? 'BONUS READY! 🌟' : 'SHOOT TO CONVERT OR DODGE! 💥', 0, 15);

      ctx.restore();
    }
    ctx.restore();
  }
}
