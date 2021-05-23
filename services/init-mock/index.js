const mc = require('merge-change');
const Init = require('../init');

class InitMock extends Init {

  async start(params = {}) {
    await super.start(params);
    await this.initUsers();
  }

  /**
   * Создание пользователей
   * @returns {Promise<InitState>}
   */
  async initUsers() {
    const state = this.getState('users');
    if (state.isEmpty()) {
      const roles = await this.initRoles();
      const session = await this.initSessionRoot();
      let items = [
        {
          _key: 'user1',
          email: 'petya@example.com',
          phone: '+79993332211',
          password: 'password',
          username: 'petr',
          role: {_id: roles.getBy('name', 'user')._id},
          profile: {
            name: 'Владимир',
            surname: 'Шестаков'
          }
        },
      ];
      for (let body of items) {
        state.append(
          mc.patch(
            await this.storage.get('user').upsertOne({
              filter: {_key: body._key},
              body,
              session
            }),
            // Добавляем реальный пароль, чтобы можно было тестировать авторизацию
            {passwordPlain: body.password}
          )
        );
      }
    }
    return state;
  }
}

module.exports = InitMock;
