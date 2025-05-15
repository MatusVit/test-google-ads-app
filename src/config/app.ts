import dotenv from 'dotenv';
import { Config } from './app.types';

// Load environment variables
dotenv.config();

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    development: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'google_ads_db',
      dialect: 'mysql',
    },
    test: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'google_ads_db_test',
      dialect: 'mysql',
    },
    production: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'google_ads_db',
      dialect: 'mysql',
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_key_change_it',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    adsApiVersion: process.env.GOOGLE_ADS_API_VERSION || 'v14',
    adsDeveloperToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
  },
};

export default config;
