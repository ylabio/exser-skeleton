const {query, schema} = require('exser').utils;

module.exports = async (router, services) => {

  /** @type {Spec} */
  const spec = await services.getSpec();
  /** @type {Array} Тег для роутеров */
  const tags = spec.setTags({name: 'Roles', description: 'Роли'});
  /** @type {Storage} */
  const storage = await services.getStorage();
  /** @type {Role} */
  const roles = storage.get('role');

  /**
   * Создание
   */
  router.post('/roles', {
    action: 'role.create',
    summary: 'Создание',
    description: 'Создание роли',
    tags,
    requestBody: schema.body({schema: {$ref: '#/components/schemas/storage.role'}}),
    parameters: [
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      201: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.role'}}),
      400: schema.bodyError({description: 'Bad Request'})
    }
  }, async (req, res) => {

    res.status(201);
    return await roles.createOne({
      body: req.body,
      session: req.session,
    });
  });

  /**
   * Выбор списка
   */
  router.get('/roles', {
    action: 'role.find.many',
    summary: 'Выбор списка (поиск)',
    description: 'Список ролей с фильтром',
    tags,
    parameters: [
      schema.paramSearch({name: 'query', description: 'Общий поиск по строке'}),
      schema.paramFields({}),
      schema.paramLimit({}),
      schema.paramSkip({}),
      schema.paramSort({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResultList({schema: {$ref: '#/components/schemas/storage.role'}})
    }
  }, async (req) => {

    // Фильтр для выборки
    const filter = query.makeFilter(req.query.search, {
      query: {cond: 'like', fields: ['name', 'title.ru', 'title.en']},
    });
    // Выборка с фильтром
    return {
      items: await roles.findMany({
        filter,
        sort: query.parseSort(req.query.sort),
        limit: req.query.limit,
        skip: req.query.skip,
        session: req.session,
      }),
      count: query.inFields(req.query.fields, 'count')
        ? await roles.findCount({filter, session: req.session})
        : null
    };
  });

  /**
   * Выбор одного
   */
  router.get('/roles/:id', {
    action: 'role.find.one',
    summary: 'Выбор одного',
    description: 'Роль по идентификатору',
    tags,
    parameters: [
      schema.param({name: 'id', in: 'path', description: 'Идентификатор роли'}),
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.role'}}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req/*, res*/) => {

    return await roles.findOne({
      filter: query.makeFilter({}, {
        _id: {value: req.params.id, cond: 'eq', type: 'ObjectId'}
      }),
      session: req.session
    });
  });

  /**
   * Редактирование
   */
  router.patch('/roles/:id', {
    action: 'role.update',
    summary: 'Редактирование',
    description: 'Изменение роли',
    tags,
    requestBody: schema.body({schema: {$ref: '#/components/schemas/storage.role'}}),
    parameters: [
      schema.param({name: 'id', in: 'path', description: 'Идентификатор роли'}),
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.role'}}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req) => {

    return await roles.updateOne({
      filter: query.makeFilter({}, {
        _id: {value: req.params.id, cond: 'eq', type: 'ObjectId'}
      }),
      body: req.body,
      session: req.session,
    });
  });

  /**
   * Удаление
   */
  router.delete('/roles/:id', {
    action: 'role.delete',
    summary: 'Удаление',
    description: 'Удаление роли',
    tags,
    parameters: [
      schema.param({name: 'id', in: 'path', description: 'Идентификатор роли'}),
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.role'}}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req) => {

    return await roles.deleteOne({
      filter: query.makeFilter({}, {
        _id: {value: req.params.id, cond: 'eq', type: 'ObjectId'}
      }),
      session: req.session
    });
  });
};
