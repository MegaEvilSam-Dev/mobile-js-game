export class InputHandler {
  constructor(onLeft, onRight, onJump) {
    this.onLeft = onLeft;
    this.onRight = onRight;
    this.onJump = onJump;

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 30; // Min px for swipe detection

    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.onLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.onRight();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        this.onJump();
      }
    });
  }

  initTouch() {
    const canvasContainer = document.getElementById('canvas-container');

    canvasContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvasContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;

        // Check if gesture is horizontal swipe vs vertical jump vs tap
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (Math.abs(deltaX) > this.minSwipeDistance) {
            if (deltaX < 0) {
              this.onLeft();
            } else {
              this.onRight();
            }
          }
        } else {
          if (deltaY < -this.minSwipeDistance) {
            this.onJump();
          }
        }
      }
    }, { passive: true });

    // Touch Buttons
    const btnLeft = document.getElementById('touch-left');
    const btnRight = document.getElementById('touch-right');
    const btnJump = document.getElementById('touch-jump');

    if (btnLeft) btnLeft.addEventListener('click', (e) => { e.stopPropagation(); this.onLeft(); });
    if (btnRight) btnRight.addEventListener('click', (e) => { e.stopPropagation(); this.onRight(); });
    if (btnJump) btnJump.addEventListener('click', (e) => { e.stopPropagation(); this.onJump(); });
  }
}
