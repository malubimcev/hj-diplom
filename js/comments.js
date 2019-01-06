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

function createComment(commentInfo) {
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

class CommentBoard {
  constructor(container, app) {
    this.board = createBoard();
    this.app = app;
    this.board.style.zIndex = container.style.zIndex + 1;
    container.appendChild(this.board);
    this.addButton = this.board.querySelector('.comments__submit');
    this.closeButton = this.board.querySelector('.comments__close');
    this.commentInput = this.board.querySelector('.comments__input');
    this.body = this.board.querySelector('.comments__body');
    this.commentLoader = this.board.querySelector('.comment div');

    this.registerEvents();
  }

  registerEvents() {
    this.closeButton.addEventListener('click', this.close.bind(this), false);
    this.addButton.addEventListener('click', this.sendComment.bind(this), false);
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

}//end class CommentBoard

export class CommentsContainer {

  constructor(app) {
    this.app = app;
    this.container = document.createElement('div');
    this.container.classList.add('comments-container');

    app.container.insertBefore(this.container, app.error);
    this.container.style.width = `${app.currentImage.offsetWidth}px`;
    this.container.style.height = `${app.currentImage.offsetHeight}px`;
    this.container.style.left = '50%';
    this.container.style.top = '50%';
    this.container.style.position = 'absolute';
    this.container.style.transform = 'translate(-50%, -50%)';
    this.registerEvents();
  }

  registerEvents() {
    this.container.addEventListener('click', this.onClick.bind(this), false);
  }
  
  addBoard(coords) {
    const commentBoard = new CommentBoard(this.container, this.app);
    commentBoard.board.style.left = `${coords.left - this.container.left}px`;
    commentBoard.board.style.top = `${coords.top - this.container.top}px`;
    return commentBoard;
  }
  
  addComment(commentObj) {
    commentObj.left += parseInt(this.container.style.left);
    commentObj.top += parseInt(this.container.style.top);
    let elem = document.elementFromPoint(commentObj.left + 5, commentObj.top + 5);
    if (elem.className !== 'comments__body') {
      const form = this.addBoard({
        'left': commentObj.left,
        'top': commentObj.top
      });
      elem = form.board.querySelector('.comments__body');
    }

    const comment = createComment(commentObj);
    const refNode = elem.querySelector('.comment div');
    elem.insertBefore(comment, refNode.parentElement);
  }
  
  removeAll() {
    const commentBoards = this.container.querySelectorAll('.comments__form');
    for (const board of commentBoards) {
      this.container.removeChild(board);
    }
    this.app.container.removeChild(this.container);
  }

  onClick(event) {
    if (this.app.currentMode === 'comments') {
      if (event.target.className === 'comments-container') {
        this.addBoard({
          'left': event.pageX,
          'top': event.pageY
        });
      }
    }
  }

  show(mode) {
    const forms = this.container.querySelectorAll('.comments__form');
    const formElements = this.container.querySelectorAll('.comments__form *');
    for (const frm of forms) {
      frm.style.zIndex = mode === 'on' ? 2 : 0;
    }
    for (const elem of formElements) {
      elem.style = mode === 'on' ? 'visibility: visible;' : 'visibility: hidden;';
    }
  }

}//end class CommentsContainer