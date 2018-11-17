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

    app.resetModes();

    if (item.classList.contains('burger')) {
      resetState();
      this.menu.dataset.state = 'default';
    }

    if (item.classList.contains('new')) {
      if (item.dataset.state === 'selected') {
        app.selectFile();
      }
    }

    if (item.classList.contains('mode')) {
      resetState();
      this.menu.dataset.state = 'selected';
      item.dataset.state = 'selected';
      app.setShareMode();
    }

    this.menuWidth = this.menu.offsetWidth;
  }

}

class Application {
  constructor(container) {
    this.menu = new Menu(container.querySelector('.menu'));
    this.imageLoader = container.querySelector('.image-loader');
    this.currentImage = container.querySelector('.current-image');

    this.error = container.querySelector('.error');
    this.errorMessage = container.querySelector('.error__message');
    this.fileTypeErrorMessage = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
    this.fileLoadErrorMessage = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню.';

    this.registerEvents();
  }

  registerEvents() {
    //
  }

  resetModes() {
    this.imageLoader.style = 'display: none;';
    this.error.style = 'display: none;';
  }

  setPublicationMode() {
    this.imageLoader.style = 'display: none;';
  }

  setShareMode() {

  }

  setCommentMode() {

  }

  setDrawMode() {

  }

  setErrorMode(errMessage) {
    this.imageLoader.style = 'display: none;';
    this.error.style = 'display: block;';
    this.errorMessage.textContent = errMessage;
  }

  selectFile() {
    const fileInput = document.createElement('input');
    fileInput.addEventListener('change', () => this.uploadFile(fileInput.files[0]), false);
    fileInput.type = 'file';
    fileInput.click();
  }

  uploadFile(file) {
    this.imageLoader.style = 'display: block;';
    let formData = new FormData();
    formData.append('title', 'title');
    formData.append('image', file);
    const loader = new FileLoader();
    loader.update(formData, '/pic', (data) => {
      console.log(data);
      this.setShareMode();
    });
    //
  }

}

class FileLoader {
  constructor() {
    this.connection = null;
    this.mainURL = 'https://neto-api.herokuapp.com';
    this.registerEvents();
  }

  registerEvents() {
    //
  }

  upload(data, url, callback) {
    fetch(this.mainURL + url, {
      body: data,
      method: 'POST'
    })
      .then(res => {
        if (200 <= res.status && res.status < 300) {
          return res.json();
        }
        throw new Error(res.statusText);
      })
      .then(callback)
      .catch(err => app.setErrorMode(err.message));      //
  }

  update(data, url, callback) {
    fetch(this.mainURL + url, {
      body: data,
      method: 'POST'
    })
      .then(res => {
        if (200 <= res.status && res.status < 300) {
          return res.json();
        }
        throw new Error(res.statusText);
      })
      .then(callback)
      .catch(err => app.setErrorMode(err.message));  
  }

  loadData(url) {
    return fetch(url)
      .then(res => {
        if (200 <= res.status && res.status < 300) {
          return res.json();
        }
        throw new Error(res.statusText);
      })
  }

}

class Comment {
  constructor(container) {

    this.registerEvents();
  }

  registerEvents() {
    //
  }

}

class CommentBoard {
  constructor(container) {

    this.registerEvents();
  }

  registerEvents() {
    //
  }

}

const app = new Application(document.querySelector('.app'));
