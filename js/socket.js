'use strict';

export default class WSConnection {
  constructor(app) {
    this.app = app;
    this.URL = `wss://neto-api.herokuapp.com/pic/${this.app.imageId}`;
    this.ws = new WebSocket(this.URL);
    this.registerEvents();
  }

  registerEvents() {
    this.ws.addEventListener('message', this.onMessage.bind(this));
    this.ws.addEventListener('open', () => console.log('ws connected'));
    this.ws.addEventListener('close', () => console.log('ws closed'));
    this.ws.addEventListener('error', (err) => console.log(`ws error: ${error.data}`));
    window.addEventListener('beforeUnload', () => this.ws.close(1000));
  }

  onMessage(event) {
    console.log(`ws.event.data=${event.data}`);
    try {
      const msg = event.data;
      switch(msg['event']) {
        case 'pic':
          console.log(`msg.pic.title=${msg.pic}`);
          this.app.loadImage();
          break;
        case 'comment':
          this.app.addComment(msg.comment);
          break;
        case 'mask':
          console.log(`msg.mask=${msg.mask}`);
          this.app.addMask(msg.mask);
          break;
        case 'error':
          console.log(`ws error: ${msg.message}`);
          break;
      }
    } catch (err) {
      console.log(`ws message error: ${err.message}`)
    }
  }

  send(msg) {
    this.ws.send(msg);
  }

}//end class