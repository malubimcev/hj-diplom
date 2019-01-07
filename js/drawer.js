'use strict';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const BRUSH_RADIUS = 4;
const MASK_DELAY = 1000;// Задержка создания и отправки маски:
// в течение этого периода пользователь может продолжить рисовать (со сбросом таймера),
// после окончания периода задержки происходит формирование и отправка маски на сервер.
let timeout;// Таймер для задержки отправки маски.
let isDrawing = false;
const colors = {
  'red': '#EA5D56',
  'yellow': '#F3D135',
  'green': '#6CBE47',
  'blue': '#53A7F5',
  'purple': '#B36ADE'
};
let color = colors['green'];

export class Drawer {

  constructor(app) {
    this.app = app;
    this.image = this.app.currentImage;

    canvas.width = this.image.offsetWidth;
    canvas.height = this.image.offsetHeight;
    this.app.setElementPositionToCenter(canvas);
    
    color = colors[this.app.currentColor];

    this.app.container.appendChild(canvas);
    this.canvas = canvas;
    
    this.registerEvents();
  }

  registerEvents() {
    canvas.addEventListener('mousedown', (event) => {
      clearTimeout(timeout);
      if (this.app.currentMode === 'draw') {
        const point = [event.offsetX, event.offsetY];
        ctx.lineWidth = BRUSH_RADIUS;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        ctx.moveTo(...point);     
        ctx.beginPath();
        isDrawing = true;
      }
    });

    canvas.addEventListener('mousemove', (event) => {
      if (this.app.currentMode === 'draw' && isDrawing) {
        const point = [event.offsetX, event.offsetY];
        draw(point);
      }
      tick();
    });

    ['mouseup', 'mouseleave'].forEach(evName => canvas.addEventListener(evName, () => isDrawing = false));
    
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this), false);
  }

  onMouseUp() {
    debounce(this.newMask.bind(this), MASK_DELAY);
  }

  newMask() {
    if (this.app.currentMode === 'draw') {
      const mask = createMask(this.image);

      mask.addEventListener('load', () => {
        canvas.toBlob(blob => {
          this.app.uploadMask(blob)
            .then(this.clear);
        });
      });
      mask.src = canvas.toDataURL();
    }
  }

  clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  setColor(colorName) {
    color = colors[colorName];
  }

}//end class

export function createMask(container) {
  const mask = container.cloneNode();
  mask.classList.add('mask');
  mask.style.left = `${canvas.style.left}px`;
  mask.style.top = `${canvas.style.top}px`;
  mask.width = canvas.width;
  mask.height = canvas.height;
  canvas.style.zIndex = mask.style.zIndex + 1;
  return mask;
};

function draw(point) {
  ctx.lineTo(...point);
  ctx.stroke();
  ctx.moveTo(...point);
}

function tick() {
  window.requestAnimationFrame(tick);
}

function debounce(callback,  delay) {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    timeout = null;
    callback();
  }, delay);
};