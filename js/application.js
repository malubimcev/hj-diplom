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
    this.commentsForm = container.querySelector('.comments__form');
    
    this.error = container.querySelector('.error');
    this.errorMessage = container.querySelector('.error__message');
    this.fileTypeErrorMessage = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
    this.fileLoadErrorMessage = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню.';

    this.menu = new Menu(container.querySelector('.menu'), this);
    this.drawer = null;

    this.connection = null;

    this.registerEvents();
    //this.setCommentMode('on');
    this.setPublicationMode();
  }

  registerEvents() {
    ['dragenter', 'dragover', 'drop'].forEach(eventName => {
      this.container.addEventListener(eventName, event => event.preventDefault(), false);
    });
    this.container.addEventListener('drop', this.onDrop.bind(this), false);
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
    this.currentImage.src = '';
    this.menu.setPublicationState();
  }

  setShareMode() {
    const id = this.imageId ? ('?id=' + this.imageId) : '';
    this.menu.linkField.value = this.page + id;
    this.menu.setEditState();
  }

  setCommentMode(mode) {
    const onImageClick = this.addCommentBoard.bind(this);
    this.currentImage.removeEventListener('click', onImageClick, false);
    const display = mode === 'on' ? 'display: block;' : 'display: none;';
    const markers = this.container.querySelectorAll('.comments__form');
    for (const marker of markers) {
      marker.style = display;
    }
    this.currentImage.addEventListener('click', onImageClick, false);
  }

  addCommentBoard(event) {
    const left = parseInt(event.currentTarget.style.left) - img.getBoundingClientRect().x;
    const top = parseInt(event.currentTarget.style.top) - img.getBoundingClientRect().y;
    //const left = event.layerX;
    // const top = event.layerY;
    const commentBoard = new CommentBoard(null, this);
    this.container.appendChild(commentBoard.board);
    commentBoard.board.style.left = left;
    commentBoard.board.style.top = top;
    commentBoard.board.style = 'display: block;';
  }

  addComment(commentObj) {
    //
  }

  setDrawMode() {
    //
  }

  setColor(colorName) {
    this.currentColor = colorName;
    if (this.drawer) {
      this.drawer.setColor(this.currentColor);
    }
  }

  setErrorMode(errMessage) {
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

  uploadFile(file) {
    this.imageLoader.style = 'display: block;';
    this.error.style = 'display: none;';
    const formData = new FormData();
    formData.append('title', file.name);
    formData.append('image', file, file.name);
    const loader = new FileLoader(this);
    loader.upload(formData, '/pic', this.onFileUploaded);
  }

  onDrop(event) {
    const file = event.dataTransfer.files[0];
    const fileType = /^image\//;
    if (file && file.type.match(fileType)) {
      this.uploadFile(file);
    } else {
      this.setErrorMode(this.fileTypeErrorMessage);
    }
  }
  
  onFileUploaded(data) {
    this.imageLoader.style = 'display: none;';
    this.currentImage.src = data.url;
    this.imageId = data.id;
    this.connection = new WSConnection(this);
    this.drawer = new Drawer(this.currentImage, this);
    this.setShareMode();
  }

  uploadMask(img) {
    this.ws.send(img);
  }

  addMask(mask) {
    this.currentImage.appendChild(mask);
  }

  getPicId() {
    return this.imageId;
  }
  
  loadImage() {
    const loader = new FileLoader(this);
    loader.loadData('/pic/' + this.imageId)
      .then(data => {
        this.imageId = data.id;
        this.currentImage.src = data.url;
        if (data.mask) {
          this.addMask(data.mask);
        }
        if (data.comments) {
          data.comments.forEach(this.addComment);
        }
        this.setShareMode();
      });
  }

  getLink(id) {
    const loader = new FileLoader();
    loader.loadData('/pic/' + this.imageId)
      .then(data => this.page = data);
  }

}