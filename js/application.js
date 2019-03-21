/*
  Модуль application.js.
  Экспортирует класс Application.
  Обеспечивает основной функционал приложения.
*/
'use strict';

import Menu from "./menu.js";
import FileLoader from "./loader.js";
import WSConnection from "./socket.js";
import {CommentsContainer} from "./commentsContainer.js";
import {Drawer} from "./drawer.js";
import {createMask} from "./drawer.js";

const
  //Сообщение при попытке загрузить файл недопустимого формата:
  FILE_TYPE_ERROR_MESSAGE = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.',
  //Сообщение при попытке перетащить новый файл на имеющееся изображение:
  DROP_ERROR_MESSAGE = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню.',
  //Задержка вывода сообщения об ошибке:
  ERROR_MESSAGE_SHOW_DELAY = 10,
  //URL-адрес сервера приложения:
  MAIN_URL = 'https://netology-code.github.io/hj-26-malubimcev/';

//Класс Application: основной функционал приложения
export default class Application {
  
  constructor(container) {
    //Контейнер, в котором работает приложение:
    this.container = container;

    //графический элемент, отображающий процесс загрузки файла:
    this.imageLoader = container.querySelector('.image-loader');

    //текущее изображение:
    this.currentImage = container.querySelector('.current-image');

    this.pageData = null;//хранит данные состояния страницы
    this.imageId = '';//хранит идентификатор текущего изображения
    this.currentColor = 'green';//цвет рисования по-умолчанию
    this.page = MAIN_URL;//хранит адрес текущей страницы
    this.isUpdated = false;//признак обновленной страницы

    //графический элемент, отображающий сообщение об ошибке:
    this.error = container.querySelector('.error');
    this.errorMessage = container.querySelector('.error__message');

    //ссылка на объект меню:
    this.menu = new Menu(container.querySelector('.menu'), this);
    //ссылка на объект рисования:
    this.drawer = null;
    this.currentMode = '';//хранит имя текущего режима (состояние приложения)
    this.connection = null;//ссылка на объект веб-сокет-соединения
    this.commentsContainer = null;//ссылка на объект - контейнер комментариев 

    this.registerEvents();
  }

  registerEvents() {
    document.addEventListener('DOMContentLoaded', this.onPageLoad.bind(this), false);

    //Предотвращается открытие файла в браузере при перетаскивании:
    ['dragenter', 'dragover', 'drop'].forEach(eventName => {
      this.container.addEventListener(eventName, event => event.preventDefault(), false);
    });

    this.container.addEventListener('drop', this.onDrop.bind(this), false);
    this.currentImage.addEventListener('load', this.onImageLoad.bind(this), false);
  }

  //Обработчик события загрузки страницы (событие DOMContentLoaded)
  onPageLoad() {
    this.imageId = window.location.search.slice(4);
    if (this.imageId) {
      this.createWebSocketConnection();
    } else {
      this.setPublicationMode();
    }
  }

  //Метод createWebSocketConnection создает новое веб-сокет-соединение
  createWebSocketConnection() {
    if (!this.connection) {
      this.connection = new WSConnection(this);
    }
  }

  //Метод setPublicationMode устанавливает приложение в режим "Публикация"
  //Вызывается из обработчика onPageLoad текущего модуля после загрузки страницы
  setPublicationMode() {
    this.currentImage.src = '';
    this.drawer = null;
    this.commentsContainer = null;
    this.menu.setPublicationState();
    this.currentMode = 'publication';
  }

  //Метод setShareMode устанавливает приложение в режим "Поделиться"
  //Вызывается при клике на пункте меню "Поделиться" из модуля menu.js
  // или из обработчика onFileUploaded текущего модуля
  setShareMode() {
    this.menu.linkField.value = this.page;
    this.menu.setShareState();
    this.currentMode = 'share';
  }

  //Метод setCommentMode устанавливает приложение в режим "Комментарии"
  //Вызывается при клике на пункте меню "Комментарии" из модуля menu.js
  // или из обработчика onDrop текущего модуля
  setCommentMode(mode) {
    this.container.appendChild(this.commentsContainer.container);
    this.commentsContainer.showBoards(mode);
    this.menu.setCommentState();
    this.currentMode = 'comments';
  }

  //Метод setDrawMode устанавливает приложение в режим "Рисование"
  //Вызывается при клике на пункте меню "Рисование" из модуля menu.js
  setDrawMode() {
    this.container.appendChild(this.drawer.canvas);
    this.currentMode = 'draw';
  }

  //Метод setErrorMode устанавливает приложение в режим ошибки
  //Вызывается из обработчика onDrop текущего модуля
  setErrorMode(errMessage) {
    this.currentMode = 'error';
    this.imageLoader.style = 'display: none;';
    this.error.style = 'display: block;';
    this.errorMessage.textContent = errMessage;
  }

  //Метод hideError скрывает сообщение об ошибке
  //Вызывается из обработчика onDrop текущего модуля
  hideError(mode) {
    this.currentMode = mode;
    this.error.style = 'display: none;';
    this.errorMessage.textContent = '';
  }

