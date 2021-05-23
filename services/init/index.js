const InitExser = require("exser/services/init");
const {objects} = require('exser').utils;
const mc = require('merge-change');

class Init extends InitExser {

  async init(config, services) {
    await super.init(config, services);
    this.storage = await this.services.getStorage();
    this.sessions = await this.services.getSessions();
    return this;
  }

  async start(params = {}) {
    console.log('Init start');
    if (params.mode === 'clear') {
      console.log('- clear storage');
      await this.storage.clearStorage();
    }
    await this.initUsersAdmin();
    //await this.initUsers();
    console.log('Init completed');
  }

  /**
   * Создание админа
   * @returns {Promise<InitState>}
   */
  async initUsersAdmin() {
    const state = this.getState('users-admin');
    if (state.isEmpty()) {
      const roles = await this.initRoles();
      const session = await this.initSessionRoot();
      let body = {
        username: 'test',
        email: 'teSt@example.com',
        phone: '+70000000000',
        password: '123456',
        role: {_id: roles.getBy('name', 'admin')._id},
        profile: {
          name: 'AdminName1',
          surname: 'AdminSurname'
        }
      };
      state.append(
        await this.storage.get('user').upsertOne({
          filter: {username: body.username}, body, session
        })
      );
    }
    return state;
  }

  /**
   * Создание ролей
   * @returns {Promise<InitState>}
   */
  async initRoles() {
    const state = this.getState('roles');
    if (state.isEmpty()) {
      const session = await this.initSessionRoot();
      let items = [
        {name: 'admin', title: {ru: 'Админ', en: 'Admin'}},
        {name: 'user', title: {ru: 'Пользователь', en: 'User'}}
      ];
      for (let body of items) {
        state.append(
          await this.storage.get('role').upsertOne({
            filter: {name: body.name}, body, session
          })
        );
      }
    }
    return state;
  }

  /**
   * Создание первичных пользователей
   * @returns {Promise<InitState>}
   */
  async initUsers() {
    const state = this.getState('users');
    if (state.isEmpty()) {
      const roles = await this.initRoles();
      const session = await this.initSessionAdmin();
      let items = [
        // {
        //   _key: 'user1',
        //   email: 'petya@example.com',
        //   phone: '+79993332211',
        //   password: 'password',
        //   username: 'petr',
        //   role: {_id: roles.getBy('name', 'user')._id},
        //   profile: {
        //     name: 'Владимир',
        //     surname: 'Шестаков'
        //   }
        // },
      ];
      for (let body of items) {
        state.append(
          await this.storage.get('user').upsertOne({
            filter: {_key: body._key},
            body,
            session
          })
        );
      }
    }
    return state;
  }

  /**
   * Сессия с админом
   * @returns {Promise<SessionState>}
   */
  async initSessionAdmin() {
    if (!this.sessionState){
      this.sessionState = this.sessions.create();
      this.sessionState.user = await this.initUsersAdmin();
    }
    return this.sessionState;
  }

  /**
   * Сессия без контроля доступа
   * @returns {Promise<SessionState>}
   */
  async initSessionRoot() {
    if (!this.sessionStateRoot){
      this.sessionStateRoot = this.sessions.create();
      this.sessionStateRoot.access = false;
    }
    return this.sessionStateRoot;
  }
}

module.exports = Init;
