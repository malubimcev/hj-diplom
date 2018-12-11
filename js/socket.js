'use strict';

const SEND_DELAY = 1000;//задержка отправки маск

export default class WSConnection {
  constructor(app) {
    this.app = app;
    this.URL = `wss://neto-api.herokuapp.com/pic/${this.app.imageId}`;
    this.ws = new WebSocket(this.URL);
    this.registerEvents();
  }

  registerEvents() {
    this.ws.addEventListener('message', this.onMessage.bind(this));
    this.ws.addEventListener('close', () => console.log('ws closed'));
    this.ws.addEventListener('error', (err) => console.log(`ws error: ${error.data}`));
    window.addEventListener('beforeUnload', () => this.ws.close(1000));
  }

  onMessage(event) {
    // console.log(`ws.event.data=${event.data}`);
    try {
      const msg = JSON.parse(event.data);
      console.log(`ws=${msg.event}`);
      switch(msg.event) {
        case 'pic':
          this.app.loadImage();
          break;
        case 'comment':
          this.app.addComment(msg.comment);
          break;
        case 'mask':
          this.app.addMask(msg.url);
          break;
        case 'error':
          console.log(`ws error: ${msg.message}`);
          break;
      }
    } catch (err) {
      console.log(`ws error: ${err.message}`)
    }
  }

  send(msg) {
    setTimeout(() => this.ws.send(msg), SEND_DELAY);
  }

}//end class