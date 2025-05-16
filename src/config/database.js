import config from './app.js';

export default {
  development: {
    ...config.database.development,
    logging: false
  },
  test: {
    ...config.database.test,
    logging: false
  },
  production: {
    ...config.database.production,
    logging: false
  }
}; 