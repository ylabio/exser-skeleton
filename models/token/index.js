const Base = require("../base");
const mc = require('merge-change');
const {strings, schema} = require('exser').utils;

class Token extends Base {

  define() {
    return mc.merge(super.define(), {
      title: 'Токен авторизации',
      indexes: {
        value: [{'value': 1}, {
          'unique': true,
          partialFilterExpression: {phone: {$gt: ''}, isDeleted: false}
        }]
      },
      // Свойства модели в JSONSchema. Используются функции для генерации фрагментов схем.
      properties: {
        user: schema.rel({model: 'user', description: 'Пользователь'}),
        value: schema.string({description: 'Токен для идентификации'}),
      },
      required: ['user']
    });
  }

  async createOne({body, session, validate}) {
    if (!body.value) {
      body.value = await strings.generateToken();
    }
    return super.createOne({body, session, validate});
  }

  /**
   * Удаление токена по значению
   * @param value {String}
   * @param session {SessionState|Object}
   * @returns {Promise<Object>}
   */
  async removeByValue({value, session}) {
    return this.deleteOne({
      filter: {value},
      session,
    });
  }
}

module.exports = Token;