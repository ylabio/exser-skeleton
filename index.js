const Services = require('./services');
const {parseCommands} = require('exser/utils/arrays');

(async () => {
  // Configure service manager
  const services = new Services();
  await services.init(['configs.js', 'configs.local.js']);
  // Start some services by params from CLI
  // @example > node index.js rest-api --port:8080
  // @example await services.start([{name: rest-api, params: {port: 8080}}]);
  await services.start(parseCommands(process.argv.slice(2)));
})();

process.on('unhandledRejection', function (error/*, p*/) {
  console.log(error);
  process.exit(1);
});