const Services = require('../../services');

describe('Auth API', () => {
  let s = {};
  let data = {};

  beforeAll(async () => {
    s.services = new Services().configure(['configs.js', 'configs.local.js', 'configs.tests.js']);
    s.storage = await s.services.getStorage();
    s.init = await s.services.getInitMock();
    s.restApi = await s.services.getRestApi();
    s.http = await s.restApi.supertest();
  });

  beforeEach(async () => {
    s.init.deleteAllState();
    await s.storage.clearStorage();
  });

  describe('Auth', () => {
    test('Авторизация', async () => {
      const users = await s.init.initUsers();
      const user = users.getRandom();
      const response = await s.http.post('/api/v1/auth/sign').send({
        login: user.email,
        password: user.passwordPlain
      });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('result.token');
    });
  });

  describe('Регистрация', () => {

    test('С обязательными полями', async () => {
      const body = {
        email: 'boolive@yandex.ru',
        password: '123456789',
        phone: '+81234567890',
        profile: {
          name: 'Имя',
          surname: 'Фамилия',
          birthday: '1985-11-19'
        }
      };
      const response = await s.http.post('/api/v1/auth/registration').query({fields: '*'}).send(body);
      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject({
        result: {
          "email": "boolive@yandex.ru",
          "password": "25f9e794323b453885f5181f1b624d0b"
        }
      });
    });

    test('Повторная регистрация (не уникальный email)', async () => {
      const body = {
        email: 'boolive@yandex.ru',
        password: '123456789',
        phone: '+11234567000',
        profile: {
          name: 'Имя',
          surname: 'Фамилия',
          birthday: '1985-11-20',
        }
      };
      const responseFirst = await s.http.post('/api/v1/auth/registration').send(body);
      const response = await s.http.post('/api/v1/auth/registration').send(body);
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({
        error: {
          data: {
            issues: [{
              path: 'email',
              rule: 'unique'
            }]
          }
        }
      });
    });
  });

  describe('Смена паролей', () => {

    test('Отправка одинаковых паролей', async () => {
      const users = await s.init.initUsers();
      const user = users.getRandom();
      const auth = await s.http.post('/api/v1/auth/sign').send({
        login: user.email,
        password: user.passwordPlain
      });

      const response = await s.http
        .put(`/api/v1/auth/password`)
        .set('X-Token', auth.body.result.token)
        .send({
          oldPassword: user.password,
          newPassword: user.password
        });
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({
        error: {
          code: '000',
          message: 'Incorrect data',
          data: {
            issues: [{
              path: ['password'],
              rule: 'equal'
            }]
          }
        }
      });
    });

    test('Отправка невалидного старого пароля', async () => {
      const users = await s.init.initUsers();
      const user = users.getRandom();
      const auth = await s.http.post('/api/v1/auth/sign').send({
        login: user.email,
        password: user.passwordPlain
      });
      const response = await s.http
        .put(`/api/v1/auth/password`)
        .set('X-Token', auth.body.result.token)
        .send({
          oldPassword: user.password + '123',
          newPassword: '987654321'
        });
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({
        error: {
          code: '000',
          message: 'Incorrect data',
          data: {
            issues: [{
              path: ['oldPassword'],
              rule: 'incorrect'
            }]
          }
        }
      });
    });

    test('Отправка невалидного нового пароля', async () => {
      const users = await s.init.initUsers();
      const user = users.getRandom();
      const auth = await s.http.post('/api/v1/auth/sign').send({
        login: user.email,
        password: user.passwordPlain
      });
      const response = await s.http
        .put(`/api/v1/auth/password`)
        .set('X-Token', auth.body.result.token)
        .send({
          oldPassword: user.password,
          newPassword: '987'
        });
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({
        error: {
          code: '000',
          message: 'Incorrect data',
          data: {
            issues: [{
              path: 'newPassword',
              rule: 'minLength'
            }]
          }
        }
      });
    });

    test('Успешная смена пароля', async () => {
      const users = await s.init.initUsers();
      const user = users.getRandom();

      const auth = await s.http.post('/api/v1/auth/sign').send({
        login: user.email,
        password: user.passwordPlain
      });

      const response = await s.http
        .put(`/api/v1/auth/password`)
        .set('X-Token', auth.body.result.token)
        .send({
          oldPassword: user.passwordPlain,
          newPassword: '987654321'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({result: true});
    });
  });

});
