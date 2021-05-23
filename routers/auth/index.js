const {query, schema} = require('exser').utils;
/**
 *
 * @param router
 * @param {Services} services
 * @returns {Promise<void>}
 */
module.exports = async (router, services) => {
  /** @type {Spec} */
  const spec = await services.getSpec();
  /** @type {Array} Тег для роутеров */
  const tags = spec.setTags({name: 'Auth', description: 'Авторизация'});
  /** @type {Auth} */
  const auth = await services.getAuth();
  /** @type {Logs} */
  const logs = await services.getLogs();

  /**
   * Аутентификация сессии запроса
   */
  router.use('', async (req, res, next) => {
    try {
      let token = req.get('X-Token');
      if (!token) {
        // Токен из заголовка авторизации
        const authHeader = (req.get('Authorization') || '').match(/^[a-z]+\s(.+)$/i);
        if (authHeader) {
          token = authHeader[1];
        }
      }
      let authResult = await auth.signInByToken({token});
      if (authResult) {
        let user = await authResult.user.load();
        req.session.user = user;
        req.session.token = token;
        // локаль по настройкам пользователя
        if (user.lang && !(req.query.lang || req.get('X-Lang'))) {
          req.lang = user.lang
        }
      }
      logs.step({
        text: `${req.method} ${req.url} ${req.get('content-type')}`,
        data: req.body /*headers: req.headers*/,
        session: req.session
      });
      next();
    } catch (e) {
      next(e);
    }
  });

  /**
   * Авторизация
   */
  router.post('/auth/sign', {
    action: 'auth.signIn',
    summary: 'Вход',
    description: 'Авторизация по логину и паролю',
    tags,
    requestBody: schema.body({schema: {$ref: '#/components/schemas/auth.signIn'}}),
    parameters: [
      schema.paramFields({example: '_id,email,profile(name)'}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResult({
        schema: schema.object({
          properties: {
            token: schema.string({description: 'Токен'}),
            user: {$ref: '#/components/schemas/storage.user'}
          }
        }),
        headers: {
          'Set-Cookie': {type: 'string', description: 'Токен в "Token"'}
        }
      }),
      400: schema.bodyError({description: 'Bad Request'})
    }
  }, async (req, res/*, next*/) => {
    let result = await auth.signIn({
      body: req.body,
      session: req.session
    });
    if (req.body.remember) {
      res.cookie('token', result.token, {maxAge: 2592000000, httpOnly: false});
    } else {
      res.cookie('token', result.token, {expires: false, httpOnly: false});
    }
    return {
      token: result.token,
      user: result.user
    };
  });

  /**
   * Выход
   */
  router.delete('/auth/sign', {
    action: 'auth.signOut',
    summary: 'Выход',
    description: 'Отмена авторизации. Удаляется текущий токен (token) пользователя',
    tags,
    parameters: [],
    responses: {
      200: schema.bodyResult({schema: schema.boolean({})}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req/*, res/*, next*/) => {
    return await auth.signOut({
      session: req.session
    });
  });

  /**
   * Регистрация
   */
  router.post('/auth/registration', {
    action: 'auth.registration',
    summary: 'Регистрация',
    description: 'Создание нового пользователя (регистрация).',
    tags,
    requestBody: schema.body({schema: {$ref: '#/components/schemas/storage.user'}}),
    parameters: [
      schema.paramFields({example: '_id,email,profile(name)'}),
      schema.paramLang({}),
    ],
    responses: {
      201: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.user'}}),
      400: schema.bodyError({description: 'Bad Request'})
    },
  }, async (req, res) => {
    res.status(201);
    return await auth.registration({
      body: req.body,
      session: req.session
    });
  });

  /**
   * Запрос пароля
   */
  router.post('/auth/restore', {
    action: 'auth.restore',
    summary: 'Вспомнить пароль',
    description: 'Запрос нового пароля. \n\n' +
      'На указанную почту отправляется новый пароль. ' +
      'Старый пароль заменится новым при первом входе с новым паролем',
    tags,
    requestBody: schema.body({schema: {$ref: '#/components/schemas/auth.restore'}}),
    parameters: [],
    responses: {
      200: schema.bodyResult({schema: schema.boolean({})}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req/*, res/*, next*/) => {
    return await auth.restore({
      body: req.body,
      session: req.session
    });
  });

  /**
   * Смена пароля
   */
  router.put('/auth/password', {
    action: 'auth.password',
    summary: 'Смена пароля',
    description: 'Изменение пароля авторизованного пользователя',
    tags,
    requestBody: schema.body({schema: {$ref: '#/components/schemas/auth.changePassword'}}),
    parameters: [],
    responses: {
      200: schema.bodyResult({schema: schema.boolean({})}),
      400: schema.bodyError({description: 'Bad Request'}),
    }
  }, async (req/*, res*/) => {
    return await auth.changePassword({
      filter: query.makeFilter({}, {
        _id: {value: req.session.user ? req.session.user._id : '', cond: 'eq', type: 'ObjectId'}
      }),
      body: req.body,
      session: req.session,
    });
  });
};
