import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Google Ads Manager API',
      version: '1.0.0',
      description: 'API for managing Google Ads accounts and campaigns',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            googleId: { type: 'string' },
            picture: { type: 'string' },
          },
        },
        ManagedAccount: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            managedGoogleId: { type: 'string' },
            managedEmail: { type: 'string', format: 'email' },
            adsAccountId: { type: 'string' },
          },
        },
        Campaign: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            managedAccountId: { type: 'integer' },
            campaignId: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string', enum: ['ENABLED', 'PAUSED', 'REMOVED'] },
            budget: { type: 'number' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // путь к файлам с маршрутами
};

export const swaggerSpec = swaggerJsdoc(options); 