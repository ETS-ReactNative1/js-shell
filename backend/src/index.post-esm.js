// This must be included at the beginning of the stack in order to properly
// detect the Node.js uptime
import 'utils/node/nodeUptime';

// TODO: Handle this better
// @see https://medium.com/dailyjs/how-to-prevent-your-node-js-process-from-crashing-5d40247b8ab2
// @see https://medium.com/@trekinbami/using-environment-variables-in-react-6b0a99d83cf5
process.on('unhandledRejection', (reason/*, promise*/) => {
  console.error('Unhandled Rejection at:', reason.stack || reason);
  // or whatever crash reporting service you use
});

const expressServer = require('./servers/expressServer');

expressServer.start();
