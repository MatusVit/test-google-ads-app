import { Sequelize } from 'sequelize';
import User from './user';
import ManagedAccount from './managed-account';
import Campaign from './campaign';
import databaseConfig from '../config/database';

type Environment = 'development' | 'test' | 'production';
const env = (process.env.NODE_ENV || 'development') as Environment;
const config = databaseConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: config.logging,
});

const models = {
  User: User(sequelize),
  ManagedAccount: ManagedAccount(sequelize),
  Campaign: Campaign(sequelize),
};

Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

export { sequelize };
export default models;
