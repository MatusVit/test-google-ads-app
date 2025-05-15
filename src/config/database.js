const config = require('./app').default;

module.exports = {
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