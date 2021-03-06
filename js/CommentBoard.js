/*
  Модуль CommentBoard.js.
  Экспортирует класс CommentBoard.
  Обеспечивает функционал формы ввода данных.
*/
'use strict';

import FileLoader from "./loader.js";

//Внутренняя функция-сборщик для создания формы:
function createCommentsForm() {
  const form = document.createElement('form');
  form.classList.add('comments__form');

  const marker = document.createElement('span');
  marker.classList.add('comments__marker');

  const markerInput = document.createElement('input');
  markerInput.setAttribute('type', 'checkbox');
  markerInput.classList.add('comments__marker-checkbox');

  const body = document.createElement('div');
  body.classList.add('comments__body');

  const loaderWrap = document.createElement('div');
  loaderWrap.classList.add('comment');

  const loader = document.createElement('div');
  for (let i = 0; i < 5; i++) {
    const span = document.createElement('span');
    loader.appendChild(span);
  }
  loaderWrap.appendChild(loader);

  const commentInput = document.createElement('textarea');
  commentInput.setAttribute('type', 'text');
  commentInput.setAttribute('placeholder', 'Напишите ответ...');
  commentInput.classList.add('comments__input');

  const closeBtn = document.createElement('input');
  closeBtn.classList.add('comments__close');
  closeBtn.setAttribute('type', 'button');
  closeBtn.value = 'Закрыть';

  const sendBtn = document.createElement('input');
  sendBtn.classList.add('comments__submit');
  sendBtn.setAttribute('type', 'button');
  sendBtn.value = 'Отправить';

  body.appendChild(loaderWrap);
  body.appendChild(commentInput);
  body.appendChild(closeBtn);
  body.appendChild(sendBtn);

  form.appendChild(marker);
  form.appendChild(markerInput);
  form.appendChild(body);

  return form;
}

//Внутренняя функция-сборщик для создания комментария:
function createComment(commentInfo) {
  const timestamp = document.createElement('p');
  timestamp.classList.add('comment__time');
  const date = new Date(commentInfo.timestamp);
  timestamp.textContent = date.toLocaleString('ru-RU');

  const message = document.createElement('p');
  message.classList.add('comment__message');
  message.innerText = commentInfo.message;

  const comment = document.createElement('div');
  comment.classList.add('comment');

  comment.appendChild(timestamp);
  comment.appendChild(message);
  comment.style.left = commentInfo.left;
  comment.style.top = commentInfo.top;

  return comment;
}

//Класс CommentBoard
//Представляет объект, хранящий форму ввода комментариев
// и обеспечивающий ее функционал.
export class CommentBoard {

  constructor(parent) {
    this.form = createCommentsForm();
    this.parent = parent;//ссылка на родительский объект (commentsContainer)
    this.form.style.zIndex = parent.container.style.zIndex + 1;
    parent.container.appendChild(this.form);

    //элементы формы:
    this.marker = this.form.querySelector('.comments__marker');
    this.markerInput = this.form.querySelector('.comments__marker-checkbox');
    this.addButton = this.form.querySelector('.comments__submit');
    this.closeButton = this.form.querySelector('.comments__close');
    this.commentInput = this.form.querySelector('.comments__input');
    this.body = this.form.querySelector('.comments__body');
    this.commentLoader = this.form.querySelector('.comment div');

    this.isEmpty = true;//признак отсутствия комментариев в форме

    this.registerEvents();
  }

  registerEvents() {
    this.closeButton.addEventListener('click', this.hideBody.bind(this), false);
    this.addButton.addEventListener('click', this.sendComment.bind(this), false);
    this.form.addEventListener('click', (event) => {
      if (event.target.className === 'comments__marker-checkbox') {
        this.parent.hideBoards();
        this.showBody();
      }
    }, false);
  }

  //Метод addComment добавляет комментарий в форму
  addComment(commentObject) {
    const comment = createComment(commentObject);
    this.body.insertBefore(comment, this.commentLoader.parentElement);
    this.isEmpty = false;
  }

  //Метод sendComment отправляет комментарий на сервер
  //Вызывается при клике на кнопке "Отправить" в форме
  sendComment(event) {
    const message = this.commentInput.value.trim();
    if (!message) {
      return;
    }
    event.preventDefault();
    //создание объекта с информацией о комментарии: координаты текущей формы и содержимое комментария
    const commentInfoObj = {
    	'left': parseInt(this.form.style.left),
    	'top': parseInt(this.form.style.top),
    	'message': message
    }
    this.commentInput.value = '';//очистка поля ввода комментария
    let props = [];//массив для данных комментария в формате "ключ-значение"
    for (const key in commentInfoObj) {
    	props.push(key + '=' + commentInfoObj[key]);
    }

    //строка для отправки в формате 'application/x-www-form-urlencoded':
    const requestString = props.join('&');

    //для отправки используется объект FileLoader
    const fileLoader = new FileLoader(this.parent.app);
    const url = '/pic/' + this.parent.app.imageId + '/comments';
    this.commentLoader.classList.add('loader');

    //отправка, после чего скрывается лоадер
    fileLoader.sendForm(requestString, url, (data) => {
    	this.commentLoader.classList.remove('loader');
    });
  }

  //Метод hide скрывает текущую форму вместе с маркером
  hide() {
    this.form.classList.remove('comments__visible');
    this.marker.classList.remove('comments__visible');
    this.form.classList.add('comments__hidden');
    this.marker.classList.add('comments__hidden');  
  }

  //Метод show показывает текущую форму и маркер
  show() {
    this.form.classList.remove('comments__hidden');
    this.marker.classList.remove('comments__hidden');
    this.form.classList.add('comments__visible');
    this.marker.classList.add('comments__visible');  
  }

  //Метод hideBody скрывает только форму, оставляя или показывая маркер
  // в зависимости от режима переключателя "Скрыть/Показать"
  hideBody() {
    if (this.isEmpty) {
      this.hide();
    } else {
      this.markerInput.checked = false;
    }
  }

  //Метод showBody показывает текущую форму,
  // в зависимости от режима переключателя "Скрыть/Показать"
  showBody() {
    this.markerInput.checked = true;
  }

}//end class CommentBoard