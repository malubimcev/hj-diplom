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

  getMenuItem(event) {
    return event.target.classList.contains('menu__item') ? event.target : event.target.parentElement;
  }
  
  changeCommentMode() {
    const mode = this.menu.querySelector('.menu__toggle-bg input:checked').value;
    app.setCommentMode(mode);
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
        app.selectFile();
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
      app.setShareMode();
    }

    this.menuWidth = this.menu.offsetWidth;
  }

  copyLink() {
    navigator.clipboard.writeText(this.linkField.value)
      .then()
      .catch(err => console.log('Ошибка копирования в буфер', err));
  }

}

class Application {
  constructor(container) {
    this.container = container;
    this.menu = new Menu(container.querySelector('.menu'));
    this.imageLoader = container.querySelector('.image-loader');
    this.currentImage = container.querySelector('.current-image');
    this.imageId = '';
    this.page = 'https://netology-code.github.io/hj-26-malubimcev/';
    this.commentsForm = container.querySelector('.comments__form');
    
    this.error = container.querySelector('.error');
    this.errorMessage = container.querySelector('.error__message');
    this.fileTypeErrorMessage = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
    this.fileLoadErrorMessage = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню.';

    this.registerEvents();
    this.setCommentMode('on');
    this.setPublicationMode();
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
    const id = this.imageId ? ('?id=' + this.imageId) : '';
    this.menu.linkField.value = this.page + id;
  }

  setCommentMode(mode) {
    const display = mode === 'on' ? 'display: block;' : 'display: none;';
    const markers = this.container.querySelectorAll('.comments__form');
    for (const marker of markers) {
      marker.style = display;
    }
  }

  setDrawMode() {
    //
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
      this.currentImage.src = data.url;
      this.imageId = data.id;
      this.setShareMode();
    });
  }

  getPicId() {
    return this.imageId;
  }

  getLink(id) {
    const loader = new FileLoader();
    loader.loadData('/pic/' + this.imageId)
      .then(data => this.page = data);
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
    return fetch(this.mainURL + url)
      .then(res => {
        if (200 <= res.status && res.status < 300) {
          return res.json();
        }
        throw new Error(res.statusText);
      })
      .catch(err => app.setErrorMode(err.message));
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
    this.board = container;
    this.addButton = this.board.querySelector('.comments__submit');
    this.closeButton = this.board.querySelector('.comments__close');
    this.commentInput = this.board.querySelector('.comments__input');

    this.registerEvents();
  }

  registerEvents() {
    this.addButton.addEventListener('click', this.close.bind(this));
    this.submitButton.addEventListener('click', this.sendComment.bind(this));
  }

  sendComment() {
    let formData = new FormData(this.board);
    formData.append('left', this.board.style.left);
    formData.append('top', this.board.style.top);
    formData.append('message', this.commentInput.textContent);
    const loader = new FileLoader();
    const url = '/pic/' + app.getPicId() + '/comments'
    loader.update(formData, url, (data) => {
      this.currentImage.src = data.url;
      this.imageId = data.id;
      this.setShareMode();
    });
  }

  close() {
    //
  }

}

const app = new Application(document.querySelector('.app'));