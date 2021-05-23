const Base = require("../base");
const mc = require('merge-change');
const {schema} = require('exser').utils;

class Node extends Base {

  define() {
    return mc.merge(super.define(), {
      title: 'Узел',
      indexes: {},
      // Свойства модели в JSONSchema. Используются функции для генерации фрагментов схем.
      properties: {
        name: schema.string({description: 'Кодовое название', maxLength: 255}),
        prev: schema.rel({model: 'node', description: 'Предыдущий узел'}),
        next: schema.rel({model: 'node', description: 'Следующий узел'}),
        attr: schema.object({
          description: 'Атрибуты узла',
          properties: {},
          additionalProperties: true,
        })
      },
      required: ['name'],
    });
  }
}

module.exports = Node;
