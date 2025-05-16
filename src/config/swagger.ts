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
        GoogleAdsAccount: {
          type: 'object',
          required: ['customerId', 'descriptiveName', 'status'],
          properties: {
            customerId: { 
              type: 'string',
              description: 'Unique identifier for the Google Ads account',
              example: '123-456-7890'
            },
            descriptiveName: { 
              type: 'string',
              description: 'Display name of the account',
              example: 'My Business Account'
            },
            currencyCode: { 
              type: 'string',
              description: 'Account currency code',
              example: 'USD'
            },
            timeZone: { 
              type: 'string',
              description: 'Account timezone',
              example: 'America/New_York'
            },
            status: { 
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'CANCELLED'],
              description: 'Current status of the account'
            },
          },
        },
        GoogleAdsAccountCheck: {
          type: 'object',
          properties: {
            hasAccount: {
              type: 'boolean',
              description: 'Indicates if user has a Google Ads account'
            },
            accountDetails: {
              $ref: '#/components/schemas/GoogleAdsAccount',
              description: 'Account details if hasAccount is true'
            },
            createAccountUrl: {
              type: 'string',
              description: 'URL to create new Google Ads account if hasAccount is false',
              example: 'https://ads.google.com/nav/selectaccount'
            },
            message: {
              type: 'string',
              description: 'Error message if something goes wrong'
            }
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
    paths: {
      '/auth/check-ads-account': {
        get: {
          tags: ['Authentication'],
          summary: 'Check Google Ads account status',
          description: 'Check if the authenticated user has an associated Google Ads account',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Successfully retrieved account status',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GoogleAdsAccountCheck'
                  },
                  examples: {
                    'Has Account': {
                      value: {
                        hasAccount: true,
                        accountDetails: {
                          customerId: '123-456-7890',
                          descriptiveName: 'My Business Account',
                          currencyCode: 'USD',
                          timeZone: 'America/New_York',
                          status: 'ACTIVE'
                        }
                      }
                    },
                    'No Account': {
                      value: {
                        hasAccount: false,
                        createAccountUrl: 'https://ads.google.com/nav/selectaccount'
                      }
                    }
                  }
                }
              }
            },
            401: {
              description: 'Unauthorized - No valid access token',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'No Google access token found'
                      },
                      createAccountUrl: {
                        type: 'string',
                        example: 'https://ads.google.com/nav/selectaccount'
                      }
                    }
                  }
                }
              }
            },
            500: {
              description: 'Server error while checking account',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  },
                  example: {
                    message: 'Error checking Google Ads account'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts'], // путь к файлам с маршрутами
};

export const swaggerSpec = swaggerJsdoc(options);
