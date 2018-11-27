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

    // this.ws = new WSConnection(this);

    this.registerEvents();
    //this.setCommentMode('on');
    this.setPublicationMode();
    //this.setDrawMode();
  }

  registerEvents() {
    //document.addEventListener('DOMContentLoaded', this.setPublicationMode().bind.this, false);
  }

  resetModes() {
    this.imageLoader.style = 'display: none;';
    this.error.style = 'display: none;';
    if (this.drawer) {
      this.drawer.remove();
      this.drawer = null;
    }
  }

  setPublicationMode() {
    this.imageLoader.style = 'display: none;';
    this.currentImage.src = '';
    this.menu.setPublicationState();
  }

  setShareMode() {
    const id = this.imageId ? ('?id=' + this.imageId) : '';
    this.menu.linkField.value = this.page + id;
  }

  setCommentMode(mode) {
    const onImageClick = this.addCommentBoard.bind.this;
    this.currentImage.removeEventListener('click', onImageClick, false);
    const display = mode === 'on' ? 'display: block;' : 'display: none;';
    const markers = this.container.querySelectorAll('.comments__form');
    for (const marker of markers) {
      marker.style = display;
    }
    this.currentImage.addEventListener('click', onImageClick, false);
  }

  addCommentBoard(event) {
    const left = event.layerX;
    const top = event.layerY;
    const commentBoard = new CommentBoard(null, this);
    this.container.appendChild(commentBoard.board);
    commentBoard.board.style.left = left;
    commentBoard.board.style.top = top;
    commentBoard.style = 'display: block;';
  }

  addComment(commentObj) {

  }

  setDrawMode() {
    this.drawer = new Drawer(this.currentImage, this);
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
      const onImageClick = this.addCommentBoard(e).bind.this;
      this.imageId = data.id;
      this.setShareMode();
    });
  }
  
  uploadMask(img) {
    this.ws.send(img);
  }

  addMask(mask) {

  }

  getPicId() {
    return this.imageId;
  }
  
  loadImage() {
    const loader = new FileLoader();
    loader.loadData('/pic/' + this.imageId)
      .then(data => {
        this.imageId = data.id;
        this.currentImage.src = data.url;

      });
  }

  getLink(id) {
    const loader = new FileLoader();
    loader.loadData('/pic/' + this.imageId)
      .then(data => this.page = data);
  }

}