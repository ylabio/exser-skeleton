const Model = require('exser').Model;
const {schema} = require('exser').utils;
const mc = require('merge-change');

class Base extends Model {
  define() {
    // Наследуются схема модели exser
    return mc.merge(super.define(), schema.model({
      // Заголовок модели в документации
      title: 'Базовая модель',
      // Название коллекции в mongodb
      collection: this.name(),
      // Индексы коллекции mongodb.
      // @see https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/#mongodb-method-db.collection.createIndex
      indexes: {
        //key: [{_key: 1}, {'unique': true, partialFilterExpression: {_key: {$exists: true}}}],
        // keyName: [{'propertyName': 1}, {'unique': true}],
      },
      // Опции коллекции mongodb
      options: {},
      // Свойства модели в JSONSchema. Используются функции для генерации фрагментов схем из exser.utils.schema
      properties: {
        //_key: schema.string({description: 'Вторичный постоянный ключ'})

        // Можно удалить свойства наследуемой модели
        //$unset: ['dateUpdate']
      },
      required: [],
    }));
  }
}

module.exports = Base;