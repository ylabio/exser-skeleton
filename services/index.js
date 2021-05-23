const Services = require('exser').Services;

module.exports = class MyServices extends Services {

  /**
   * @returns {Promise.<Mail>}
   */
  async getMail() {
    return this.import(__dirname + '/mail');
  }

  /**
   * @returns {Promise<Init>}
   */
  async getInit() {
    return this.import(__dirname + '/init');
  }

  /**
   * @returns {Promise<InitMock>}
   */
  async getInitMock() {
    return this.import(__dirname + '/init-mock');
  }

  /**
   * @returns {Promise<RestAPI>}
   */
  async getRestApi(params) {
    return this.import(__dirname + '/rest-api', params);
  }

  /**
   * @returns {Promise<Auth>}
   */
  async getAuth(params) {
    return this.import(__dirname + '/auth', params);
  }

};
