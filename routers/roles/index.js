const {queryUtils, errors} = require('exser').utils;

module.exports = async (router, services) => {

  const spec = await services.getSpec();
  const storage = await services.getStorage();
  /** @type {Role} */
  const roles = storage.get('role');

  /**
   * Создание
   */
  router.post('/roles', {
    operationId: 'roles.create',
    summary: 'Создание',
    description: 'Создание роли',
    session: spec.generate('session.user', ['user']),
    tags: ['Roles'],
    requestBody: {
      content: {
        'application/json': {schema: {$ref: '#/components/schemas/role.create'}}
      }
    },
    parameters: [
      {
        in: 'query',
        name: 'fields',
        description: 'Выбираемые поля',
        schema: {type: 'string'},
        example: '*'
      }
    ],
    responses: {
      200: spec.generate('success', {$ref: '#/components/schemas/role.view'})
    }
  }, async (req) => {

    return await roles.createOne({
      body: req.body,
      session: req.session,
      fields: queryUtils.parseFields(req.query.fields)
    });
  });

  /**
   * Выбор списка
   */
  router.get('/roles', {
    operationId: 'roles.list',
    summary: 'Выбор списка (поиск)',
    description: 'Список ролей с фильтром',
    tags: ['Roles'],
    session: spec.generate('session.user', ['user']),
    parameters: [
      {
        in: 'query',
        name: 'search[query]',
        description: 'Поиск по названию или заголовку',
        schema: {type: 'string'}
      },
      {$ref: '#/components/parameters/sort'},
      {$ref: '#/components/parameters/limit'},
      {$ref: '#/components/parameters/skip'},
      {
        in: 'query',
        name: 'fields',
        description: 'Выбираемые поля',
        schema: {type: 'string'},
        example: '_id,name,title'
      },
      {
        in: 'query',
        name: 'changes',
        description: 'Ключ для выборки изменений',
        schema: {type: 'string'}
      },
    ],
    responses: {
      200: spec.generate('success', {$ref: '#/components/schemas/role.viewList'})
    }
  }, async (req) => {
    const filter = queryUtils.formattingSearch(req.query.search, {
      query: {kind: 'regex', fields: ['name','title.ru', 'title.en']}
    });
    if (req.query.changes) {
      return roles.getListChanges({
        key: req.query.changes,
        filter,
        sort: queryUtils.formattingSort(req.query.sort),
        limit: req.query.limit,
        skip: req.query.skip,
        session: req.session,
        fields: queryUtils.parseFields(req.query.fields)
      });
    } else {
      return roles.getList({
        filter,
        sort: queryUtils.formattingSort(req.query.sort),
        limit: req.query.limit,
        skip: req.query.skip,
        session: req.session,
        fields: queryUtils.parseFields(req.query.fields)
      });
    }
  });

  /**
   * Выбор одного
   */
  router.get('/roles/:id', {
    operationId: 'roles.one',
    summary: 'Выбор одного',
    description: 'Роль по идентификатору',
    tags: ['Roles'],
    session: spec.generate('session.user', ['user']),
    parameters: [
      {
        in: 'path',
        name: 'id',
        schema: {type: 'string'},
        description: 'Идентификатор роли'
      },
      {
        in: 'query',
        name: 'fields',
        description: 'Выбираемые поля',
        schema: {type: 'string'}, example: '_id,name,title'
      }
    ],
    responses: {
      200: spec.generate('success', {$ref: '#/components/schemas/role.view'}),
      404: spec.generate('error', 'Not Found', 404)
    }
  }, async (req/*, res*/) => {

    const filter = queryUtils.formattingSearch({_id: req.params.id}, {
      _id: {kind: 'ObjectId'},
    });

    return await roles.getOne({
      filter,
      session: req.session,
      fields: queryUtils.parseFields(req.query.fields)
    });

  });

  /**
   * Редактирование
   */
  router.put('/roles/:id', {
    operationId: 'roles.update',
    summary: 'Редактирование',
    description: 'Изменение роли',
    tags: ['Roles'],
    session: spec.generate('session.user', ['user']),
    requestBody: {
      content: {
        'application/json': {schema: {$ref: '#/components/schemas/role.update'}}
      }
    },
    parameters: [
      {
        in: 'path',
        name: 'id',
        description: 'id роли',
        schema: {type: 'string'}
      },
      {
        in: 'query',
        name: 'fields',
        description: 'Выбираемые поля',
        schema: {type: 'string'},
        example: '*'
      }
    ],
    responses: {
      200: spec.generate('success', {$ref: '#/components/schemas/role.view'}),
      404: spec.generate('error', 'Not Found', 404)
    }
  }, async (req) => {

    return await roles.updateOne({
      id: req.params.id,
      body: req.body,
      session: req.session,
      fields: queryUtils.parseFields(req.query.fields)
    });
  });

  /**
   * Удаление
   */
  router.delete('/roles/:id', {
    operationId: 'roles.delete',
    summary: 'Удаление',
    description: 'Удаление роли',
    session: spec.generate('session.user', ['user']),
    tags: ['Roles'],
    parameters: [
      {
        in: 'path',
        name: 'id',
        description: 'Идентификатор роли',
        schema: {type: 'string'}
      },
      {
        in: 'query',
        name: 'fields',
        description: 'Выбираемые поля',
        schema: {type: 'string'},
        example: '_id'
      }
    ],
    responses: {
      200: spec.generate('success', true),
      404: spec.generate('error', 'Not Found', 404)
    }
  }, async (req) => {

    return await roles.deleteOne({
      id: req.params.id,
      session: req.session,
      fields: queryUtils.parseFields(req.query.fields)
    });
  });
};
