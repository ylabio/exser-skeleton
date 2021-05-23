const Base = require("../base");
const mc = require('merge-change');
const exser = require('exser');
const {errors, strings, schema} = exser.utils;
const fs = require('fs');
const path = require('path');

class File extends Base {

  define() {
    return mc.merge(super.define(), {
      title: 'Файл',
      indexes: {},
      // Свойства модели в JSONSchema. Используются функции для генерации фрагментов схем.
      properties: {
        url: schema.string({
          description: 'Публичная ссылка на файл',
          example: 'http://example.com/file.png'
        }),
        name: schema.string({description: 'Название файла из пути на него', defaults: ''}),
        kind: schema.string({
          description: 'Классификация файла, например image',
          defaults: 'other'
        }),
        mime: schema.string({description: 'MIME тип файла', defaults: ''}),
        ext: schema.string({description: 'Расширение файла', defaults: ''}),
        originalName: schema.string({description: 'оригинальное название файла', defaults: ''}),
        title: schema.string({description: 'Название файла для отображения', defaults: ''}),
        description: schema.string({description: 'Описание к файлу', defaults: ''}),
        path: schema.string({description: 'Путь на сервере к файлу', defaults: ''}),
        // sets: {
        //   type: 'object',
        //   patternProperties: {
        //     '^.+$': schema.rel({model: 'file', description: 'Пресет файла'})
        //   },
        //   default: {},
        //   description: 'Производные файлы, например, превью',
        //   additionalProperties: true
        // }
      },
      required: ['url'],
    });
  }

  getKindByMimeExt(mime, ext) {
    mime = mime.toLowerCase();
    ext = ext.toLowerCase();
    const names = Object.keys(this.config.kinds);
    for (let name of names) {
      const kinds = this.config.kinds[name];
      if (kinds.indexOf('*') !== -1 || kinds.indexOf(ext) !== -1 || kinds.indexOf(mime) !== -1) {
        return name;
      }
    }
    return null;
  }

  /**
   * Загрузка и создание объекта файла
   * @param stream
   * @param body
   * @param session
   * @param fields
   * @returns {Promise.<*|Object>}
   */
  async upload({stream, body, session, fields = {'*': 1}}) {
    body.extension = body.originalName.split('.').pop();
    body.kind = this.getKindByMimeExt(body.mime, body.extension);
    if (!body.kind) {
      throw new errors.Validation([{
        path: ['mime'],
        rule: 'enum',
        accept: 'Some. Please, see documentation',
        message: 'Not supported file extension or mime'
      }]);
    }
    const secret = strings.random(12, 'abcdefghijklmnopqrstuvwxyz0123456789');
    const _id = new exser.ObjectID(); // id для сущности и url файла
    body.name = `${_id.toString()}-${secret}.${body.extension}`;
    body.url = `${this.config.url}/${body.name}`;
    const pathFile = path.resolve(this.config.dir, body.name);
    const streamWrite = fs.createWriteStream(pathFile, {flags: 'w'});

    stream.pipe(streamWrite);

    let result;
    try {
      await new Promise((resolve, reject) => {
        streamWrite.on('finish', resolve);
        streamWrite.on('error', reject);
        stream.on('end', () => resolve());
        stream.on('error', () => {
          streamWrite.destroy('Client stream error');
          reject();
        });
      });
      result = await this.createOne({
        body, session,
        validate: async ({object, source, session}) => {
          object._id = _id;
          object.path = pathFile;
          return object;
        }
      });
    } catch (e) {
      streamWrite.destroy();
      throw e;
    }
    return result;
  }


  async cleanup(log = true) {
    // const minDate = moment().subtract(3, 'days').unix();
    // let result = {
    //   countFiles: 0,
    //   countObjects: 0
    // };
    // const buckets = this.buckets;
    // const bucketsNames = Object.keys(buckets);
    // for (let bucketName of bucketsNames) {
    //   const fileList = await buckets[bucketName].getFiles();
    //   for (let file of fileList[0]) {
    //     let deleteFile = false;
    //     try {
    //       const fileEntity = await this.getOne({filter: {name: file.name}, view: false});
    //       if (
    //         (fileEntity.state === 'error') ||
    //         (fileEntity.state === 'loading' && fileEntity.dateCreate < minDate)
    //       ) {
    //         //@todo + check external links
    //         //await this.destroyOne({id: fileEntity._id, view: false});
    //         result.countObjects++;
    //         deleteFile = true;
    //       }
    //     } catch (e) {
    //       if (e instanceof errors.NotFound) {
    //         // deleteFile = true;
    //       }
    //     }
    //     if (deleteFile) {
    //       //file.delete();
    //       result.countFiles++;
    //       if (log) {
    //         console.log('Delete: ' + file.name);
    //       }
    //     }
    //   }
    // }
    // return result;
  }
}

module.exports = File;
