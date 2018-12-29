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
    this.commentsContainer = null;

    this.registerEvents();
  }

  registerEvents() {
    document.addEventListener('DOMContentLoaded', this.onPageLoad.bind(this), false);

    ['dragenter', 'dragover', 'drop'].forEach(eventName => {
      this.container.addEventListener(eventName, event => event.preventDefault(), false);
    });

    this.container.addEventListener('drop', this.onDrop.bind(this), false);
    this.currentImage.addEventListener('load', this.onImageLoad.bind(this), false);
  }

  onPageLoad() {
    this.imageId = window.location.search.slice(4);
    if (this.imageId) {
      this.createCommentsContainer();
      console.log(this.commentsContainer.className);
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
    this.commentsContainer.style.zIndex = this.drawer.canvas.style.zIndex + 1;
    const forms = this.container.querySelectorAll('.comments__form');
    const formElements = this.container.querySelectorAll('.comments__form *');
    for (const frm of forms) {
      frm.style.zIndex = mode === 'on' ? 2 : 0;
    }
    for (const elem of formElements) {
      elem.style = mode === 'on' ? 'visibility: visible;' : 'visibility: hidden;';;
    }
    this.menu.setCommentState();
    this.currentMode = 'comments';
  }

  setDrawMode() {
    this.commentsContainer.style.zIndex = this.drawer.canvas.style.zIndex - 1;
    this.currentMode = 'draw';
  }

  setErrorMode(errMessage) {
    this.currentMode = 'error';
    this.imageLoader.style = 'display: none;';
    this.error.style = 'display: block;';
    this.errorMessage.textContent = errMessage;
  }

  addCommentBoard(coords) {
    const commentBoard = new CommentBoard(this.commentsContainer, this);
    commentBoard.board.style.left = `${coords.left - this.currentImageCoords.left}px`;
    commentBoard.board.style.top = `${coords.top - this.currentImageCoords.top}px`;
    return commentBoard;
  }

  addComment(commentObj) {
    commentObj.left += parseInt(this.currentImageCoords.left);
    commentObj.top += parseInt(this.currentImageCoords.top);
    let elem = document.elementFromPoint(commentObj.left + 5, commentObj.top + 5);
console.log(elem.className);
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

  setColor(colorName) {
    this.currentColor = colorName;
    if (this.drawer) {
      this.drawer.setColor(this.currentColor);
    }
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
    this.imageLoader.style = 'display: none;';
    this.clearPage();

    this.drawer = new Drawer(this.currentImage, this);

    if (!this.commentsContainer) {
      this.createCommentsContainer();
    }
    this.commentsContainer.style.width = `${this.currentImage.offsetWidth}px`;
    this.commentsContainer.style.height = `${this.currentImage.offsetHeight}px`;

    this.updatePage();
    this.createWebSocketConnection();
  }

  clearPage() {
    if (this.drawer) {
      const masks = this.container.querySelectorAll('.mask');
      for (const mask of masks) {
        this.container.removeChild(mask);
      }
      this.drawer = null;
    }
    if (this.commentsContainer) {
      const commentBoards = this.commentsContainer.querySelectorAll('.comments__form');
      for (const board of commentBoards) {
        this.commentsContainer.removeChild(board);
      }
    }
  }

  onClick(event) {
    if (this.currentMode === 'comments') {
      if (event.target.className === 'comments-container') {
        this.addCommentBoard({
          'left': event.pageX,
          'top': event.pageY
        });
      }
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
    this.commentsContainer = document.createElement('div');
    this.commentsContainer.classList.add('comments-container');
    this.commentsContainer.style.left = '50%';
    this.commentsContainer.style.top = '50%';
    this.commentsContainer.style.position = 'absolute';
    this.commentsContainer.style.transform = 'translate(-50%, -50%)';

    this.container.insertBefore(this.commentsContainer, this.error);
    this.commentsContainer.addEventListener('click', this.onClick.bind(this), false);
  }

  updatePage() {
    this.currentImageCoords = this.currentImage.getBoundingClientRect();
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