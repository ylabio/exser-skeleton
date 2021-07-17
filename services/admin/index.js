const {Service, utils} = require('exser');
const express = require('express');
const {absolutePath} = require('exser-admin-dist');

class AdminService extends Service {

  async init(config, services) {
    await super.init(config, services);
    this.annotation = {
      show: this.config.show,
      views: {}
    };
    await this.initViews(this.config.views);
    return this;
  }

  /**
   * Инициализация роутов на админку
   * Вызывается в сервисе rest-api в колбэке atFirst
   * Роуты отдаются html, файлы ресурсов и json аннотации
   * @param app {Express}
   * @return {Promise<void>}
   */
  async initRouter(app) {
    const restApi = await this.services.getRestApi();
    const adminPublic = absolutePath();
    const html = this.render();

    app.get(this.config.baseUrl + '/annotation.json', (req, res) => {
      res.json(this.annotation);
    });

    // index.html for basename
    app.get(new RegExp(`${utils.strings.escapeRegex(this.config.baseUrl)}\/?$`), (req, res) => {
      res.send(html);
    });
    app.get(this.config.baseUrl + '/index.html', (req, res) => {
      res.send(html);
    });
    // assets (exist files)
    app.use(this.config.baseUrl, express.static(adminPublic));
    // index.html for any urls
    app.get(this.config.baseUrl + '/*', (req, res) => {
      res.send(html);
    });
    console.log(`Admin panel: ${restApi.config.url}${this.config.baseUrl}`);
  }

  /**
   * Разметка index.html
   * Подставляется basename из конфига и передаётся url на аннотацию
   * @return {string}
   */
  render() {
    return `
      <!doctype html>
      <html xml:lang="ru" lang="ru">
      <head>
          <title>Admin</title>
          <meta http-equiv="Content-type" content="text/html; charset=utf-8">
          <base href="${this.config.baseUrl ? this.config.baseUrl + '/' : ''}">
          <script defer="defer" src="main.js"></script>
          <link href="main.css" rel="stylesheet">
      </head>
      <body>
      <div id="app"></div>
      <script>window.onload = function () {
        ExserAdmin.start('app', {navigation:{basename: '${this.config.baseUrl ? this.config.baseUrl + '/' : ''}'}});
      };</script>
      </body>
      </html>    
    `;
  }

  initViews(views) {
    const keys = Object.keys(views);
    for (const key of keys) {
      views[key](this, this.services);
    }
  }

  addView(schema) {
    const path = `${schema.place}=${schema.name}`;
    this.annotation.views[path] = schema;
    this.annotation.views[path].path = path;
    return this.annotation.views[path];
  }

  page(name, schema) {
    return this.addView({place: 'page', name, ...schema});
  }

  side(name, schema) {
    return this.addView({place: 'side', name, ...schema});
  }

  modal(name, schema) {
    return this.addView({place: 'modal', name, ...schema});
  }

  panel(name, schema) {
    return this.addView({place: 'panel', name, ...schema});
  }

  footer(name, schema) {
    return this.addView({place: 'footer', name, ...schema});
  }

  head(name, schema) {
    return this.addView({place: 'head', name, ...schema});
  }
}

module.exports = AdminService;
