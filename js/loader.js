'use strict';

export default class FileLoader {
  constructor() {
    this.connection = null;
    this.mainURL = 'https://neto-api.herokuapp.com';
    this.registerEvents();
  }

  registerEvents() {
    //
  }

  update(data, url, callback) {
    fetch(this.mainURL + url, {
      body: data,
      method: 'POST'
    })
      .then(res => {
        if (200 <= res.status && res.status < 300) {
          return res.json();
        }
        throw new Error(res.statusText);
      })
      .then(callback)
      .catch(err => app.setErrorMode(err.message));  
  }

  loadData(url) {
    return fetch(this.mainURL + url)
      .then(res => {
        if (200 <= res.status && res.status < 300) {
          return res.json();
        }
        throw new Error(res.statusText);
      })
      .catch(err => app.setErrorMode(err.message));
  }

}
