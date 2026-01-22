import express, { Router } from 'express';
import asyncRouter from 'express-promise-router';
import { NodeEnv, ServerConfig, banner } from './configs/index';
// Ensure configuration is loaded immediately
ServerConfig.initConfig();

import cookieParser from 'cookie-parser';
import http from 'http';
import cors from 'cors';
import { Logger } from './middlewares/logger.midddleware';
import { applyMiddleware } from './middlewares/common';
import middlewares from './middlewares';
import { contactRoutes } from './modules/contact/contact.routes';
import { auditEnergetiqueSimulationRoutes } from './modules/audit-energetique/audit-energetique.routes';
import { auditSolaireSimulationRoutes } from './modules/audit-solaire/audit-solaire.routes';
import { comparisonRoutes } from './interfaces/financing-comparison';
import { fileRoutes } from './modules/file/file.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './configs/swagger.config';

const createServer = async (): Promise<http.Server> => {
  const server = await createApp();
  const { PORT = 3000 } = process.env;
  return server.listen(PORT, () => {
    Logger.info(`Server is running on port ${PORT}`);
  });
};

export const useMiddleware = async (router: Router): Promise<void> => {
  await applyMiddleware(middlewares, router);
};

const createApp = async (): Promise<http.Server> => {
  const app = express();

  // DEBUG: Global Request Logger
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  const router = asyncRouter();

  app.use(cookieParser());
  // app.use(helmet()); // Moved below and configured
  // Increase limit to 50mb
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 1. CORS - Simplest permissive config for debugging
  app.use(cors());


  // 3. Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Mount router
  app.use(router);

  // Mount routes BEFORE other middleware to ensure they are matched
  router.use('/api/contacts', contactRoutes);
  router.use('/api/audit-energetique-simulations', auditEnergetiqueSimulationRoutes);
  router.use('/api/audit-solaire-simulations', auditSolaireSimulationRoutes);
  router.use('/api/financing-comparisons', comparisonRoutes);
  router.use('/api/files', fileRoutes);

  // Apply middleware (database checks etc) LAST if they are global
  // This will establish database connection before server starts accepting requests
  await useMiddleware(router);

  // Global Error Handler for debugging
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('Global Error Handler Caught:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  });

  if (ServerConfig.isEnv(NodeEnv.DEV)) {
    Logger.info(banner);
  }

  const server = http.createServer(app);
  return server;
};

export default createApp;
export { createServer, createApp };

