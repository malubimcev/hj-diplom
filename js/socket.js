/*
  Модуль socket.js обеспечивает работу соединения по протоколу web-socket.
  Экспортирует класс WSConnection.
*/
'use strict';

//Класс WSConnection
export default class WSConnection {
  constructor(app) {
    //ссылка на родительское приложение:
    this.app = app;
    //URL-адрес сервера:
    this.URL = `wss://neto-api.herokuapp.com/pic/${this.app.imageId}`;
    //объект web-socket соединения:
    this.ws = new WebSocket(this.URL);
    this.registerEvents();
  }

  registerEvents() {
    this.ws.addEventListener('message', this.onMessage.bind(this));
    this.ws.addEventListener('close', () => console.log('ws closed'));
    this.ws.addEventListener('error', (err) => console.log(`ws message error: ${error.data}`));
    window.addEventListener('beforeUnload', () => this.ws.close(1000));
  }

  //Обработчик событий web-socket соединения.
  //Вызывает методы родительского приложения.
  onMessage(event) {
    try {
      const msg = JSON.parse(event.data);
      switch(msg.event) {
        //событие при получении информации о редактируемом изображении:
        case 'pic':
          this.app.loadImageData();
          break;
        //событие при получении информации о комментарии:
        case 'comment':
          this.app.addComment(msg.comment);
          break;
        //событие при получении информации о маске изображения:
        case 'mask':
          this.app.addMask(msg.url);
          break;
        //событие при ошибке:
        case 'error':
          console.log(`ws event error: ${msg.message}`);
          break;
      }
    } catch (err) {
      console.log(`ws error: ${err.message}`)
    }
  }

  send(msg) {
    this.ws.send(msg);
  }

}//end class