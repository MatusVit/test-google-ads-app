import { Config } from './app.types';

const databaseConfig: Config['database'] = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'google_ads_db',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development',
  },
  test: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'google_ads_db_test',
    dialect: 'mysql',
    logging: false,
  },
  production: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'google_ads_db',
    dialect: 'mysql',
    logging: false,
  },
};

export default databaseConfig; 