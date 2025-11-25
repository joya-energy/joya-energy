/* eslint-disable max-classes-per-file */
export abstract class ServerError extends Error {
    protected constructor(message: Record<string, unknown> | string) {
      if (message instanceof Object) {
        super(JSON.stringify(message));
      } else {
        super(message);
      }
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export class RepositoryError extends ServerError {
    resourceInformation: Record<string, unknown>;
    constructor(message: string | Record<string, unknown> = 'Repository Error', resourceInformation: Record<string, unknown> = {}) {
      super(message);
      this.resourceInformation = resourceInformation;
    }
  }
  
  export class ServiceError extends ServerError {
    constructor(message: string | Record<string, unknown> = 'Service Error') {
      super(message);
    }
  }
  
  export class ControllerError extends ServerError {
    constructor(message: string | Record<string, unknown> = 'Controller Error') {
      super(message);
    }
  }
  
  export class AdapterError extends ServerError {
    constructor(message: string | Record<string, unknown> = 'Adapter Error') {
      super(message);
    }
  }
  
  export class MongooseError extends ServerError {
    constructor(message: string | Record<string, unknown> = 'Mongoose Error') {
      super(message);
    }
  }
  
  // TODO: Add a custom async validator that calls this error on such cases
  export class UniqueConstraintError<T> extends MongooseError {
    key: keyof T;
    constructor(key: keyof T) {
      super(`Unique Key constraint violated for key ${String(key)}`);
      this.key = key;
    }
  }
  