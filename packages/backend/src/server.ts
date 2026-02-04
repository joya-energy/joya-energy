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
import { errorHandlers } from './middlewares/error.handlers';
import { contactRoutes } from './modules/contact/contact.routes';
import { auditEnergetiqueSimulationRoutes } from './modules/audit-energetique/audit-energetique.routes';
import { auditSolaireSimulationRoutes } from './modules/audit-solaire/audit-solaire.routes';
import { comparisonRoutes } from './interfaces/financing-comparison';
import { fileRoutes } from './modules/file/file.routes';
import { carbonSimulatorRoutes } from './modules/carbon-simulator/carbon-simulator.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './configs/swagger.config';
import { HttpStatusCode } from '@shared';

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
  // Body parsers: wrap so parse errors are passed to next(err) instead of crashing the process
  app.use((req, res, next) => {
    express.json({ limit: '50mb' })(req, res, (err: unknown) => {
      if (err) {
        next(err);
        return;
      }
      next();
    });
  });
  app.use((req, res, next) => {
    express.urlencoded({ extended: true, limit: '50mb' })(
      req,
      res,
      (err: unknown) => {
        if (err) {
          next(err);
          return;
        }
        next();
      }
    );
  });

  // 1. CORS - Simplest permissive config for debugging
  app.use(cors());

  // 3. Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Mount router
  app.use(router);

  // Mount routes BEFORE other middleware to ensure they are matched
  router.use('/api/contacts', contactRoutes);
  router.use(
    '/api/audit-energetique-simulations',
    auditEnergetiqueSimulationRoutes
  );
  router.use('/api/audit-solaire-simulations', auditSolaireSimulationRoutes);
  router.use('/api/financing-comparisons', comparisonRoutes);
  router.use('/api/files', fileRoutes);
  router.use('/api/carbon-simulator', carbonSimulatorRoutes);

  // Apply middleware (database checks etc) LAST if they are global
  // This will establish database connection before server starts accepting requests
  await useMiddleware(router);

  // Central error handlers: 4xx/5xx based on error type (must be applied to router so route errors are caught)
  for (const handler of errorHandlers) {
    handler(router);
  }

  // Body parse errors (SyntaxError, entity too large) happen before request reaches router → 400/413
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const e = err as Error & { status?: number; type?: string };
      if (err instanceof SyntaxError || e.type === 'entity.parse.failed') {
        Logger.warn(`Body parse error: ${e.message}`);
        res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ error: 'Invalid JSON or body format' });
        return;
      }
      if (e.status === 413) {
        Logger.warn('Request entity too large');
        res
          .status(HttpStatusCode.PAYLOAD_TOO_LARGE)
          .json({ error: 'Request body too large' });
        return;
      }
      next(err);
    }
  );

  // Last-resort global error handler: log, never expose stack/message in production
  app.use((err: unknown, _req: express.Request, res: express.Response) => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    Logger.error(message, stack != null ? { stack } : {});
    const safeMessage = ServerConfig.isEnv(NodeEnv.PROD)
      ? 'Internal Server Error'
      : message;
    res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ error: safeMessage });
  });

  if (ServerConfig.isEnv(NodeEnv.DEV)) {
    Logger.info(banner);
  }

  const server = http.createServer(app);
  return server;
};

export default createApp;
export { createServer, createApp };
