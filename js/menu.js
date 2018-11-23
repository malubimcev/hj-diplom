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
  constructor(container, app = null) {
    this.menu = container;
    this.app = app;
    this.menuItems = container.querySelectorAll('.menu__item');
    this.drag = container.querySelector('.drag');
    this.draggedMenu = null;
    this.menuWidth = this.menu.offsetWidth;
    this.showComments = container.querySelectorAll('input[name="toggle"]');
    this.linkField = container.querySelector('.menu__url');
    this.copyLinkBtn = container.querySelector('.menu_copy');

    this.onMove = throttle(event => {
      if (this.draggedMenu) {
        event.preventDefault();
        let x = event.pageX - this.drag.offsetWidth / 2;
        let y = event.pageY - this.drag.offsetHeight / 2;

        const xMax = window.innerWidth - this.menuWidth - 2;
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
    this.menu.addEventListener('click', (event) => this.setState(this.getMenuItem(event)).bind(this), false);
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

  getMenuItem(event) {
    return event.target.classList.contains('menu__item') ? event.target : event.target.parentElement;
  }
  
  changeCommentMode() {
    const mode = this.menu.querySelector('.menu__toggle-bg input:checked').value;
    this.app.setCommentMode(mode);
  }

  setState(item) {
    const resetState = () => {
      const modeItems = this.menu.querySelectorAll('.mode');
      for (const modeItem of modeItems) {
        if (modeItem.dataset.state) {
          modeItem.dataset.state = '';
        }
      }
    }

    this.app.resetModes();
    
    if (item.classList.contains('tool')) {
      //if (item.dataset.state === 'selected') {
        //console.log(event.target);
      //}
    }    

    if (item.classList.contains('burger')) {
      resetState();
      this.menu.dataset.state = 'default';
    }

    if (item.classList.contains('new')) {
      if (item.dataset.state === 'selected') {
        this.app.selectFile();
      }
    }
    
    if (item.classList.contains('comments')) {
      if (item.dataset.state === 'selected') {
        this.changeCommentMode();
        
      }
    }

    if (item.classList.contains('mode')) {
      resetState();
      this.menu.dataset.state = 'selected';
      item.dataset.state = 'selected';
      if (item.classList.contains('draw')) {
        this.app.setDrawMode();
      } else {
        this.app.setShareMode();
      }
    }

    this.menuWidth = this.menu.offsetWidth;
  }

  copyLink() {
    navigator.clipboard.writeText(this.linkField.value)
      .then()
      .catch(err => console.log('Ошибка копирования в буфер', err));
  }

}