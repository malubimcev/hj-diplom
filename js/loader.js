/*
  Модуль loader.js.
  Экспортирует класс FileLoader.
  Обеспечивает обмен данными с сервером по протоколу http.
*/
'use strict';

//Класс FileLoader.
export default class FileLoader {

  constructor(app) {
    //URL-адрес сервера:
    this.mainURL = 'https://neto-api.herokuapp.com';
    //ссылка на родительский объект - приложение:
    this.app = app;
  }

  //Метод upload загружает данные на сервер.
  //При успешной отправке вызывает callback с полученными данными в формате json.
  //При ошибке вызывает метод setErrorMode родительского приложения.
  upload(data, url, callback) {
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
      .catch(err => this.app.setErrorMode(err.message));  
  }

  //Метод sendForm отправляет на сервер данные формы.
  //При успешной отправке вызывает callback с полученными данными в формате json.
  //При ошибке вызывает метод setErrorMode родительского приложения.
  sendForm(data, url, callback) {
    fetch(this.mainURL + url, {
      body: data,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
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

  //Метод loadData получает с сервера данные.
  //При успешном получении возвращает данные в формате json.
  //При ошибке вызывает метод setErrorMode родительского приложения.
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