'use strict';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const BRUSH_RADIUS = 4;
let needsRepaint = true;
let lines = [];
const colors = {
  'red': '#EA5D56',
  'yellow': '#F3D135',
  'green': '#6CBE47',
  'blue': '#53A7F5',
  'purple': '#B36ADE'
};
let color = colors['green'];

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
    
    this.drawing = false;

    this.registerEvents();
  }

  registerEvents() {
    canvas.addEventListener('mousedown', (event) => {
      if (this.app.currentMode === 'draw') {
        this.drawing = true;
        const line = [];
        line.push([event.offsetX, event.offsetY]);
        lines.push(line);
        needsRepaint = true;
      }
    });

    canvas.addEventListener('mousemove', (event) => {
      if (this.app.currentMode === 'draw' && this.drawing) {
        const point = [event.offsetX, event.offsetY];
        lines[lines.length - 1].push(point);
        needsRepaint = true;
      }
      tick();
    });

    ['mouseup', 'mouseleave'].forEach(evName => canvas.addEventListener(evName, () => this.drawing = false));
    
    canvas.addEventListener('mouseup', this.newMask.bind(this), false);
    canvas.addEventListener('click', this.app.onClick.bind(this.app), false);
  }

  newMask() {
    if (this.app.currentMode === 'draw') {
      const mask = createMask(this.image);
      const node = this.app.container.querySelector('.error');

      mask.addEventListener('load', () => {
        this.app.container.insertBefore(mask, node);
        canvas.toBlob(blob => this.app.uploadMask(blob));
        this.clear();
      });
      mask.src = canvas.toDataURL();
    }
  }

  removeCanvas() {
    document.querySelector('.app').removeChild(canvas);
  }

  clear() {
    lines = [];
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

function circle(point) {
  ctx.beginPath();
  ctx.arc(...point, BRUSH_RADIUS / 2, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function lineBetween (p1, p2) {
  ctx.moveTo(...p1);
  ctx.lineTo(...p2);
}

function drawLine(points) {
  ctx.beginPath();
  ctx.lineWidth = BRUSH_RADIUS;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;

  ctx.moveTo(...points[0]);
  for(let i = 1; i < points.length - 1; i++) {
    lineBetween(points[i], points[i + 1]);
  }
  ctx.stroke();
}

function repaint () {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines
    .forEach((line) => {
      circle(line[0]);
      drawLine(line);
    });
}

function tick () {
  if(needsRepaint) {
    repaint();
    needsRepaint = false;
  }
  window.requestAnimationFrame(tick);
}