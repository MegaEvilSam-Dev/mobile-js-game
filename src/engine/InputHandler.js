export class InputHandler {
  constructor(onLeft, onRight, onAction, onPauseToggle) {
    this.onLeft = onLeft;
    this.onRight = onRight;
    this.onAction = onAction;
    this.onPauseToggle = onPauseToggle;

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 30;

    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      try {
        if (!e || !e.key) return;

        const key = e.key.toLowerCase();

        if (key === 'arrowleft' || key === 'a') {
          this.onLeft();
        } else if (key === 'arrowright' || key === 'd') {
          this.onRight();
        } else if (key === ' ' || key === 'space' || key === 'arrowup' || key === 'w') {
          e.preventDefault();
          this.onAction();
        } else if (key === 'p') {
          e.preventDefault();
          this.onPauseToggle();
        }
      } catch (err) {
        // Prevent crashes on any unmapped key/button press
        console.warn('Unhandled key press:', err);
      }
    });
  }

  initTouch() {
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) return;

    canvasContainer.addEventListener('touchstart', (e) => {
      try {
        if (e.touches && e.touches.length > 0) {
          this.touchStartX = e.touches[0].clientX;
          this.touchStartY = e.touches[0].clientY;
        }
      } catch (err) {
        console.warn('Touchstart error:', err);
      }
    }, { passive: true });

    canvasContainer.addEventListener('touchend', (e) => {
      try {
        if (e.changedTouches && e.changedTouches.length > 0) {
          const touchEndX = e.changedTouches[0].clientX;
          const touchEndY = e.changedTouches[0].clientY;

          const deltaX = touchEndX - this.touchStartX;
          const deltaY = touchEndY - this.touchStartY;

          // Check if swipe left/right
          if (Math.abs(deltaX) > this.minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
              this.onLeft();
            } else {
              this.onRight();
            }
          } else {
            // Tap anywhere on screen -> trigger action (firing at dragon during boss fight!)
            this.onAction();
          }
        }
      } catch (err) {
        console.warn('Touchend error:', err);
      }
    }, { passive: true });

    // Touch Buttons (Left & Right Only)
    const btnLeft = document.getElementById('touch-left');
    const btnRight = document.getElementById('touch-right');

    if (btnLeft) {
      btnLeft.addEventListener('click', (e) => {
        try {
          e.stopPropagation();
          this.onLeft();
        } catch (err) {}
      });
    }

    if (btnRight) {
      btnRight.addEventListener('click', (e) => {
        try {
          e.stopPropagation();
          this.onRight();
        } catch (err) {}
      });
    }
  }
}
