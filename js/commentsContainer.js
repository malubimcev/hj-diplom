'use strict';

import {CommentBoard} from "./CommentBoard.js";

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
    // commentBoard.show();
    return commentBoard;
  }
  
  addComment(commentObj) {
    this.transformCoords(commentObj, 1);

    let commentBoard = this.boards.find(board => {
      const rect = board.form.getBoundingClientRect();
      if (rect.left === commentObj.left && rect.top === commentObj.top) {
        return board;
      }
    });

    if (!commentBoard) {
      commentBoard = this.addBoard({
        'left': commentObj.left,
        'top': commentObj.top
      });
    }

    commentBoard.addComment(commentObj);
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
      .forEach(coords => this.addBoard({
        'left': coords[0],
        'top': coords[1]
      }));

    commentObjects.forEach(obj => {
      this.addComment(obj);
    });
  }
  
  removeAll() {
    this.boards.forEach(board => removeBoard(board));
    this.boards = [];
    this.app.container.removeChild(this.container);
  }

  removeBoard(board) {
    // this.boards.pop();
    this.container.removeChild(board.form);
    board = null;
  }

  onClick(event) {
    if (this.app.currentMode === 'comments' && event.target.className === 'comments-container') {
      const coords = {
        'left': event.pageX,
        'top': event.pageY
      }
      this.transformCoords(coords, -1);
      this.removeEmptyBoards();
      const newBoard = this.addBoard(coords);
      this.hideBoards();
      this.showBoard(newBoard);
    }
  }

  transformCoords(coords, sign) {
    coords.left = coords.left + sign * this.container.getBoundingClientRect().left;
    coords.top = coords.top + sign * this.container.getBoundingClientRect().top;    
  }

  showBoards(mode) {
    this.boards.forEach(board => mode === 'on' ? board.show() : board.hide());
  }

  hideBoards() {
    this.boards.forEach(board => board.hideBody());
  }

  showBoard(board) {
    board.showBody();
  }

  removeEmptyBoards() {
    this.boards.forEach(board => board.isEmpty ? this.removeBoard(board));
  }

}//end class CommentsContainer