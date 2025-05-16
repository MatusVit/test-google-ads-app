export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  dialect: 'mysql';
  logging: boolean;
}

export interface Config {
  env: string;
  port: number;
  database: {
    development: DatabaseConfig;
    test: DatabaseConfig;
    production: DatabaseConfig;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    adsApiVersion: string;
    adsDeveloperToken: string;
  };
}
