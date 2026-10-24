const { createApp } = require('./app');
const { config } = require('./core/config');
const { log } = require('./core/logger');

const app = createApp();

app.listen(config.port, config.host, () => {
  log('INFO', 'server_started', {
    host: config.host,
    port: config.port,
    environment: config.environment,
  });
});
