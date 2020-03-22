const exser = require('exser');
const {errors, stringUtils} = exser.utils;

class Token extends exser.Model {

  define() {
    const parent = super.define();
    return {
      collection: 'token',
      indexes: this.spec.extend(parent.indexes, {
        value: [{'value': 1}, {
          'unique': true,
          partialFilterExpression: {phone: {$gt: ''}, isDeleted: false}
        }]
      }),
      // Полная схема объекта
      model: this.spec.extend(parent.model, {
        title: 'Токен',
        properties: {
          user: this.spec.generate('rel', {description: 'Пользователь', type: 'user'}),
          value: {type: 'string', description: 'Токен для идентификации'},
        },
        required: ['user']
      })
    };
  }

  schemes() {
    return this.spec.extend(super.schemes(), {
      // Схема создания
      create: {
        properties: {
          $unset: [
            'value'
          ]
        },
      },
      // Схема редактирования
      update: {
        properties: {
          $unset: [
            'value'
          ],
          profile: {
            $set: {
              required: []
            }
          }
        },
      },
      // Схема просмотра
      view: {

      },
      // Схема просмотра списка
      viewList: {

      }
    });
  }

  async createOne({body, view = true, fields = {'*': 1}, session, validate, prepare, schema = 'create'}) {
    return super.createOne({
      body, view, fields, session, validate, schema,
      prepare: async (parentPrepare, object) => {
        const prepareDefault = async (object) => {
          parentPrepare(object);
          object.value = await stringUtils.generateToken();
        };
        await (prepare ? prepare(prepareDefault, object) : prepareDefault(object));
      }
    });
  }

  async removeByToken({token, session}) {
    const object = await super.getOne({
      filter: {value: token},
      session,
    });

    await super.updateOne({
      id: object._id,
      body: {isDeleted: true},
      session,
      schema: 'delete',
    });

    return true;
  }
}

module.exports = Token;