  //Метод setColor устанавливает текущий цвет рисования
  //Вызывается при клике на значке цвета в палитре меню из модуля menu.js
  setColor(colorName) {
    this.currentColor = colorName;
    if (this.drawer) {
      this.drawer.setColor(this.currentColor);
    }
  }

  //Метод selectFile вызывает диалоговое окно выбора файла
  //Вызывается при клике на пункте меню "Загрузить новое" из модуля menu.js
  selectFile() {
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.setAttribute('accept', 'image/jpeg, image/png');
    fileInput.addEventListener('change', () => this.uploadFile(fileInput.files[0]), false);
    fileInput.click();
  }

  //Обработчик события перетаскивания файла изображения на страницу
  onDrop(event) {
    const file = event.dataTransfer.files[0];
    const mode = this.currentMode;
    const fileType = /^image\//;
    //действия по загрузк файла разрешены в режиме "Публикация":
    if (this.currentMode === 'publication' && !this.isUpdated) {
      //проверка наличия файла соответствующего формата:
      if (file && file.type.match(fileType)) {
        this.uploadFile(file);
      } else {
        //при выборе файла недопустимого формата:
        this.setErrorMode(FILE_TYPE_ERROR_MESSAGE);
      }
    } else {
      //при попытке перетащить файл на страницу не в режиме "Публикация":
      this.setErrorMode(DROP_ERROR_MESSAGE);
      //скрывается сообщение об ошибке через заданное время:
      setTimeout(() => this.hideError(mode), ERROR_MESSAGE_SHOW_DELAY * 1000);
    }
  }
  
  //Метод uploadFile загружает файл изображения на сервер
  //вызывается при выборе или перетаскивании нового файла изображения
  uploadFile(file) {
    this.isUpdated = false;//сбрасывает признак обновления страницы
    this.imageLoader.style = 'display: block;';//отображает загрузчик
    this.error.style = 'display: none;';//прячет сообщение об ошибке
    const formData = new FormData();
    formData.append('title', file.name);
    formData.append('image', file, file.name);
    const loader = new FileLoader(this);
    loader.upload(formData, '/pic', this.onFileUploaded.bind(this));
  }

  //Обработчик события загрузки файла на сервер
  //вызывается из метода uploadFile текущего модуля
  onFileUploaded(data) {
    this.setPageData(data);
    this.connection = null;
    this.createWebSocketConnection();
    history.pushState(null, null, this.page);//меняет адрес текущей страницы
    setTimeout(this.setShareMode.bind(this), 2 * 1000);//включает режим "Поделиться" после обновления страницы
  }
  
  //Метод setPageData сохраняет данные об изображении
  //вызывается из метода setImageSrc и обработчика onFileUploaded текущего модуля
  setPageData(data) {
    this.pageData = data;
    this.imageId = this.pageData.id;
    this.page = this.imageId ? (MAIN_URL + '?id=' + this.imageId) : MAIN_URL;
  }

  //Метод setImageSrc очищает страницу при загрузке нового изображения
  //вызывается из метода loadImageData текущего модуля
  setImageSrc(data) {
    this.setPageData(data);
    this.currentImage.src = data.url;//будет выполнен обработчик onImageLoad()
  }

  //Обработчик события загрузки изображения в элемент img
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

  //Метод clearPage очищает страницу при загрузке нового изображения
  //вызывается из обработчика onImageLoad текущего модуля
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

  //Метод uploadMask загружает маску на сервер
  //вызывается из модуля drawer.js
  uploadMask(img) {
    return new Promise((resolve, reject) => {
      this.connection.send(img);
      return resolve();
    });
  }

  //Метод addMask добавляет новую маску на изображение
  //вызывается из модуля socket.js при событии "mask"
  addMask(url) {
    createMask(this.currentImage)
      .then((mask) => {
        mask.addEventListener('load', () => {
          this.currentImage.parentElement.insertBefore(mask, this.error);
          this.drawer.clearCanvas();
        });
        mask.src = url;
      });
  }

  //Метод addComment добавляет новый комментарий в контейнер комментариев
  //Вызывается из модуля socket.js при событии "comment"
  addComment(commentObj) {
    this.commentsContainer.addComment(commentObj);
  }

  //Метод loadImageData загружает данные о текущем изображении
  //вызывается из модуля socket.js при событии "pic"
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

  //Метод updatePage обновляет страницу при получении данных об изображении
  //вызывается из обработчика onImageLoad в текущем модуле
  updatePage() {
    if (this.pageData.mask) {
      this.addMask(this.pageData.mask);
    }
    if (this.pageData.comments) {
      this.commentsContainer.addListOfComments(this.pageData.comments);
    }
  }
  
  //Метод setElementPositionToCenter позиционирует элемент в центре страницы
  //вызывается из модулей при создании элементов DOM
  setElementPositionToCenter(elem) {
    elem.style.left = '50%';
    elem.style.top = '50%';
    elem.style.position = 'absolute';
    elem.style.transform = 'translate(-50%, -50%)';
  }

}//end class