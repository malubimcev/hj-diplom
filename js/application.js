'use strict';

import Menu from "./menu.js";
import FileLoader from "./loader.js";
import WSConnection from "./socket.js";
import {CommentBoard} from "./comments.js";
import {createComment} from "./comments.js";
import Drawer from "./drawer.js";

const FILE_TYPE_ERROR_MESSAGE = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
const DROP_ERROR_MESSAGE = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню.';

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

    this.menu = new Menu(container.querySelector('.menu'), this);
    this.drawer = null;
    this.currentMode = '';
    this.connection = null;

    this.registerEvents();
    this.setPublicationMode();
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

  setPublicationMode() {
    this.currentImage.src = '';
    this.menu.setPublicationState();
    this.currentMode = 'publication';
  }

  setShareMode() {
    const id = this.imageId ? ('?id=' + this.imageId) : '';
    this.menu.linkField.value = this.page + id;
    this.menu.setEditState();
    this.menu.setShareState();
    this.currentMode = 'share';
  }

  setCommentMode(mode) {
    const display = mode === 'on' ? 'visibility: visible; z-index: 999;' : 'visibility: hidden; z-index: 0;';
    const markers = this.container.querySelectorAll('.comments__marker');
    const bodys = this.container.querySelectorAll('.comments__body');
    const inputs = this.container.querySelectorAll('.comments__marker-checkbox');
    for (const marker of markers) {
      marker.style = display;
    }
    for (const body of bodys) {
      body.style = display;
    }
    for (const inp of inputs) {
      inp.style = display;
      inp.style.zIndex = 9999;
    }
    this.menu.setEditState();
    this.menu.setCommentState();
    this.currentMode = 'comments';
  }

  addCommentBoard(event) {
    const commentBoard = new CommentBoard(null, this);
    commentBoard.board.style.left = `${event.pageX}px`;
    commentBoard.board.style.top = `${event.pageY}px`;
  }

  addComment(commentObj) {
    const elem = document.elementFromPoint(commentObj.left, commentObj.top);
    const comment = createComment(commentObj);
    if (elem.className === 'comments__body') {
      const refNode = elem.querySelector('.loader');
      elem.insertBefore(comment, refNode.parentElement);
    }
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
        this.setErrorMode(FILE_TYPE_ERROR_MESSAGE);
      }
    } else {
      this.setErrorMode(DROP_ERROR_MESSAGE);
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
    if (this.currentMode === 'comments') {
      this.addCommentBoard(event);
    }
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
        .then(data => {
          this.onFileUploaded(data);
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
      for (const key in data.comments) {
        this.addComment(data.comments[key]);
      }
    }
  }

}