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
    this.form = createCommentsForm();
    this.app = app;
    this.form.style.zIndex = container.style.zIndex + 1;
    container.appendChild(this.form);
    this.marker = this.form.querySelector('.comments__marker');
    this.addButton = this.form.querySelector('.comments__submit');
    this.closeButton = this.form.querySelector('.comments__close');
    this.commentInput = this.form.querySelector('.comments__input');
    this.body = this.form.querySelector('.comments__body');
    this.commentLoader = this.form.querySelector('.comment div');

    this.registerEvents();
  }

  registerEvents() {
    this.closeButton.addEventListener('click', this.hide.bind(this), false);
    this.addButton.addEventListener('click', this.sendComment.bind(this), false);
  }

  addComment(comment) {
    this.body.insertBefore(comment, this.commentLoader.parentElement);
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
    this.form.style = 'display: none;';
    this.marker.style = 'display: none;';
  }

  show() {
    this.form.style = 'display: block;';
    this.marker.style = 'display: block;';
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
    this.app.setElementPositionToCenter(this.container);

    this.boards = [];

    this.registerEvents();
  }

  registerEvents() {
    this.container.addEventListener('click', this.onClick.bind(this), false);
  }
  
  addBoard(coords) {
    const commentBoard = new CommentBoard(this.container, this.app);
    commentBoard.form.style.left = `${Math.round(coords.left)}px`;
    commentBoard.form.style.top = `${Math.round(coords.top)}px`;
    this.boards.push(commentBoard);
    return commentBoard;
  }
  
  addComment(commentObj) {
    this.transformCoords(commentObj, 1);

    const comment = createComment(commentObj);

    let commentsBoard = this.boards.find(board => {
      const rect = board.form.getBoundingClientRect();
      if (rect.left === commentObj.left && rect.top === commentObj.top) {
        return board;
      }
    });
    if (!commentsBoard) {
      commentsBoard = this.addBoard({
        'left': commentObj.left,
        'top': commentObj.top
      })
    }
    commentsBoard.addComment(comment);
  }

  addListOfComments(commentsList) {
    const commentObjects = [];

    for (const key in commentsList) {
      commentObjects.push(commentsList[key]);
    }
    const commentCoords = commentObjects.map(obj => `${obj.left}:${obj.top}`);
    const formCoords = [...new Set(commentCoords)];
    formCoords
      .map(coord => [...coord.split(':')])
      .forEach(coord => this.addBoard({
        'left': coord[0],
        'top': coord[1]
      }));

    commentObjects.forEach(obj => {
      this.addComment(obj);
    });
  }
  
  removeAll() {
    // const commentBoards = this.container.querySelectorAll('.comments__form');
    // for (const board of commentBoards) {
    //   this.container.removeChild(board);
    // }
    this.boards.forEach(board => {
      this.container.removeChild(board.form);
      board = null;
    });
    this.app.container.removeChild(this.container);
  }

  onClick(event) {
    if (this.app.currentMode === 'comments') {
      if (event.target.className === 'comments-container') {
        const coords = {
          'left': event.pageX,
          'top': event.pageY
        }
        this.transformCoords(coords, -1);
        this.addBoard(coords);
      }
    }
  }

  transformCoords(coords, sign) {
    coords.left = coords.left + sign * this.container.getBoundingClientRect().left;
    coords.top = coords.top + sign * this.container.getBoundingClientRect().top;    
  }

  show(mode) {
    this.boards.forEach(board => {
      mode === 'on' ? board.show() : board.hide();
    });
    // const forms = this.container.querySelectorAll('.comments__form');
    // const formElements = this.container.querySelectorAll('.comments__form *');
    // for (const frm of forms) {
    //   frm.style.zIndex = mode === 'on' ? 1 : 0;
    // }
    // for (const elem of formElements) {
    //   elem.style = mode === 'on' ? 'visibility: visible;' : 'visibility: hidden;';
    //   if (elem.className === 'comments__marker') {
    //     elem.style = 'display: block;';
    //   }
    // }
  }

}//end class CommentsContainer