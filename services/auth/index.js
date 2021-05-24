const {Service, ObjectID} = require('exser');
const {strings, schema, errors} = require('exser').utils;

class Auth extends Service {

  async init(config, services) {
    await super.init(config, services);
    this.storage = await this.services.getStorage();
    this.mail = await this.services.getMail();
    this.spec = await this.services.getSpec();
    this.specShortcut = this.spec.getShortcut('#/components/schemas/auth.');

    // Схема авторизация по логину и паролю
    this.spec.set('#/components/schemas/auth.signIn', schema.object({
      description: 'Авторизация',
      properties: {
        login: schema.string({
          description: 'Email указанный при регистрации',
          example: 'test@example.com'
        }),
        password: schema.string({example: '123456'}),
        remember: schema.boolean({description: 'Долгосрочное хранение куки с токеном'})
      },
      required: ['login', 'password'],
    }));

    // Схема запроса пароля по email
    this.specShortcut.set('restore', schema.object({
      description: `Запрос пароля`,
      properties: {
        login: schema.string({
          format: 'email',
          description: 'Email указанный при регистрации',
          example: 'user@example.com'
        }),
      },
      required: ['login'],
    }));

    // Схема смены пароля с указание старого и нового
    this.specShortcut.set('changePassword', schema.object({
      description: `Смена пароля`,
      properties: {
        oldPassword: schema.string({description: 'Старый пароль'}),
        newPassword: schema.string({minLength: 6, description: 'Новый пароль'})
      },
      required: ['oldPassword', 'newPassword'],
    }));
    return this;
  }

  /**
   * Регистрация пользователя
   * @param body
   * @param session
   * @returns {Promise<*>}
   */
  async registration({body, session}) {
    session.override({access: false});
    let user = await this.storage.get('user').createOne({body, session});
    await this.notifyReg({user, password: body.password});
    session.revert();
    return user;
  }

  /**
   * Авторизация по логину/паролю
   * @param body
   * @param session {SessionState}
   * @returns {Promise<{user: *, token}>}
   */
  async signIn({body, session}) {
    // Валидация тела запроса
    const form = await this.specShortcut.validate('signIn', body, {session});
    // Без контроля доступа (контроль на уровне роутера)
    session.override({access: false});
    // Сверка старого пароля поиском п нему юзера
    let passwordHash = strings.hash(form.password);
    let user = await this.storage.get('user').findOne({
      filter: {
        $and: [
          {$or: [{email: form.login}, {username: form.login}]},
          {$or: [{password: passwordHash}, {newPassword: passwordHash}]}
        ]
      },
      session
    });
    if (!user) {
      throw new errors.Validation([
        {path: [], rule: 'exists', accept: true, message: 'Wrong login or password'}
      ]);
    }

    // Подтверждение нового пароля
    if (user.newPassword !== passwordHash) {
      await this.storage.get('user').updateOne({
        filter: {_id: user._id},
        body: {
          password: passwordHash
        },
        session
      });
    }

    // Создание токена
    const tokenStorage = this.storage.get('token');
    const token = await tokenStorage.createOne({
      body: {
        user: {_id: user._id.toString(), _type: user._type}
      },
      session
    });

    session.revert();

    return {
      user: user,
      token: token.value
    };
  }

  /**
   * Выход (удаление токена)
   * @param session {SessionState}
   * @returns {Promise.<boolean>}
   */
  async signOut({session}) {
    if (session.token && session.token !== 'null') {
      session.override({access: false});
      /** @type Token */
      const tokenStorage = await this.storage.get('token');
      await tokenStorage.removeByValue({value: session.token, session});
      session.revert();
    }
    return true;
  }

  /**
   * Авторизация по токену
   * @param token
   * @param fields
   * @returns {Promise.<*>}
   */
  async signInByToken({token, session}) {
    let result = false;
    if (token && token !== 'null') {
      session.override({access: false});
      /** @type Token */
      const tokenStorage = await this.storage.get('token');
      result = await tokenStorage.findOne({
        filter: {
          value: token,
          _deleted: false,
          // dateCreate: {
          //   $gte: moment().subtract(1, 'month').toDate()
          // }
        },
        session
      });
      session.revert();
    }
    return result;
  }

  /**
   * Смена пароля
   * @param id
   * @param body {Object}
   * @param session
   * @returns {Promise.<boolean>}
   */
  async changePassword({filter, body, session}) {
    await this.specShortcut.validate('changePassword', body, {session});
    session.override({access: false});
    const user = await this.storage.get('user').findOne({filter, session});

    if (body.oldPassword === body.newPassword) {
      throw new errors.Validation({
        path: ['password'],
        rule: 'equal',
        accept: false,
        message: 'New and old passwords cannot equal'
      });
    }

    if (user.password !== strings.hash(body.oldPassword)) {
      throw new errors.Validation({
        path: ['oldPassword'],
        rule: 'incorrect',
        accept: true,
        message: 'Old passwords was incorrect'
      });
    }
    await this.storage.get('user').updateOne({filter, body: {password: body.newPassword}, session});
    session.revert();
    return true;
  }

  /**
   * Запрос пароля
   * @param body
   * @param session
   * @returns {Promise.<boolean>}
   */
  async restore({body, session}) {
    let form = await this.specShortcut.validate('restore', body, {session});
    session.override({access: false});
    let user = await this.storage.get('user').findOne({filter: {email: form.login}, session});
    if (!user) {
      throw new errors.NotFound({}, 'User not found');
    }
    let password = strings.random(this.config.password.length, this.config.password.chars);
    await this.storage.get('user').updateOne({
      filter: {_id: user._id},
      body: {
        newPassword: strings.hash(password)
      },
      session
    });
    this.mail.send({
      to: user.email,
      subject: 'Новый пароль',
      text: `Добрый день!\n\nВы запросили новый пароль: ${password}\n\n` +
        `${this.config.siteUrl}`
    });
    session.revert();
    return true;
  }

  notifyReg(user, password) {
    if (user.email && process.env.NODE_ENV !== 'test') {
      this.mail.send({
        to: user.email,
        subject: 'Регистрация',
        text: `Добрый день, ${user.profile.name} ${user.profile.surname}!\n\n` +
          `Вы успешно зарегистрированы на сайте ${this.config.siteUrl}\n\n` +
          `Логин: ${user.email}\n\n` +
          `Пароль: ${password}\n\n`
      });
    }
  }
}

module.exports = Auth;