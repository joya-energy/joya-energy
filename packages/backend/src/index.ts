import { createServer } from './server';
import { Logger } from './middlewares/logger.midddleware';

// Prevent process crash on unhandled errors: log and respond gracefully
process.on(
  'unhandledRejection',
  (reason: unknown, _promise: Promise<unknown>) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    Logger.error(`Unhandled Rejection: ${msg}`, stack != null ? { stack } : {});
    // Do not exit: allow server to keep running; the failing request may have already returned 500
  }
);

process.on('uncaughtException', (err: Error) => {
  Logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  // Process state may be undefined; exit after a short delay so logs flush
  setTimeout(() => process.exit(1), 1000);
});

// Catch startup failures (e.g. DB connection) so they don't become unhandled rejections
createServer().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  Logger.error(`Server startup failed: ${msg}`, stack != null ? { stack } : {});
  process.exit(1);
});
