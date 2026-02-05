import { createLogger, format, transports } from 'winston';
import { addColors } from 'winston/lib/winston/config';
import * as fs from 'fs';
import * as path from 'path';
import { NodeEnv } from '../configs/node-env.enum';

// Log level constants
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  DEBUG: 'debug',
} as const;

const isProduction = process.env.NODE_ENV === NodeEnv.PROD;

// Only use file transports when not in production (containers often have read-only FS; Railway captures stdout)
let logsDir: string | null = null;
if (!isProduction && process.env.NODE_ENV !== NodeEnv.TEST) {
  try {
    logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch {
    logsDir = null;
  }
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Get log level from environment or default based on NODE_ENV
// LOG_LEVEL env var (e.g. 'debug' | 'info' | 'warn' | 'error') overrides the default.
const getLogLevel = (): string => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (
    envLevel &&
    Object.values(LOG_LEVELS).includes(
      envLevel as (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS]
    )
  ) {
    return envLevel;
  }
  return process.env.NODE_ENV === NodeEnv.PROD
    ? LOG_LEVELS.WARN
    : LOG_LEVELS.DEBUG;
};

const isDebug = (): boolean => {
  return process.env.NODE_ENV === NodeEnv.DEV;
};

const colors = {
  error: 'bold red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

addColors(colors);

const formatLogs = format.combine(
  format.errors({ stack: isDebug() }),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.colorize({ all: true }),
  format.printf(
    (info) => `${String(info.timestamp)} ${info.level}: ${String(info.message)}`
  )
);

// Console transport for all environments
const consoleTransport = new transports.Console();

// File transports (only when logsDir is available and not in production)
const isTest = process.env.NODE_ENV === NodeEnv.TEST;
const fileTransports =
  isTest || !logsDir
    ? []
    : [
        new transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: LOG_LEVELS.ERROR,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new transports.File({
          filename: path.join(logsDir, 'all.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ];

const loggerOptions = {
  level: getLogLevel(),
  levels,
  format: formatLogs,
  transports: [consoleTransport, ...fileTransports],
  handleExceptions: true,
  exceptionHandlers: [
    consoleTransport,
    ...(isTest || !logsDir
      ? []
      : [
          new transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
          }),
        ]),
  ],
  rejectionHandlers: [
    consoleTransport,
    ...(isTest || !logsDir
      ? []
      : [
          new transports.File({
            filename: path.join(logsDir, 'rejections.log'),
          }),
        ]),
  ],
};

export const Logger = createLogger(loggerOptions);

export default Logger;
