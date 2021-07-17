const {query, schema} = require('exser').utils;
const formidable = require('formidable');

module.exports = async (router, services) => {

  /** @type {Spec} */
  const spec = await services.getSpec();
  /** @type {Array} Тег для роутеров */
  const tags = spec.setTags({name: 'Files', description: 'Файлы'});
  /** @type {Storage} */
  const storage = await services.getStorage();
  /** @type {File} */
  const files = storage.get('file');

  /**
   * Создание/загрузка
   */
  router.post('/files', {
    summary: 'Загрузка и создание',
    action: 'file.upload',
    description: 'Загрузка файла на сервер. Используется потоковая загрузка с прогрессом (HTML5)',
    tags: tags,
    requestBody: schema.body({
      description: 'Файл для загрузки',
      mediaType: 'multipart/form-data',
      schema: schema.object({
        properties: {
          file: schema.string({format: 'binary'})
        }
      })
    }),
    parameters: [
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      201: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.test'}}),
      400: schema.bodyError({description: 'Bad Request'})
    }
  }, async (req, res, next) => {
    return new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm();
      form.parse(req);
      form.onPart = (part) => {
        //console.log('onPart', part);
        if (part.name === 'file' && part.filename) {
          files.upload({
            stream: part,
            body: {
              originalName: part.filename,
              mime: part.mime
            },
            session: req.session
          }).then(object => {
            resolve(object);
            //console.log('upload resolve', object);
          }).catch(e => {
            reject(e);
            //console.log('upload catch', e);
          });
        }
      };
      form.on('error', function (err) {
        //console.log('form error', err);
      });
      form.on('aborted', function (d) {
        //console.log('form aborted', d);
      });
      form.on('end', function (d) {
        //console.log('form end', d);
      });
    });
  });

  /**
   * Выбор списка
   */
  router.get('/files', {
    action: 'file.find.many',
    summary: 'Выбор списка (поиск)',
    description: 'Список файлов',
    tags,
    parameters: [
      schema.paramSearch({
        name: 'kind', schema: {type: 'string', enum: ['video', 'image', 'other']},
        description: 'Поиск по типу файла'
      }),
      schema.paramSearch({
        name: 'status', schema: {type: 'string', enum: ['loading', 'loaded', 'error']},
        description: 'Поиск по статусу загрузки'
      }),
      schema.paramFields({}),
      schema.paramLimit({}),
      schema.paramSkip({}),
      schema.paramSort({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResultList({schema: {$ref: '#/components/schemas/storage.file'}})
    }
  }, async (req/*, res*/) => {
    // Фильтр для выборки
    const filter = query.makeFilter(req.query.search, {
      kind: {cond: 'const', fields: ['kind'], type: 'string'},
      status: {cond: 'const', fields: ['status'], type: 'string'},
    });
    // Выборка с фильтром
    return {
      items: await files.findMany({
        filter,
        sort: query.parseSort(req.query.sort),
        limit: req.query.limit,
        skip: req.query.skip,
        session: req.session,
      }),
      count: query.inFields(req.query.fields, 'count')
        ? await files.findCount({filter, session: req.session})
        : null
    };
  });

  /**
   * Выбор одного
   */
  router.get('/files/:id', {
    action: 'file.find.one',
    summary: 'Выбор одного',
    description: 'Выбор файла по идентификатору',
    tags,
    parameters: [
      schema.param({name: 'id', in: 'path', description: 'Идентификатор файла'}),
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.file'}}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req/*, res/*, next*/) => {
    return await files.findOne({
      filter: query.makeFilter({}, {
        _id: {value: req.params.id, cond: 'eq', type: 'ObjectId'}
      }),
      session: req.session
    });
  });

  /**
   * Удаление
   */
  router.delete('/files/:id', {
    action: 'file.delete',
    summary: 'Удаление',
    description: 'Удаление файла',
    tags,
    parameters: [
      schema.param({name: 'id', in: 'path', description: 'Идентификатор файла'}),
      schema.paramFields({}),
      schema.paramLang({}),
    ],
    responses: {
      200: schema.bodyResult({schema: {$ref: '#/components/schemas/storage.file'}}),
      404: schema.bodyError({description: 'Not Found'})
    }
  }, async (req) => {

    return await files.deleteOne({
      filter: query.makeFilter({}, {
        _id: {value: req.params.id, cond: 'eq', type: 'ObjectId'}
      }),
      session: req.session
    });
  });
};
