'use strict';

export default class FileLoader {
  constructor(app) {
    this.mainURL = 'https://neto-api.herokuapp.com';
    this.app = app;
  }

  upload(data, url, callback) {
    fetch(this.mainURL + url, {
      body: data,
      method: 'POST'
    })
      .then(res => {
        console.log(res);
        if (200 <= res.status && res.status < 300) {
          return res.json();
        }
        throw new Error(res.statusText);
      })
      .then(callback)
      .catch(err => this.app.setErrorMode(err.message));  
  }

  loadData(url) {
    return fetch(this.mainURL + url)
      .then(res => {
        if (200 <= res.status && res.status < 300) {
          return res.json();
        }
        throw new Error(res.statusText);
      })
      .catch(err => this.app.setErrorMode(err.message));
  }

}