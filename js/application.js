'use strict';

import Menu from "./menu.js";
import FileLoader from "./loader.js";
import WSConnection from "./socket.js";
import {CommentsContainer} from "./comments.js";
import {Drawer} from "./drawer.js";
import {createMask} from "./drawer.js";

const FILE_TYPE_ERROR_MESSAGE = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
const DROP_ERROR_MESSAGE = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню.';

export default class Application {
  constructor(container) {
    this.container = container;

    this.imageLoader = container.querySelector('.image-loader');
    this.currentImage = container.querySelector('.current-image');

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
      this.createWebSocketConnection();
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
    this.container.appendChild(this.commentsContainer.container);
    this.commentsContainer.show(mode);
    this.menu.setCommentState();
    this.currentMode = 'comments';
  }

  setDrawMode() {
    this.container.appendChild(this.drawer.canvas);
    this.currentMode = 'draw';
  }

  setErrorMode(errMessage) {
    this.currentMode = 'error';
    this.imageLoader.style = 'display: none;';
    this.error.style = 'display: block;';
    this.errorMessage.textContent = errMessage;
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
    if (this.currentMode === 'publication' && !this.isUpdated) {
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
    this.setPageData(data);
    this.connection = null;
    this.createWebSocketConnection();
    setTimeout(this.setShareMode.bind(this), 2 * 1000);
  }
  
  setPageData(data) {
    this.pageData = data;
    this.imageId = this.pageData.id;   
  }

  setImageSrc(data) {
    this.setPageData(data);
    this.currentImage.src = data.url;//будет выполнен обработчик onImageLoad()
  }

  onImageLoad(event) {
    this.imageLoader.style = 'display: none;';
    this.clearPage();
    
    if (!this.drawer) {
      this.drawer = new Drawer(this);
    }

    if (!this.commentsContainer) {
      this.commentsContainer = new CommentsContainer(this);
    }

    if (this.isUpdated) {
      this.setCommentMode('on');
    } else {
      this.createWebSocketConnection();
    }
    this.updatePage();
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
      this.commentsContainer.removeAll();
      this.commentsContainer = null;
    }
  }

  uploadMask(img) {
    return new Promise((resolve, reject) => {
      this.connection.send(img);
      return resolve();
    });
  }

  addMask(url) {
    //вызывается из Socket при событии "mask"
    createMask(this.currentImage)
      .then((mask) => {
        mask.addEventListener('load', () => {
          this.currentImage.parentElement.insertBefore(mask, this.error);
          this.drawer.clearCanvas();
        });
        mask.src = url;
      });
  }

  addComment(commentObj) {
    //вызывается из Socket при событии "comment"
    this.commentsContainer.addComment(commentObj);
  }

  loadImageData() {
    //вызывается из Socket при событии "pic"
    if (!this.isUpdated) {
      const loader = new FileLoader(this);
      loader.loadData('/pic/' + this.imageId)
        .then(data => {
          this.setImageSrc(data);
          this.isUpdated = true;
        });
    }
  }

  updatePage() {
    if (this.pageData.mask) {
      this.addMask(this.pageData.mask);
    }
    if (this.pageData.comments) {
      this.commentsContainer.addListOfComments(this.pageData.comments);
    }
  }
  
  setElementPositionToCenter(elem) {
    elem.style.left = '50%';
    elem.style.top = '50%';
    elem.style.position = 'absolute';
    elem.style.transform = 'translate(-50%, -50%)';
  }

}//end class