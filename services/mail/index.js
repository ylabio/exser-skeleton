const nodemailer = require('nodemailer');
const mc = require('merge-change');
const {Service} = require('exser');

class Mail extends Service {

  async init(config, services) {
    this.config = config;
    this.transport = nodemailer.createTransport(config.transport, config.defaults);
  }

  createCustomTransport(config) {
    if (typeof config !== 'object') {
      config = {};
    }
    config = mc.merge(this.config, config);
    return nodemailer.createTransport(config.transport, config.defaults);
  }

  /**
   * Отправка письма
   * @param message {Object} @see https://nodemailer.com/message/
   * @returns {Promise<void>}
   */
  async send(message) {
    return this.transport.sendMail(message);
  }
}

module.exports = Mail;
