import { NodeEnv, ServerConfig } from '../configs/index';
import { Logger } from './logger.midddleware';
import { type NextFunction, type Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';

export const dbDisconnect = async (): Promise<void> => {
  await mongoose.disconnect();
};

export const dbConnectToPlatform = async (uri?: string): Promise<void> => {
  Logger.info('Connecting to database...');
  if (!uri) {
    throw new Error('Could not connect to database: no uri specified');
  }
  if (ServerConfig.isDebug()) {
    mongoose.set('debug', false);
    const regexResults = uri.match(/mongodb\+srv:\/\/[^:]+:([a-zA-Z0-9]+)@/);
    const password = regexResults != null && regexResults.length === 2 ? regexResults[1] : '';
    Logger.debug(`Database uri used: ${String(uri).replace(password, '********')}`);
    Logger.debug(`running on port ${process.env.PORT}`);
  }
  mongoose.connection.once('open', () => {
    Logger.info('Database connection opened');
  });
  mongoose.connection.on('disconnected', () => Logger.info(`Disconnected`));
  mongoose.connection.on('connected', () => Logger.info(`Connected to database !`));
  mongoose.connection.on('error', (err) => {
    Logger.error(`Database connection error: ${String(err)}`);
  });
  
  try {
    await mongoose.connect(uri);
    Logger.info('Database connection established successfully');
  } catch (err) {
    Logger.error(`Failed to connect to database: ${String(err)}`);
    throw err;
  }
};

export const handleDataBaseConnection = async (router: Router): Promise<void> => {
  // Add middleware to handle database disconnection
  if (!ServerConfig.isEnv(NodeEnv.TEST)) {
    router.use((_req: Request, res: Response, next: NextFunction) => {
      const errorDict: Record<number, string> = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      // TODO: We should think about cases where request does not rely on database connection (cached requests, 3rd party APIs)
      if (mongoose.connection.readyState === 1) {
        next();
      } else {
        Logger.error(`Could not resolve request: Database currently ${errorDict[mongoose.connection.readyState]}`);
        res.status(503).send('Could not resolve request, try again later');
      }
    });

    // Connect to db
    await dbConnectToPlatform(ServerConfig.config.dbUri);
  }
};
