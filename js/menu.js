/*
  Модуль menu.js.
  Экспортирует класс Menu.
  Обеспечивает работу плавающего меню приложения.
*/
'use strict';

//Внутренний метод throttle.
//Обеспечивает плавную отрисовку меню при перемещении.
function throttle(callback) {
  let isWaiting = false;
  return function() {
    if (!isWaiting) {
      callback.apply(this, arguments);
      isWaiting = true;
      requestAnimationFrame(() => {
        isWaiting = false;
      });
    }
  };
}

//Класс Menu
//Представляет объект меню
export default class Menu {

  constructor(container, app) {
    //Ссылка на DOM-элемент, контейнер для меню.
    this.menu = container;
    //Ссылка на родительское приложение:
    this.app = app;
    //Набор элементов меню:
    this.menuItems = container.querySelectorAll('.menu__item');
    //Область меню для захвата мышью при перетаскивании:
    this.drag = container.querySelector('.drag');
    //Ссылка на меню, запоминаемая при перетаскивании:
    this.draggedMenu = null;
    //
    this.showComments = container.querySelectorAll('input[name="toggle"]');
    //Поле URL-адреса текущей страницы:
    this.linkField = container.querySelector('.menu__url');
    //Кнопка "Копировать" для копирования адреса:
    this.copyLinkBtn = container.querySelector('.menu_copy');
    //
    this.burger = container.querySelector('.burger');

    //Функция-обработчик событий при перетаскивании меню.
    this.onMove = throttle(event => {
      if (this.draggedMenu) {
        event.preventDefault();
        let x = event.pageX - this.drag.offsetWidth / 2;
        let y = event.pageY - this.drag.offsetHeight / 2;

        const xMax = window.innerWidth - this.menu.offsetWidth - 2;
        const yMax = window.innerHeight - this.menu.offsetHeight - 2;

        x = Math.min(x, xMax);
        y = Math.min(y, yMax);
        x = Math.max(x, 0);
        y = Math.max(y, 0);

        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;
      }
    });

    this.registerEvents();
  }

  registerEvents() {
    this.menu.addEventListener('click', this.setState.bind(this), false);
    
    //нажатие кнопки мыши на элементе drag подготавливает меню к перетаскиванию:
    this.drag.addEventListener('mousedown', (event) => this.draggedMenu = this.menu, false);

    document.addEventListener('mousemove', this.onMove.bind(this));
    Array.from(this.showComments).forEach(item => item.addEventListener('change', this.changeCommentMode.bind(this), false));
    this.copyLinkBtn.addEventListener('click', this.copyLink.bind(this), false);

    document.addEventListener('mouseup', (event) => {
      if (this.draggedMenu) {
        this.draggedMenu = null;
      }
    });
  }

  //Метод changeCommentMode меняет видимость комментарриев на изображении.
  //Вызывается при изменении состояния переключателя "Скрыть/Показать".
  //Вызывает метод setCommentMode родительского приложения.
  changeCommentMode() {
    const mode = this.menu.querySelector('.menu__toggle-bg input:checked').value;
    this.app.setCommentMode(mode);
  }

  //Метод changeColor меняет текущий выбранный цвет для рисования.
  //Вызывает метод setColor родительского приложения.
  changeColor() {
    const color = this.menu.querySelector('.draw-tools input:checked').value;
    this.app.setColor(color);
  }

  //Метод resetState сбрасывает текущее состояние всех элементов меню.
  //Вызывается перед установкой состояний меню.
  resetState() {
    const modeItems = this.menu.querySelectorAll('.mode');
    for (const modeItem of modeItems) {
      if (modeItem.dataset.state) {
        modeItem.dataset.state = '';
      }
    }
    this.app.currentMode = '';
  }

  //Метод setPublicationState переключает меню в режим "Публикация".
  setPublicationState() {
    this.menu.dataset.state = 'initial';
    this.burger.style = 'display: none;';
  }

  //Метод setEditState переключает меню в режим "Редактирование".
  //В режиме "Редактирование" доступны пункты "Поделиться", "Рисование", "Комментарии".
  setEditState() {
    this.menu.dataset.state = 'selected';
    this.burger.style = 'display: inline-block;';
  }

  //Метод setShareState переключает меню в режим "Поделиться".
  //Вызывается при клике мышью на пункте "Поделиться".
  setShareState() {
    this.resetState();
    this.setEditState();
    this.menu.querySelector('.mode.share').dataset.state = 'selected';
  }

  //Метод setCommentState переключает меню в режим "Комментарии".
  //Вызывается при клике мышью на пункте "Комментарии".
  setCommentState() {
    this.resetState();
    this.setEditState();
    this.menu.querySelector('.mode.comments').dataset.state = 'selected';
  }

  //Метод setState переключает состояние меню
  //Вызывается при клике мышью на элементах меню или из родительского приложения.
  setState(event) {
    const item = event.target.classList.contains('menu__item') ? event.target : event.target.parentElement;

    if (item.classList.contains('tool')) {
      if (item.classList.contains('draw-tools')) {
        this.changeColor();
      }
    }    

    if (item.classList.contains('burger')) {
      this.resetState();
      this.menu.dataset.state = 'default';
    }

    if (item.classList.contains('new')) {
      this.app.currentMode = 'publication';
      this.app.selectFile();
      return;
    }
    
    if (item.classList.contains('comments')) {
      this.app.currentMode = 'comments';
      if (item.dataset.state === 'selected') {
        this.changeCommentMode();
      }
    }

    if (item.classList.contains('mode')) {
      this.resetState();
      this.menu.dataset.state = 'selected';
      item.dataset.state = 'selected';
      if (item.classList.contains('draw')) {
        this.app.setDrawMode();
      }
      if (item.classList.contains('share')) {
        this.app.setShareMode();
      }
      if (item.classList.contains('comments')) {
        this.app.setCommentMode('on');
      }
    }
  }

  //Метод copyLink копирует в буфер обмена ссылку на текущее изображение.
  //Вызывается в режиме "Поделиться" при нажатии на кнопку "Копировать".
  copyLink() {
    navigator.clipboard.writeText(this.linkField.value)
      .then()
      .catch(err => console.log('Ошибка копирования в буфер', err));
  }
}//End class Menu