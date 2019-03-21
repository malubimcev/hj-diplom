/*
  Модуль drawer.js.
  Экспортирует класс Drawer и функцию createMask.
  Обеспечивает функционал рисования поверх изображения.
*/
'use strict';

const
  canvas = document.createElement('canvas'),
  ctx = canvas.getContext('2d'),
  colors = {// Палитра цветов для рисования линий.
    'red': '#EA5D56',
    'yellow': '#F3D135',
    'green': '#6CBE47',
    'blue': '#53A7F5',
    'purple': '#B36ADE'
  },
  BRUSH_RADIUS = 4, // Толщина линии рисования.
  MASK_DELAY = 1000;// Задержка создания и отправки маски:
// в течение этого периода пользователь может продолжить рисовать (со сбросом таймера),
// после окончания периода задержки происходит формирование и отправка маски на сервер.

let timeout,// Таймер для задержки отправки маски.
    isDrawing = false,// Флаг режима рисования: true при нажатой кнопке мыши.
    color = colors['green'];// Текущий цвет, по-умолчанию - зеленый.

//Класс Drawer.
//Представляет объект, управляющий холстом и процессом рисования.
export class Drawer {

  constructor(app) {
    //ссылка на родительское приложение:
    this.app = app;
    
    //размеры холста устанавливаются по размерам изображения:
    canvas.width = this.app.currentImage.offsetWidth;
    canvas.height = this.app.currentImage.offsetHeight;
    
    //холст позиционируется по центру страницы над изображением:
    this.app.setElementPositionToCenter(canvas);
    
    color = colors[this.app.currentColor];

    this.app.container.appendChild(canvas);
    this.canvas = canvas;
    
    this.registerEvents();
  }

  registerEvents() {
    canvas.addEventListener('mousedown', (event) => {
      //при нажатии левой кнопки мыши сбрасывается таймер ожидания отправки маски:
      clearTimeout(timeout);
      //в режиме "рисование" готовится отрисовка линии:
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
      //при движении мыши с нажатой левой кнопкой рисуется линия:
      if (this.app.currentMode === 'draw' && isDrawing) {
        const point = [event.offsetX, event.offsetY];
        draw(point);
      }
      tick();
    });

    //сброс режима рисования при отпускании кнопки мыши или покидании границ холста:
    ['mouseup', 'mouseleave'].forEach(evName => canvas.addEventListener(evName, () => isDrawing = false));
    
    //при отпускании кнопки мыши вызывается обработчик:
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this), false);
  }

  //Метод-обработчик события при отпускании кнопки мыши.
  onMouseUp() {
    //задержка создания новой маски:
    debounce(this.newMask.bind(this), MASK_DELAY);
  }

  //Метод newMask создает новую маску и склеивает с существующей.
  newMask() {
    const mask = this.app.container.querySelector('img.mask');
    if (mask) {
      ctx.drawImage(mask, 0, 0);
    }
    //рисунок преобразуется в двоичный объект и отправляется на сервер:
    canvas.toBlob(blob => {
      this.app.uploadMask(blob)
        .then(() => this.clearMasks())
        .catch((err) => console.log(`Ошибка отправки маски: ${err.message}`));
    });
  }

  //Метод clearMasks удаляет все маски со страницы.
  clearMasks() {
    const oldMasks = this.app.container.querySelectorAll('img.mask');
    for (const mask of oldMasks) {
      mask.parentElement.removeChild(mask);
    }
  }

  //Метод clearCanvas очищает холст.
  //Вызывается из метода addMask родительского приложения.
  clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  //Метод setColor устанавливает текущий цвет из палитры.
  setColor(colorName) {
    color = colors[colorName];
  }

}//end class Drawer

//Функция создания маски.
export function createMask(container) {
  return new Promise((resolve, reject) => {
    const mask = document.createElement('img');
    mask.classList.add('current-image');
    mask.classList.add('mask');
    mask.style.left = `${canvas.style.left}px`;
    mask.style.top = `${canvas.style.top}px`;
    mask.width = canvas.width;
    mask.height = canvas.height;
    mask.crossOrigin = "anonymous";//для обхода CORS при склеивании маски с холстом
    return resolve(mask);
  });
};

//Функция рисования линии между заданными точками.
function draw(point) {
  ctx.lineTo(...point);
  ctx.stroke();
  ctx.moveTo(...point);
}

//Функция отсчета тактов
function tick() {
  window.requestAnimationFrame(tick);
}

//Функция для сглаживания выполнения другой функции 
function debounce(callback,  delay) {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    timeout = null;
    callback();
  }, delay);
};