const {strings, schema} = require('exser').utils;
const mc = require('merge-change');
const Base = require("../base");

class User extends Base {

  define() {
    // Наследуются схема модели exser
    return mc.merge(super.define(), {
      title: 'Пользователь',
      indexes: {
        email: [{'email': 1}, {
          'unique': true,
          partialFilterExpression: {email: {$gt: ''}, _deleted: false}
        }]
      },
      // Свойства модели в JSONSchema. Используются функции для генерации фрагментов схем.
      properties: {
        email: schema.string({
          /*format: 'email',*/
          maxLength: 100,
          errors: {format: 'Incorrect format'},
          description: 'Email пользователя, используемый для авторизации',
          transform: ["trim", "toLowerCase"]
        }),
        username: schema.string({type: 'string', maxLength: 100, description: 'Логин пользователя'}),
        password: schema.string({minLength: 6, errors: {minLength: 'At least 6 characters'}}),
        role: schema.rel({description: 'Роль', model: 'role', copy: '_id, _type, name'}),
        profile: schema.object({
          description: 'Свойства профиля',
          properties: {
            name: schema.string({maxLength: 100, description: 'Имя', default: ''}),
            surname: schema.string({maxLength: 100, description: 'Фамилия', default: ''}),
            middlename: schema.string({maxLength: 100, description: 'Отчество', default: ''}),
            avatar: schema.rel({description: 'Аватарка', model: 'file', default: {}, }),
            phone: schema.string({
              anyOf: [{pattern: '^\\+[0-9]{10,20}$'}, {const: ''}],
              example: '+79993332211',
              errors: {anyOf: 'Incorrect format'},
              default: ''
            }),
            birthday: schema.string({ // не приводится в Date()
              anyOf: [{format: 'date'}, {const: ''}],
              description: 'Дата рождения',
              default: ''
            })
          },
          required: []
        }),
      },
      required: ['email', 'profile']
    });
  }


  async createOne({body, session, validate}) {
    //if (body.email) body.email = body.email.toLowerCase();
    // Генерация пароля если не передан
    if (!body.password) {
      body.password = strings.random(
        this.config.password.length, this.config.password.chars
      );
    }
    return super.createOne({
      body, session,
      validate: async (args) => {
        // Хэширование пароля
        if (!strings.isHash(args.object.password)) {
          args.object.password = strings.hash(args.object.password);
        }
        return validate ? validate(args) : args.object;
      }
    });
  }

  async updateOne({filter, body, validate, session, prev}) {
    return super.updateOne({
      filter, body, session, prev,
      validate: async (args) => {
        // Хэширование нового пароля
        if ('password' in args.source && !strings.isHash(args.source.password)) {
          args.object.password = strings.hash(args.source.password);
        }
        return validate ? validate(args) : args.object;
      }
    });
  }
}

module.exports = User;
