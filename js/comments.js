'use strict';

import FileLoader from "./loader.js";

function createBoard() {
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

export function createComment(commentInfo) {
  const timestamp = document.createElement('p');
  timestamp.classList.add('comment__time');
  const date = new Date(commentInfo.timestamp);
  timestamp.textContent = date.toLocaleString('ru-RU');

  const message = document.createElement('p');
  message.classList.add('comment__message');
  message.textContent = commentInfo.message;

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
    this.board = createBoard();
    this.app = app;
    container.appendChild(this.board);
    this.addButton = this.board.querySelector('.comments__submit');
    this.closeButton = this.board.querySelector('.comments__close');
    this.commentInput = this.board.querySelector('.comments__input');
    this.body = this.board.querySelector('.comments__body');
    this.commentLoader = this.board.querySelector('.comment div');

    this.registerEvents();
  }

  registerEvents() {
    this.closeButton.addEventListener('click', this.close.bind(this));
    this.addButton.addEventListener('click', this.sendComment.bind(this));
  }

  sendComment(event) {
  	event.preventDefault();
    const commentInfoObj = {
    	'left': parseInt(this.board.style.left),
    	'top': parseInt(this.board.style.top),
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

  close() {
    this.body.style = 'display: none;';
  }

  addComment(commentObj) {
    const comment = createComment(commentObj);
    this.body.insertBefore(comment, this.commentLoader);
  }

}