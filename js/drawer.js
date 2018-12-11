'use strict';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const BRUSH_RADIUS = 4;
let isDrawing = false;
const colors = {
  'red': '#EA5D56',
  'yellow': '#F3D135',
  'green': '#6CBE47',
  'blue': '#53A7F5',
  'purple': '#B36ADE'
};
let color = colors['green'];
let prevPoint = [];

export default class Drawer {

  constructor(image, app) {
    this.image = image;
    this.app = app;

    canvas.width = this.image.offsetWidth;
    canvas.height = this.image.offsetHeight;
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.position = 'absolute';
    canvas.style.transform = 'translate(-50%, -50%)';
    color = colors[this.app.currentColor];

    document.querySelector('.app').appendChild(canvas);
    
    this.registerEvents();
  }

  registerEvents() {
    canvas.addEventListener('mousedown', (event) => {
      if (this.app.currentMode === 'draw') {
        const point = [event.offsetX, event.offsetY];
        ctx.moveTo(...point);
        ctx.beginPath();
        prevPoint = point;
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
    
    canvas.addEventListener('mouseup', this.newMask.bind(this), false);
    canvas.addEventListener('click', this.app.onClick.bind(this.app), false);
  }

  newMask() {
    if (this.app.currentMode === 'draw') {
      const mask = createMask(this.image);
      const node = this.app.container.querySelector('.error');

      mask.addEventListener('load', () => {
        this.app.container.insertBefore(mask, node);
        // canvas.toBlob(blob => this.app.uploadMask(blob));
        this.app.uploadMask(mask);
        this.clear();
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

function createMask(container) {
  const mask = container.cloneNode();
  mask.style.left = canvas.style.left;
  mask.style.top = canvas.style.top;
  mask.width = canvas.width;
  mask.height = canvas.height;
  mask.style.zIndex = container.style.zIndex + 1;
  canvas.style.zIndex = mask.style.zIndex + 1;
  return mask;
};

function draw(point) {
  const cp = point.map((p, i) => p + (p - prevPoint[i]) / 2);
  
  ctx.lineWidth = BRUSH_RADIUS;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.quadraticCurveTo(...point, ...cp);
  // ctx.lineTo(...point);
  prevPoint = point;
  ctx.stroke();
  ctx.moveTo(...cp);
}

function tick() {
  window.requestAnimationFrame(tick);
}

// tick();