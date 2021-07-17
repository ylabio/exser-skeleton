const {query, errors, schema} = require('exser').utils;
const ObjectID = require('exser').ObjectID;

module.exports = async (router, services) => {

  /** @type {Spec} */
  const spec = await services.getSpec();
  /** @type {Array} Тег для роутеров */
  const tags = spec.setTags({name: 'Users', description: 'Пользователи'});
  /** @type {Storage} */
  const storage = await services.getStorage();
  /** @type {User} */
  const users = storage.get('user');

  /**
   * Выбор списка
   */
  router.get('/users', {
    action: 'user.find.many',
    summary: 'Выбор списка (поиск)',
    description: 'Список пользователей с фильтром',
    tags,
    parameters: [
      schema.paramSearch({name: 'query', description: 'Общий поиск по строке'}),
      schema.paramSearch({name: 'name', description: 'Поиск по имени и фамилии'}),
      schema.paramSearch({name: 'email', description: 'Поиск по email'}),
      schema.paramSearch({name: 'phone', description: 'Поиск по телефону'}),
      schema.paramFields({}),
      schema.paramLimit({}),
      schema.paramSkip({}),
      schema.paramSort({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResultList({schema: {$ref: '#/components/schemas/storage.user'}})
    }
  }, async (req/*, res*/) => {

    // Фильтр для выборки
    const filter = query.makeFilter(req.query.search, {
      query: {cond: 'like', fields: ['profile.name', 'profile.surname', 'email', 'phone']},
      name: {cond: 'flex', fields: ['profile.name', 'profile.surname']},
      email: {cond: 'flex', fields: ['email']},
      phone: {cond: 'flex', fields: ['phone']},
    });
    // Выборка с фильтром
    return {
      items: await users.findMany({
        filter,
        sort: query.parseSort(req.query.sort),
        limit: req.query.limit,
        skip: req.query.skip,
        session: req.session,
      }),
      count: query.inFields(req.query.fields, 'count')
        ? await users.findCount({filter, session: req.session})
        : null
    };
  });

  /**
   * Выбор одного по id или "себя"
   */
  router.get('/users/:id', {
    action: 'user.find.one',
    summary: 'Выбор одного',
    description: 'Пользователь по идентификатору. Вместо идентификатора можно укзать self чтобы выбрать текущего пользователя по токену',
    tags,
    parameters: [
      schema.param({
        name: 'id',
        in: 'path',
        description: 'Идентификатор пользователя или self для выборки текущего авторизованного юзера'
      }),
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.user'}}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req/*, res*/) => {

    // Данные для формирования поискового фильтра
    let search = {id: req.params.id};

    // Идентификатор из сессии
    if (search.id === 'self') {
      if (req.session.user && req.session.user._id) {
        search.id = req.session.user._id
      } else {
        throw new errors.NotFound();
      }
    }

    return await users.findOne({
      filter: query.makeFilter(search, {
        id: {cond: 'eq', type: 'ObjectId', fields: ['_id']}
      }),
      session: req.session
    });
  });

  /**
   * Редактирование
   */
  router.patch('/users/:id', {
    action: 'user.update',
    summary: 'Редактирование',
    description: 'Изменение свойств пользователя. Доступно владельцу профиля и админу',
    tags,
    requestBody: schema.body({schema: {$ref: '#/components/schemas/storage.user'}}),
    parameters: [
      schema.param({
        name: 'id',
        in: 'path',
        description: 'Идентификатор пользователя или self для редактирования текущего авторизованного юзера'
      }),
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.user'}}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req/*, res*/) => {

    // Данные для формирования поискового фильтра
    let search = {id: req.params.id};

    // Идентификатор из сессии
    if (req.params.id === 'self') {
      if (req.session.user && req.session.user._id) {
        search.self = req.session.user._id
      } else {
        throw new errors.NotFound();
      }
    }

    return await users.updateOne({
      filter: query.makeFilter(search, {
        id: {cond: 'eq', type: 'ObjectId', fields: ['_id']}
      }),
      body: req.body,
      session: req.session,
    });
  });
};
