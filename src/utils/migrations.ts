import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initMigrations = async (sequelize: Sequelize) => {
  const queryInterface = sequelize.getQueryInterface();

  const umzug = new Umzug({
    migrations: {
      glob: ['../migrations/*.js', { cwd: __dirname }],
      resolve: ({ name, path }) => {
        const fileUrl = pathToFileURL(path!).toString();
        return {
          name,
          async up() {
            const migration = await import(fileUrl);
            return migration.up(queryInterface, Sequelize);
          },
          async down() {
            const migration = await import(fileUrl);
            return migration.down(queryInterface, Sequelize);
          }
        };
      },
    },
    context: queryInterface,
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
