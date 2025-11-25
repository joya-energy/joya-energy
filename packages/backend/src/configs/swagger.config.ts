import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JOYA Backend API',
      version: version,
      description: 'API Documentation for JOYA Project',
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
      contact: {
        name: 'JOYA Support',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Relative Path (Current Server)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/modules/**/*.routes.ts',
    './src/modules/**/*.controller.ts', 
    './src/modules/**/*.dto.ts' 
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

