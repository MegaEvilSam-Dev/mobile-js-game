export class InputHandler {
  constructor(onLeft, onRight, onAction, onPauseToggle, onMoveX) {
    this.onLeft = typeof onLeft === 'function' ? onLeft : () => {};
    this.onRight = typeof onRight === 'function' ? onRight : () => {};
    this.onAction = typeof onAction === 'function' ? onAction : () => {};
    this.onPauseToggle = typeof onPauseToggle === 'function' ? onPauseToggle : () => {};
    this.onMoveX = typeof onMoveX === 'function' ? onMoveX : null;

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 20;

    this.keydownListener = (e) => this.handleKeyDown(e);
    this.mousemoveListener = (e) => this.handleMouseMove(e);
    this.touchStartListener = (e) => this.handleTouchStart(e);
    this.touchMoveListener = (e) => this.handleTouchMove(e);
    this.touchEndListener = (e) => this.handleTouchEnd(e);

    this.initKeyboard();
    this.initPointerControls();
  }

  handleKeyDown(e) {
    try {
      if (!e || typeof e.key !== 'string') return;
      const key = e.key.toLowerCase();

      if (key === 'arrowleft' || key === 'a') {
        this.onLeft();
      } else if (key === 'arrowright' || key === 'd') {
        this.onRight();
      } else if (key === ' ' || key === 'space' || key === 'arrowup' || key === 'w' || key === 'enter') {
        if (e.cancelable) e.preventDefault();
        this.onAction();
      } else if (key === 'p' || key === 'escape') {
        if (e.cancelable) e.preventDefault();
        this.onPauseToggle();
      }
    } catch (err) {}
  }

  initKeyboard() {
    try {
      window.addEventListener('keydown', this.keydownListener);
    } catch (err) {}
  }

  handleMouseMove(e) {
    try {
      if (this.onMoveX && e) {
        const container = document.getElementById('canvas-container') || document.body;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        this.onMoveX(mouseX);
      }
    } catch (err) {}
  }

  handleTouchStart(e) {
    try {
      if (e && e.touches && e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.handleTouchMove(e);
      }
    } catch (err) {}
  }

  handleTouchMove(e) {
    try {
      if (this.onMoveX && e && e.touches && e.touches.length > 0) {
        const container = document.getElementById('canvas-container') || document.body;
        const rect = container.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        this.onMoveX(touchX);
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

  initPointerControls() {
    try {
      const canvasContainer = document.getElementById('canvas-container') || window;
      canvasContainer.addEventListener('mousemove', this.mousemoveListener);
      canvasContainer.addEventListener('touchstart', this.touchStartListener, { passive: true });
      canvasContainer.addEventListener('touchmove', this.touchMoveListener, { passive: true });
      canvasContainer.addEventListener('touchend', this.touchEndListener, { passive: true });

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
    } catch (err) {}
  }

  destroy() {
    try {
      window.removeEventListener('keydown', this.keydownListener);
      const canvasContainer = document.getElementById('canvas-container') || window;
      canvasContainer.removeEventListener('mousemove', this.mousemoveListener);
      canvasContainer.removeEventListener('touchstart', this.touchStartListener);
      canvasContainer.removeEventListener('touchmove', this.touchMoveListener);
      canvasContainer.removeEventListener('touchend', this.touchEndListener);
    } catch (err) {}
  }
}
