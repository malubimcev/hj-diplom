'use strict';

import FileLoader from "./loader.js";

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

export class CommentBoard {
  constructor(container, app) {
    this.form = createCommentsForm();
    this.app = app;
    this.form.style.zIndex = container.style.zIndex + 1;
    container.appendChild(this.form);

    this.marker = this.form.querySelector('.comments__marker');
    this.markerInput = this.form.querySelector('.comments__marker-checkbox');
    this.addButton = this.form.querySelector('.comments__submit');
    this.closeButton = this.form.querySelector('.comments__close');
    this.commentInput = this.form.querySelector('.comments__input');
    this.body = this.form.querySelector('.comments__body');
    this.commentLoader = this.form.querySelector('.comment div');

    this.isEmpty = true;

    this.registerEvents();
  }

  registerEvents() {
    this.closeButton.addEventListener('click', this.hideBody.bind(this), false);
    this.addButton.addEventListener('click', this.sendComment.bind(this), false);
  }

  addComment(commentObject) {
    const comment = createComment(commentObject);
    this.body.insertBefore(comment, this.commentLoader.parentElement);
    this.isEmpty = false;
  }

  sendComment(event) {
  	event.preventDefault();
    const commentInfoObj = {
    	'left': parseInt(this.form.style.left),
    	'top': parseInt(this.form.style.top),
    	'message': this.commentInput.value
    }
    this.commentInput.value = '';
    let props = [];
    for (const key in commentInfoObj) {
    	props.push(key + '=' + commentInfoObj[key]);
    }
    const requestString = props.join('&');

    const fileLoader = new FileLoader(this.app);
    const url = '/pic/' + this.app.imageId + '/comments';
    this.commentLoader.classList.add('loader');

    fileLoader.sendForm(requestString, url, (data) => {
    	this.commentLoader.classList.remove('loader');
    });
  }

  hide() {
    this.form.classList.add('comments__hidden');
    this.marker.classList.add('comments__hidden');  
  }

  show() {
    this.form.classList.remove('comments__hidden');
    this.marker.classList.remove('comments__hidden');    
  }

  hideBody() {
    if (!this.isEmpty) {
      this.markerInput.checked = false;
    } else {
      this.hide();
    }
  }

  showBody() {
    this.markerInput.checked = true;
  }

}//end class CommentBoard