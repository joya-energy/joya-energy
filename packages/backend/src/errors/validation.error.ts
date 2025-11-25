export class ApiValidationError extends Error {
    data: Record<string, unknown>;
    constructor(message: string, data: Record<string, unknown>) {
      super(message);
      this.data = data;
    }
  }
  