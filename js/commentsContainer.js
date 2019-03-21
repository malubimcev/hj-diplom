/*
  Модуль commentsContainer.js.
  Экспортирует класс CommentsContainer.
  Обеспечивает функционал контейнера для форм комментариев.
*/
'use strict';

import {CommentBoard} from "./CommentBoard.js";

//Класс CommentsContainer
//Представляет объект контейнера для форм с комментариями
export class CommentsContainer {

  constructor(app) {
    //Ссылка народительское приложение:
    this.app = app;
    //ссылка на DOM-элемент, контейнер для форм
    this.container = document.createElement('div');
    this.container.classList.add('comments-container');

    //Создается DOM-элемент контейнера,
    //он принимает размеры изображения и позиционируется над ним
    this.app.container.insertBefore(this.container, app.error);
    this.container.style.width = `${app.currentImage.offsetWidth}px`;
    this.container.style.height = `${app.currentImage.offsetHeight}px`;
    this.app.setElementPositionToCenter(this.container);

    //хранилище объектов-форм с комментариями
    this.boards = [];

    this.registerEvents();
  }

  registerEvents() {
    this.container.addEventListener('click', this.onClick.bind(this), false);
  }
  
  //Метод addBoard добавляет форму в текущий контейнер
  // и возвращает ссылку на созданный объект 
  addBoard(coords) {
    const commentBoard = new CommentBoard(this);
    commentBoard.form.style.left = `${Math.round(coords.left)}px`;
    commentBoard.form.style.top = `${Math.round(coords.top)}px`;
    //созданный объект формы запоминается в хранилище:
    this.boards.push(commentBoard);
    commentBoard.show();
    return commentBoard;
  }

  //Метод addComment создает и добавляет новый комментарий в форму
  addComment(commentObj) {
    //приведение координат комментария к системе контейнера:
    this.transformCoords(commentObj, 1);

    //Поиск формы с заданными координатами в хранилище форм:
    let commentBoard = this.boards.find(board => {
      const rect = board.form.getBoundingClientRect();
      if (rect.left === commentObj.left && rect.top === commentObj.top) {
        return board;
      }
    });
    //если форма не найдена, она создается:
    if (!commentBoard) {
      commentBoard = this.addBoard({
        'left': commentObj.left,
        'top': commentObj.top
      });
    }

    commentBoard.addComment(commentObj);
  }

  //Метод addListOfComments добавляет набор комментариев в формы контейнера
  //Вызывается из приложения после загрузки информации о странице с текущим изображением
  addListOfComments(commentsList) {
    const commentObjects = [];

    for (const key in commentsList) {
      commentObjects.push(commentsList[key]);
    }
    //Координаты всех комментариев преобразуются в однострочные в формате "left:top"
    const commentCoords = commentObjects.map(obj => `${obj.left}:${obj.top}`);

    //Создается массив, содержащий только уникальные строки координат,
    // используя свойства объекта Set:
    const formCoords = [...new Set(commentCoords)];
    //В результате в массиве formCoords содержатся коордиранты форм

    //Координаты форм преобразуются в массивы вида [left, top] 
    formCoords
      .map(coord => [...coord.split(':')])
      //после этого создаются формы:
      .forEach(coords => this.addBoard({
        'left': coords[0],
        'top': coords[1]
      }));

    commentObjects.forEach(obj => {
      this.addComment(obj);
    });
  }

  //Метод removeAll удаляет все формы из контейнера
  removeAll() {
    this.boards.forEach(board => this.removeBoard(board));
    this.boards = [];
    this.app.container.removeChild(this.container);
  }

  //Метод removeBoard удаляет конкретную форму из контейнера
  removeBoard(board) {
    this.container.removeChild(board.form);
    this.boards.pop();//объект формы также удаляется из хранилища
  }

  //Обработчик клика мышью в области контейнера
  //Создает новую форму в режиме "Комментарии"
  onClick(event) {
    if (this.app.currentMode === 'comments' && event.target.className === 'comments-container') {
      const coords = {
        'left': event.pageX,
        'top': event.pageY
      }
      this.transformCoords(coords, -1);
      if (this.boards.length > 0) {
        this.removeEmptyBoards();
      }
      const newBoard = this.addBoard(coords);
      this.showBoard(newBoard);
      newBoard.showBody();
    }
  }

  //Метод transformCoords пересчитывает координаты для перевода
  // в систему координат окна или контейнера
  transformCoords(coords, sign) {
    coords.left = coords.left + sign * this.container.getBoundingClientRect().left;
    coords.top = coords.top + sign * this.container.getBoundingClientRect().top;
  }

  //Метод showBoards показывает все формы в контейнере
  // в зависимости от прееключателя "Скрыть"/"Показать" в меню
  showBoards(mode) {
    this.boards.forEach(board => mode === 'on' ? board.show() : board.hide());
  }

  //Метод hideBoards скрывает все формы в контейнере
  hideBoards() {
    this.boards.forEach(board => board.hideBody());
  }

  //Метод showBoard делаеь форму видимой
  showBoard(board) {
    this.hideBoards();
    board.show();
  }

  //Метод removeEmptyBoards удаляет пустые формы, не содержащие комментариев
  removeEmptyBoards() {
    this.boards.forEach(board => {
      if (board.isEmpty) {
        this.removeBoard(board);
      }
    });
  }

}//end class CommentsContainer