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
    this.ws.addEventListener('close', () => console.log('ws closed'));
    this.ws.addEventListener('error', (err) => console.log(`ws error: ${error.data}`));
    window.addEventListener('beforeUnload', () => this.ws.close(1000));
  }

  onMessage(event) {
    try {
      const msg = JSON.parse(event.data);
      switch(msg.event) {
        case 'pic':
          this.app.loadImageData();
          break;
        case 'comment':
          this.app.addComment(msg.comment);
          break;
        case 'mask':
          this.app.addMask(msg.url);
          break;
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