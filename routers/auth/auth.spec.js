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
    await s.storage.clearStorage();
  });

  describe('Test user auth', () => {
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
});
