'use strict';

class Comment {
  constructor(commentInfo) {
    const time = document.createElement('p');
    time.classList.add('comment__time');
    time.textContent = commentInfo.timestamp;
    const message = document.createElement('p');
    message.classList.add('comment__message');
    message.textContent = commentInfo.message;
    this.comment = document.createElement('div');
    this.comment.classList.add('comment');
    this.comment.appendChild(time);
    this.comment.appendChild(message);
    this.comment.style.left = commentInfo.left;
    this.comment.style.top = commentInfo.top;
  }
}

export default class CommentBoard {
  constructor(container) {
    this.board = container;
    this.addButton = this.board.querySelector('.comments__submit');
    this.closeButton = this.board.querySelector('.comments__close');
    this.commentInput = this.board.querySelector('.comments__input');
    this.body = this.board.querySelector('.comments__body');

    this.registerEvents();
  }

  registerEvents() {
    this.addButton.addEventListener('click', this.close.bind(this));
    this.submitButton.addEventListener('click', this.sendComment.bind(this));
  }

  sendComment() {
    let formData = new FormData(this.board);
    formData.append('left', this.board.style.left);
    formData.append('top', this.board.style.top);
    formData.append('message', this.commentInput.textContent);
    const loader = new FileLoader();
    const url = '/pic/' + app.getPicId() + '/comments'
    loader.update(formData, url, (data) => {
      this.currentImage.src = data.url;
      this.imageId = data.id;
      this.setShareMode();
    });
  }

  close() {
    //
  }

  addComment(commentObj) {
    const comment = new Comment(commentObj);
    this.body.appendChild(comment);
  }

}