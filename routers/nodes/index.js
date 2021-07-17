const {query, schema} = require('exser').utils;

module.exports = async (router, services) => {

  /** @type {Spec} */
  const spec = await services.getSpec();
  /** @type {Array} Тег для роутеров */
  const tags = spec.setTags({name: 'Nodes', description: 'Узлы'});
  /** @type {Storage} */
  const storage = await services.getStorage();
  /** @type {Node} */
  const nodes = storage.get('node');

  /**
   * Создание
   */
  router.post('/nodes', {
    action: 'node.create',
    summary: 'Создание',
    description: 'Создание узла',
    tags,
    requestBody: schema.body({schema: {$ref: '#/components/schemas/storage.node'}}),
    parameters: [
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      201: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.node'}}),
      400: schema.bodyError({description: 'Bad Request'})
    }
  }, async (req, res) => {

    res.status(201);
    return await nodes.createOne({
      body: req.body,
      session: req.session
    });
  });

  /**
   * Выбор списка
   */
  router.get('/nodes', {
    action: 'node.find.many',
    summary: 'Выбор списка (поиск)',
    description: 'Список узлов с фильтром',
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
      200: schema.bodyResultList({schema: {$ref: '#/components/schemas/storage.node'}})
    }
  }, async (req) => {

    // Фильтр для выборки
    const filter = query.makeFilter(req.query.search, {
      query: {cond: 'like', fields: ['name', 'title.ru', 'title.en']},
    });
    // Выборка с фильтром
    return {
      items: await nodes.findMany({
        filter,
        sort: query.parseSort(req.query.sort),
        limit: req.query.limit,
        skip: req.query.skip,
        session: req.session,
      }),
      count: query.inFields(req.query.fields, 'count')
        ? await nodes.findCount({filter, session: req.session})
        : null
    };
  });

  /**
   * Выбор одного
   */
  router.get('/nodes/:id', {
    action: 'node.find.one',
    summary: 'Выбор одного',
    description: 'Узел по идентификатору',
    tags,
    parameters: [
      schema.param({name: 'id', in: 'path', description: 'Идентификатор узла'}),
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.node'}}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req/*, res*/) => {

    return await nodes.findOne({
      filter: query.makeFilter({}, {
        _id: {value: req.params.id, cond: 'eq', type: 'ObjectId'}
      }),
      session: req.session
    });
  });

  /**
   * Редактирование
   */
  router.patch('/nodes/:id', {
    action: 'node.update',
    summary: 'Редактирование',
    description: 'Изменение узла',
    tags,
    requestBody: schema.body({schema: {$ref: '#/components/schemas/storage.node'}}),
    parameters: [
      schema.param({name: 'id', in: 'path', description: 'Идентификатор узла'}),
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.node'}}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req) => {

    return await nodes.updateOne({
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
  router.delete('/nodes/:id', {
    action: 'node.delete',
    summary: 'Удаление',
    description: 'Удаление узла',
    tags,
    parameters: [
      schema.param({name: 'id', in: 'path', description: 'Идентификатор узла'}),
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.node'}}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req) => {

    return await nodes.deleteOne({
      filter: query.makeFilter({}, {
        _id: {value: req.params.id, cond: 'eq', type: 'ObjectId'}
      }),
      session: req.session
    });
  });
};
