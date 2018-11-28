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
  constructor(container, app) {
    this.container = container;
    this.app = app;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
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
    const onStopDrawing = debounce(() => {
      this.newMask();
    }, 500);

    canvas.addEventListener('mousedown', (evt) => {
      this.drawing = true;
      const line = [];
      line.push([evt.offsetX, evt.offsetY]);
      lines.push(line);
      needsRepaint = true;
    });

    canvas.addEventListener('mousemove', (evt) => {
      if (this.drawing) {
        const point = [evt.offsetX, evt.offsetY];
        lines[lines.length - 1].push(point);
        needsRepaint = true;
      }
      tick();
    });

    ['mouseup', 'mouseleave'].forEach(evName => canvas.addEventListener(evName, () => this.drawing = false));
    
    canvas.addEventListener('mouseup', this.newMask.bind(this), false);
    canvas.addEventListener('click', this.app.addCommentBoard, false);
  }

  newMask() {
    const mask = document.createElement('img');
    mask.src = canvas.toDataURL();
    this.container.appendChild(mask);
    setTimeout(this.app.uploadMask(mask), 1000);
    this.clear();
  }

  removeCanvas() {
    document.querySelector('.app').removeChild(canvas);
  }

  clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  setColor(colorName) {
    color = colors[colorName];
  }

}

function debounce(callback,  delay) {
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      timeout = null;
      callback();
    }, delay);
  };
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

// tick();