'use strict';

export default class WSConnection {
  constructor(id) {
    this.URL = `wss://neto-api.herokuapp.com/pic/${id}`;
    this.ws = new WebSocket(this.URL);
    this.registerEvents();
  }

  registerEvents() {
    this.ws.addEventListener('message', onMessage);
    this.ws.addEventListener('open', () => console.log('ws connected'));
    this.ws.addEventListener('close', () => console.log('ws closed'));
    this.ws.addEventListener('error', (err) => console.log(`ws error: ${error.data}`));
    window.addEventListener('beforeUnload', () => this.ws.close(1000));
  }

  onMessage(event) {
    try {
      const msg = event.data;
      //
    } catch (err) {
      console.log(`ws message error: ${err.message}`)
    }
  }

}
