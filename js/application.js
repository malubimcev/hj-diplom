'use strict';

import Menu from "./menu.js";
import FileLoader from "./loader.js";
import WSConnection from "./socket.js";
import {CommentBoard} from "./comments.js";
import {createComment} from "./comments.js";
import {Drawer} from "./drawer.js";
import {createMask} from "./drawer.js";

const FILE_TYPE_ERROR_MESSAGE = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
const DROP_ERROR_MESSAGE = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню.';

export default class Application {
  constructor(container) {
    this.container = container;

    this.imageLoader = container.querySelector('.image-loader');
    this.currentImage = container.querySelector('.current-image');
    this.currentImageCoords = null;

    this.pageData = null;
    this.imageId = '';
    this.currentColor = 'green';
    this.page = 'https://netology-code.github.io/hj-26-malubimcev/';
    this.isUpdated = false;

    this.error = container.querySelector('.error');
    this.errorMessage = container.querySelector('.error__message');

    this.menu = new Menu(container.querySelector('.menu'), this);
    this.drawer = null;
    this.currentMode = '';
    this.connection = null;

    this.registerEvents();
  }

  registerEvents() {
    document.addEventListener('DOMContentLoaded', this.onPageLoad.bind(this), false);

    ['dragenter', 'dragover', 'drop'].forEach(eventName => {
      this.container.addEventListener(eventName, event => event.preventDefault(), false);
    });

    this.container.addEventListener('drop', this.onDrop.bind(this), false);
    this.currentImage.addEventListener('load', this.onImageLoad.bind(this), false);

    window.addEventListener('resize', this.onResize.bind(this), false);
  }

  onPageLoad() {
    this.imageId = window.location.search.slice(4);
    if (this.imageId) {
      this.createWebSocketConnection();
      this.setCommentMode('on');
    } else {
      this.setPublicationMode();
    }
  }

  createWebSocketConnection() {
    if (!this.connection) {
      this.connection = new WSConnection(this);
    }
  }

  setPublicationMode() {
    this.currentImage.src = '';
    this.drawer = null;
    this.commentsContainer = null;
    this.menu.setPublicationState();
    this.currentMode = 'publication';
  }

  setShareMode() {
    const id = this.imageId ? ('?id=' + this.imageId) : '';
    this.menu.linkField.value = this.page + id;
    this.menu.setShareState();
    this.currentMode = 'share';
  }

  setCommentMode(mode) {
    const forms = this.container.querySelectorAll('.comments__form');
    const formElements = this.container.querySelectorAll('.comments__form *');
    for (const frm of forms) {
      frm.style.zIndex = mode === 'on' ? 100 : 0;
    }
    for (const elem of formElements) {
      elem.style = mode === 'on' ? 'visibility: visible;' : 'visibility: hidden;';;
    }
    this.menu.setCommentState();
    this.currentMode = 'comments';
  }

  addCommentBoard(coords) {
    const commentBoard = new CommentBoard(this.container, this);
    commentBoard.board.style.left = `${coords.left}px`;
    commentBoard.board.style.top = `${coords.top}px`;
    return commentBoard;
  }

  addComment(commentObj) {
    let elem = document.elementFromPoint(commentObj.left, commentObj.top);

    if (elem.className !== 'comments__body') {
      const form = this.addCommentBoard({
        'left': commentObj.left,
        'top': commentObj.top
      });
      elem = form.board.querySelector('.comments__body');
    }

    const comment = createComment(commentObj);
    const refNode = elem.querySelector('.comment div');
    elem.insertBefore(comment, refNode.parentElement);
  }

  onResize() {
    const newImageCoords = this.currentImage.getBoundingClientRect();
    const commentForms = this.container.querySelectorAll('.comments__form');
    for (const frm of commentForms) {
      frm.style.left = `${parseInt(frm.style.left) + parseInt(newImageCoords.left - this.currentImageCoords.left)}px`;
      frm.style.top = `${parseInt(frm.style.top) + parseInt(newImageCoords.top - this.currentImageCoords.top)}px`;    }
    this.currentImageCoords = newImageCoords;
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
    this.setImageSrc(data);
    this.setShareMode();
  }

  setImageSrc(data) {
    this.pageData = data;
    this.imageId = this.pageData.id;
    this.currentImage.src = data.url;//будет выполнен обработчик onImageLoad()
  }

  onImageLoad(event) {
    if (!this.drawer) {
      this.drawer = new Drawer(this.currentImage, this);
    }
    this.imageLoader.style = 'display: none;';
    this.updatePage();
    this.currentImageCoords = this.currentImage.getBoundingClientRect();
    this.createWebSocketConnection();
    if (!this.commentsContainer) {
      this.createCommentsContainer();
      this.commentsContainer.width = this.currentImage.offsetWidth;
      this.commentsContainer.height = this.currentImage.offsetHeight;
    }
  }

  onClick(event) {
    if (this.currentMode === 'comments') {
      this.addCommentBoard({
        'left': event.pageX,
        'top': event.pageY
      });
    }
  }

  uploadMask(img) {
    this.connection.send(img);
  }

  addMask(url) {
    const mask = createMask(this.currentImage);
    mask.addEventListener('load', () => this.currentImage.parentElement.insertBefore(mask, this.error));
    mask.src = url;
  }

  loadImageData() {
    if (!this.isUpdated) {
      const loader = new FileLoader(this);
      loader.loadData('/pic/' + this.imageId)
        .then(data => {
          this.setImageSrc(data);
          this.isUpdated = true;
        });
    }
  }

  createCommentsContainer() {
    const box = document.createElement('div');
    box.classList.add('comments-container');
    box.style.left = '50%';
    box.style.top = '50%';
    box.style.position = 'absolute';
    box.style.display = 'block';
    box.style.transform = 'translate(-50%, -50%)';
    box.textContent = '';

    this.commentsContainer = box;
    this.container.appendChild(this.commentsContainer);
  }

  updatePage() {
    if (this.pageData.mask) {
      this.addMask(this.pageData.mask);
    }
    if (this.pageData.comments) {
      for (const key in this.pageData.comments) {
        this.addComment(this.pageData.comments[key]);
      }
    }
  }

}//end class