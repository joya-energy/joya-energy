import { type NextFunction, type Request, type Response, type Router } from 'express';
import { HTTPClientError } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { NodeEnv, ServerConfig } from '@backend/configs';
import { HttpStatusCode } from '@shared';
import { RepositoryError } from '@backend/errors/server.error';
import { ApiValidationError } from '@backend/errors';

export const handleApiValidationError = (router: Router): void => {
  router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApiValidationError) {
      Logger.error(err);
      res.status(HttpStatusCode.BAD_REQUEST).send({ message: err.message, error: err.data });
    } else {
      next(err);
    }
  });
};

export const handleClientError = (router: Router): void => {
  router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HTTPClientError) {
      Logger.error(err);
      res.status(err.statusCode).send({ message: err.message });
    } else {
      next(err);
    }
  });
};

export const handleRepositoryError = (router: Router): void => {
  router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof RepositoryError) {
      Logger.error(err);
      res.status(HttpStatusCode.NOT_FOUND).send({ message: 'Impossible to retrieve resource', error: err.resourceInformation });
    } else {
      next(err);
    }
  });
};

export const handleServerError = (router: Router): void => {
  router.use((err: Error, _req: Request, res: Response) => {
    Logger.error(err);
    const message = ServerConfig.isEnv(NodeEnv.PROD) ? 'Internal Server Error' : err.stack;
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send({ message });
  });
};

export const errorHandlers = [handleRepositoryError, handleApiValidationError, handleClientError, handleServerError];
