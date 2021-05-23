const Base = require("../base");
const mc = require('merge-change');
const {schema} = require('exser').utils;

class Role extends Base {

  define() {
    return mc.merge(super.define(), {
      title: 'Роль',
      indexes: {},
      // Свойства модели в JSONSchema. Используются функции для генерации фрагментов схем.
      properties: {
        name: schema.string({description: 'Кодовое название', minLength: 2, maxLength: 200}),
        title: schema.stringi18n({description: 'Заголовок', minLength: 2, maxLength: 200}),
        description: schema.stringi18n({description: 'Описание', default: '', maxLength: 100}),
        // Доп поля про доступы
      },
      required: ['name', 'title'],
    });
  }
}

module.exports = Role;
