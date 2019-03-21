/*
  Модуль solution.js.
  Загружается в конце загрузки веб-страницы из файла index.html.
  Создает объект приложения Application.
*/
'use strict';

import Application from './application.js';

const app = new Application(document.querySelector('.app'));