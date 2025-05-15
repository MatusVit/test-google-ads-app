import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';

export const initMigrations = async (sequelize: Sequelize) => {
  const umzug = new Umzug({
    migrations: {
      glob: ['../migrations/*.js', { cwd: __dirname }],
      resolve: ({ name, path, context }) => {
        const migration = require(path!);
        return {
          name,
          up: async () => migration.up(context.queryInterface, context.sequelize),
          down: async () => migration.down(context.queryInterface, context.sequelize),
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });

  // Check pending migrations
  const pending = await umzug.pending();
  if (pending.length > 0) {
    console.log('Pending migrations:', pending.map((m) => m.name).join(', '));
    console.log('Running migrations...');
    await umzug.up();
    console.log('Migrations completed successfully');
  } else {
    console.log('No pending migrations');
  }

  return umzug;
};
