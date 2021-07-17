/**
 * Конфиг всех сервисов
 * @type {Object}
 */
module.exports = {

  'rest-api': {
    host: 'localhost',
    port: 8130,
    path: '/api/v1',
    routers: require('./routers'),
    cors: {
      /**
       * С каких хостов допустимы запросы
       * - false для отключения CORS
       * - ['http://localhost:8000', /\.example\.com$/]
       * - '*' - все хосты
       */
      origin: [
        'http://localhost:8131', // client host
      ]
    },
  },

  storage: {
    db: {
      //url: 'mongodb://user:passw@localhost:27017', // Может быть строкой
      url: {
        host: process.env.MONGO_HOST || 'localhost',
        port: process.env.MONGO_PORT || '27017',
        user: process.env.MONGO_USER || '',
        password: process.env.MONGO_PWD || '',
      },
      // База данных
      name: 'example'
    },
    // Модели
    models: require('./models'),

    // Опции для модели user
    user: {
      // Генератор пароля
      password: {
        length: 8,
        chars: 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM123456678990-!=+&$#'
      },
    },

    // Опции для модели file
    file: {
      // Типы файла по расширению или mime
      kinds: {
        image: ['gif', 'png', 'jpeg', 'jpg'],
        doc: ['txt', 'pdf', 'doc', 'docx', 'rtf', 'xls', 'xlsx', 'csv'],
        other: ['*']
      },
      dir: './public/uploads',
      url: '/uploads' //настроить в nginx
    },
  },

  admin: {
    baseUrl: '/admin',
    views: require('./services/admin/views.js'),
    show: ['side=menu', {path: 'page=roles/:id', id: 3}]
  },

  auth: {
    siteUrl: 'http://example.front.ylab.io'
  },

  mail: {
    transport: {
      host: 'smtp.yandex.com',
      port: 465,
      secure: true, // use SSL
      //service: 'gmail',
      auth: {
        user: 'daniilsidorov2017@yandex.com',
        pass: 'qqaazzwwssxx'
      },
      tls: {
        rejectUnauthorized: false
      }
    },
    defaults: {
      from: '<daniilsidorov2017@yandex.ru>',
      replyTo: 'support@ylab.io'
    }
  },

  spec: {
    default: {
      info: {
        title: 'Example',
        description: 'Example REST API',
        version: '1.0.0',
      },
      components: {
        parameters: require('./services/spec/components/parameters'),
        responses: require('./services/spec/components/responses'),
        schemas: require('./services/spec/components/schemas'),
        securitySchemes: {
          token: {type: 'apiKey', in: 'header', name: 'X-Token'},
        },
      },
    },
  },

  logs: {
    all: true,
    process: true,
    step: true,
    error: true,
    unsetFields: [
      'password'
    ]
  },

  tasks: {},

  dump: {
    uniqueFields: {
      defaults: ['_key'],
      user: ['username'],
      role: ['name']
    },
  },

  access: {
    acl: [
      // Не авторизованный
      {
        key: 2,
        session: {},// Любая сессия
        actions: {
          'auth.*': true, // Доступ к методам авторизации
        }
      },
      // Авторизован
      {
        key: 3,
        session: {'session.user._deleted': false},
        actions: {
          // Полные права на все действия
          '*': true,
          '*.*': true,
          '*.*.*': true,
          // Детализация прав на объект с зависимостью на сессию
          //'user.find.*': {objects: [{_id: '$session.user._id'}]} // Может выбирать себя
        }
      },
      // Условие на роль (админ)
      {
        key: 1,
        session: {'user.role.name': 'admin'},
        actions: {
          '*': true,
          '*.*': true,
          '*.*.*': true
        }
      },
    ]
  }
};
