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

class Menu {
  constructor(container) {
    this.menu = container;
    this.menuItems = container.querySelectorAll('.menu__item');
    this.drag = container.querySelector('.drag');
    this.draggedMenu = null;
    this.menuWidth = this.menu.offsetWidth;

    this.onMove = throttle(event => {
      if (this.draggedMenu) {
        event.preventDefault();
        let x = event.pageX - this.drag.offsetWidth / 2;
        let y = event.pageY - this.drag.offsetHeight / 2;

        const xMax = document.documentElement.clientWidth - this.menuWidth;
        const yMax = document.documentElement.clientHeight - this.menu.offsetHeight;

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
    this.menu.addEventListener('click', this.setState.bind(this));
    this.drag.addEventListener('mousedown', (event) => this.draggedMenu = this.menu);
    document.addEventListener('mousemove', this.onMove.bind(this));

    this.drag.addEventListener('mouseup', (event) => {
      if (this.draggedMenu) {
        this.draggedMenu = null;
      }
    });

  }

  getMenuItem(event) {
    return event.target.classList.contains('menu__item') ? event.target : event.target.parentElement;
  }

  setState(event) {
    const item = this.getMenuItem(event);

    const resetState = () => {
      const modeItems = this.menu.querySelectorAll('.mode');
      for (const modeItem of modeItems) {
        if (modeItem.dataset.state) {
          modeItem.dataset.state = '';
        }
      }
    }

    if (item.classList.contains('burger')) {
      resetState();
      this.menu.dataset.state = 'default';
    }

    if (item.classList.contains('mode')) {
      resetState();
      this.menu.dataset.state = 'selected';
      item.dataset.state = 'selected';
    }

  }

}

const menu = new Menu(document.querySelector('.menu'));