'use strict';

import Menu from "./menu.js";
import FileLoader from "./loader.js";
import WSConnection from "./socket.js";
import CommentBoard from "./comments.js";
import Drawer from "./drawer.js";

export default class Application {
  constructor(container) {
    this.container = container;

    this.imageLoader = container.querySelector('.image-loader');
    this.currentImage = container.querySelector('.current-image');
    this.imageId = '';
    this.currentColor = 'green';
    this.page = 'https://netology-code.github.io/hj-26-malubimcev/';
    this.isUpdated = false;

    this.commentsForm = container.querySelector('.comments__form');
    
    this.error = container.querySelector('.error');
    this.errorMessage = container.querySelector('.error__message');
    this.fileTypeErrorMessage = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
    this.fileDropErrorMessage = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню.';

    this.menu = new Menu(container.querySelector('.menu'), this);
    this.drawer = null;
    this.currentMode = '';
    this.connection = null;

    this.registerEvents();
    // this.setPublicationMode();//*******************включить после отладки***************
    this.setTestMode();//режим отладки****************удалить после отладки*****************
  }

  registerEvents() {
    document.addEventListener('DOMContentLoaded', this.onPageLoad.bind(this), false);

    ['dragenter', 'dragover', 'drop'].forEach(eventName => {
      this.container.addEventListener(eventName, event => event.preventDefault(), false);
    });
    this.container.addEventListener('drop', this.onDrop.bind(this), false);
  }

  onPageLoad() {
    this.imageId = window.location.search.slice(4);
    if (this.imageId) {
      this.loadImage();
      this.setCommentMode('on');
    }
  }

  resetModes() {
    this.imageLoader.style = 'display: none;';
    this.error.style = 'display: none;';
    if (this.drawer) {
      this.drawer.removeCanvas();
      this.drawer = null;
    }
  }

  setPublicationMode() {
    this.currentMode = 'publication';
    this.currentImage.src = '';
    this.menu.setPublicationState();
  }

  setShareMode() {
    this.currentMode = 'share';
    const id = this.imageId ? ('?id=' + this.imageId) : '';
    this.menu.linkField.value = this.page + id;
    this.menu.setEditState();
    this.menu.setShareState();
  }

  setCommentMode(mode) {
    this.currentMode = 'comments';
    const display = mode === 'on' ? 'display: block;' : 'display: none;';
    const markers = this.container.querySelectorAll('.comments__marker');
    const bodys = this.container.querySelectorAll('.comments__body');
    for (const marker of markers) {
      marker.style = display;
    }
    for (const body of bodys) {
      body.style = display;
    }
    this.menu.setEditState();
    this.menu.setCommentState();
  }

  setTestMode() {//*******************удалить после отладки*********************************************
    const data = {
      "id": "aba23fc0-1008-11e8-b8b2-2b0fbff0de7d",
      "title": "Макет дизайна",
      "url": "https://storage.googleapis.com/neto-api.appspot.com/pic/aba23fc0-1008-11e8-b8b2-2b0fbff0de7d/bMFAlDwf9AI.jpg",
      "timestamp": 1518449006013      
    };
    this.updatePage(data);
    this.currentImage.addEventListener('load', (event) => {
      this.drawer = new Drawer(this.currentImage, this);
    });
    this.currentImage.src = data.url;
    this.imageLoader.style = 'display: none;';
    this.setCommentMode('on');
  }//***************************************************************************************************

  addCommentBoard(event) {
    const left = parseInt(event.pageX);
    const top = parseInt(event.pageY);
    const commentBoard = new CommentBoard(null, this);
    commentBoard.board.style.left = `${left}px`;
    commentBoard.board.style.top = `${top}px`;
    this.container.appendChild(commentBoard.board);
  }

  addComment(commentObj) {
    //
  }

  setDrawMode() {
    this.currentMode = 'draw';
  }

  setColor(colorName) {
    this.currentColor = colorName;
    if (this.drawer) {
      this.drawer.setColor(this.currentColor);
    }
  }

  setErrorMode(errMessage) {
    this.currentMode = 'error';
    this.imageLoader.style = 'display: none;';
    this.error.style = 'display: block;';
    this.errorMessage.textContent = errMessage;
  }

  selectFile() {
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.setAttribute('accept', 'image/jpeg, image/png');
    fileInput.addEventListener('change', () => this.uploadFile(fileInput.files[0]), false);
    fileInput.click();
  }

  onDrop(event) {
    const file = event.dataTransfer.files[0];
    const fileType = /^image\//;
    if (this.currentMode === 'publication') {
      if (file && file.type.match(fileType)) {
        this.uploadFile(file);
      } else {
        this.setErrorMode(this.fileTypeErrorMessage);
      }
    } else {
      this.setErrorMode(this.fileDropErrorMessage);
    }
  }
  
  uploadFile(file) {
    this.isUpdated = false;
    this.imageLoader.style = 'display: block;';
    this.error.style = 'display: none;';
    const formData = new FormData();
    formData.append('title', file.name);
    formData.append('image', file, file.name);
    const loader = new FileLoader(this);
    loader.upload(formData, '/pic', this.onFileUploaded.bind(this));
  }

  onFileUploaded(data) {
    this.updatePage(data);
    this.currentImage.addEventListener('load', (event) => {
      this.drawer = new Drawer(this.currentImage, this);
    });
    this.currentImage.src = data.url;
    this.imageLoader.style = 'display: none;';
    this.connection = new WSConnection(this);
    this.setShareMode();
  }

  onClick(event) {
    //if (this.currentMode === 'comments') {//********************включить после отладки*****************
      this.addCommentBoard(event);
    //}
  }

  uploadMask(img) {
    this.connection.send(img);
  }

  addMask(url) {
    const mask = this.currentImage.cloneNode();
    mask.style.left = this.currentImage.style.left;
    mask.style.top = this.currentImage.style.top;
    mask.width = this.currentImage.width;
    mask.height = this.currentImage.height;
    mask.style.zIndex = this.currentImage.style.zIndex + 1;
    mask.addEventListener('load', this.currentImage.appendChild(mask));
    mask.src = url;
  }

  loadImage() {
    if (!this.isUpdated) {
      const loader = new FileLoader(this);
      loader.loadData('/pic/' + this.imageId)
        .then(Data => {
          this.onFileUploaded.bind(this);
          this.isUpdated = true;
        });
    }
  }

  updatePage(data) {
    this.imageId = data.id;
    if (data.mask) {
      this.addMask(data.mask);
    }
    if (data.comments) {
      data.comments.forEach(this.addComment);
    }
  }

}