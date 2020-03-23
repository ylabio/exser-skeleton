const {Services} = require('exser');

module.exports = class MyServices extends Services {

  /**
   * @returns {Promise.<Mailer>}
   */
  async getMail(params) {
    return this.import(__dirname + '/mail', params);
  }

  /**
   * @returns {Promise<Init>}
   */
  async getInit(params) {
    return this.import(__dirname + '/init', params);
  }

  /**
   * @returns {Promise<InitExample>}
   */
  async getInitExample(params) {
    return this.import(__dirname + '/init-example', params);
  }
};
