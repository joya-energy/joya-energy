import express, { Router } from 'express';
import asyncRouter from 'express-promise-router';
import { NodeEnv, ServerConfig, banner } from './configs/index';
import cookieParser from 'cookie-parser';
import http from 'http';
import cors from 'cors';
import { Logger } from './middlewares/logger.midddleware';
import { applyMiddleware } from './middlewares/common';
import middlewares from './middlewares';
import { contactRoutes } from './modules/contact/contact.routes';
import { auditEnergetiqueSimulationRoutes } from './modules/audit-energetique/audit-energetique.routes';
import { auditSolaireSimulationRoutes } from './modules/audit-solaire/audit-solaire.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './configs/swagger.config';

const createServer = async (): Promise<http.Server> => {
  const server = createApp();
  const { PORT = 3000 } = process.env;
  return server.listen(PORT, () => {
    Logger.info(`Server is running on port ${PORT}`);
  });
};

export const useMiddleware = (router: Router): void => {
  applyMiddleware(middlewares, router);
};

const createApp = (): http.Server => {
  const app = express();
  const router = asyncRouter();

  app.use(cookieParser());
  // app.use(helmet()); // Moved below and configured
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // 1. CORS - Simplest permissive config for debugging
  app.use(cors());
  
  // 2. Helmet - Temporarily disabled to rule out security header issues
  // app.use(
  //   helmet({
  //     contentSecurityPolicy: false,
  //     crossOriginEmbedderPolicy: false,
  //   })
  // );

  // 3. Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(router);
  useMiddleware(router);

  router.use('/api/contacts', contactRoutes);
  router.use('/api/audit-energetique-simulations', auditEnergetiqueSimulationRoutes);
  router.use('/api/audit-solaire-simulations', auditSolaireSimulationRoutes);

  // Swagger Documentation (Moved to app.use above)
  // router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  if (ServerConfig.isEnv(NodeEnv.DEV)) {
    Logger.info(banner);
  }

  const server = http.createServer(app);
  return server;
};

export default createApp;
export { createServer, createApp };

