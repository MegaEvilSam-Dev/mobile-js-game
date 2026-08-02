export class InputHandler {
  constructor(onLeft, onRight, onAction, onPauseToggle) {
    this.onLeft = typeof onLeft === 'function' ? onLeft : () => {};
    this.onRight = typeof onRight === 'function' ? onRight : () => {};
    this.onAction = typeof onAction === 'function' ? onAction : () => {};
    this.onPauseToggle = typeof onPauseToggle === 'function' ? onPauseToggle : () => {};

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 30;

    this.keydownListener = (e) => this.handleKeyDown(e);
    this.touchStartListener = (e) => this.handleTouchStart(e);
    this.touchEndListener = (e) => this.handleTouchEnd(e);

    this.initKeyboard();
    this.initTouch();
  }

  handleKeyDown(e) {
    try {
      if (!e || typeof e.key !== 'string') return;

      const key = e.key.toLowerCase();

      if (key === 'arrowleft' || key === 'a') {
        this.onLeft();
      } else if (key === 'arrowright' || key === 'd') {
        this.onRight();
      } else if (key === ' ' || key === 'space' || key === 'arrowup' || key === 'w') {
        if (e.cancelable) e.preventDefault();
        this.onAction();
      } else if (key === 'p') {
        if (e.cancelable) e.preventDefault();
        this.onPauseToggle();
      }
    } catch (err) {
      // Safe catch to guarantee zero unmapped key crashes
    }
  }

  initKeyboard() {
    window.addEventListener('keydown', this.keydownListener);
  }

  handleTouchStart(e) {
    try {
      if (e && e.touches && e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    } catch (err) {}
  }

  handleTouchEnd(e) {
    try {
      if (e && e.changedTouches && e.changedTouches.length > 0) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;

        if (Math.abs(deltaX) > this.minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) {
            this.onLeft();
          } else {
            this.onRight();
          }
        } else {
          this.onAction();
        }
      }
    } catch (err) {}
  }

  initTouch() {
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      canvasContainer.addEventListener('touchstart', this.touchStartListener, { passive: true });
      canvasContainer.addEventListener('touchend', this.touchEndListener, { passive: true });
    }

    const btnLeft = document.getElementById('touch-left');
    const btnRight = document.getElementById('touch-right');

    if (btnLeft) {
      btnLeft.onclick = (e) => {
        try {
          if (e) e.stopPropagation();
          this.onLeft();
        } catch (err) {}
      };
    }

    if (btnRight) {
      btnRight.onclick = (e) => {
        try {
          if (e) e.stopPropagation();
          this.onRight();
        } catch (err) {}
      };
    }
  }

  destroy() {
    try {
      window.removeEventListener('keydown', this.keydownListener);

      const canvasContainer = document.getElementById('canvas-container');
      if (canvasContainer) {
        canvasContainer.removeEventListener('touchstart', this.touchStartListener);
        canvasContainer.removeEventListener('touchend', this.touchEndListener);
      }
    } catch (err) {}
  }
}
