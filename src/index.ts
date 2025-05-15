import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { sequelize } from './models';
import { initMigrations } from './utils/migrations';
import config from './config/app';
import authRoutes from './routes/auth';
import campaignRoutes from './routes/campaigns';
import managedAccountRoutes from './routes/managed-accounts';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/managed-accounts', managedAccountRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Initialize database and start server
const initializeApp = async () => {
  try {
    // Check database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Run migrations
    await initMigrations(sequelize);

    // Sync models (this will not override migrations)
    await sequelize.sync();

    // Start server
    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port} in ${config.env} mode`);
      console.log(`API Documentation available at http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    console.error('Unable to start application:', error);
    process.exit(1);
  }
};

initializeApp();
