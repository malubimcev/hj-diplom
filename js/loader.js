'use strict';

export default class FileLoader {
  constructor(app) {
    this.mainURL = 'https://neto-api.herokuapp.com';
    this.app = app;
  }

  upload(data, url, type, callback) {
    fetch(this.mainURL + url, {
      body: data,
      method: 'POST',
      headers: {
        'Content-Type': type
      }
    })
      .then(res => {
        if (200 <= res.status && res.status < 300) {
          return res.json();
        }
        throw new Error(res.statusText);
      })
      .then(callback)
      .catch(err => this.app.setErrorMode(err.message));  
  }

  // upload(data, url, type, callback) {
  //   const xhr = new XMLHttpRequest();
  //   xhr.addEventListener('load', (res) => {
  //     if (200 <= res.status && res.status < 300) {
  //       callback();
  //       return;
  //     }
  //     this.app.setErrorMode(res.statusText);
  //   });
  //   xhr.addEventListener('error', () => this.app.setErrorMode(xhr.error));
  //   xhr.open('POST', this.mainURL + url, true);
  //   xhr.setRequestHeader('Content-Type', type);
  //   xhr.send(data);
  // }

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