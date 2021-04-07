const exserRestApi = require('exser/services/rest-api');

class RestAPI extends exserRestApi{

  async start(params = {atFirst: null, atEnd: null, atError: null, atRequest: null, atResponse: null}) {
    const logs = await this.services.getLogs();
    return super.start({
      atFirst: async app => {
      },
      atError: async (result, error, req, res) => {
        logs.error({error, session: req.session, data:{status: res.statusCode}});
        logs.step({text: res.statusMessage, session: req.session, data: {status: res.statusCode}});
      },
      atResponse: (result, req, res) => {
        if (res.statusCode >= 300) {
          logs.step({text: res.statusMessage || 'Response', session: req.session, data: {status: res.statusCode}});
        }
      }
    })
  }
}

module.exports = RestAPI;
