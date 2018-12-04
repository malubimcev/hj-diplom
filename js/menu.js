'use strict';

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

export default class Menu {
  constructor(container, app) {
    this.menu = container;
    this.app = app;
    this.menuItems = container.querySelectorAll('.menu__item');
    this.drag = container.querySelector('.drag');
    this.draggedMenu = null;
    this.showComments = container.querySelectorAll('input[name="toggle"]');
    this.linkField = container.querySelector('.menu__url');
    this.copyLinkBtn = container.querySelector('.menu_copy');
    this.burger = container.querySelector('.burger');

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

  changeCommentMode() {
    const mode = this.menu.querySelector('.menu__toggle-bg input:checked').value;
    this.app.setCommentMode(mode);
  }

  changeColor() {
    const color = this.menu.querySelector('.draw-tools input:checked').value;
    this.app.setColor(color);
  }

  resetState() {
    const modeItems = this.menu.querySelectorAll('.mode');
    for (const modeItem of modeItems) {
      if (modeItem.dataset.state) {
        modeItem.dataset.state = '';
      }
    }
    this.app.currentMode = '';
  }

  setPublicationState() {
    this.menu.dataset.state = 'initial';
    this.burger.style = 'display: none;';
  }

  setEditState() {
    this.menu.dataset.state = 'selected';
    this.burger.style = 'display: inline-block;';
  }

  setShareState() {
    this.resetState();
    this.menu.querySelector('.mode.share').dataset.state = 'selected';
  }

  setCommentState() {
    //this.resetState();
    this.menu.querySelector('.mode.comments').dataset.state = 'selected';
  }

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
      if (this.menu.dataset.state === 'initial') {
        this.app.selectFile();
        return;
      }      
      if (item.dataset.state === 'selected') {
        this.app.selectFile();
      }
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
        this.app.setCommentMode();
      }
    }
  }

  copyLink() {
    navigator.clipboard.writeText(this.linkField.value)
      .then()
      .catch(err => console.log('Ошибка копирования в буфер', err));
  }
}