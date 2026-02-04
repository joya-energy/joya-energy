/**
 * Custom error classes for financing module
 */

export class FinancingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FinancingError';
  }
}

export class InvalidInputError extends FinancingError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}

export class CalculationError extends FinancingError {
  constructor(message: string) {
    super(message);
    this.name = 'CalculationError';
  }
}

export class InvalidLocationError extends FinancingError {
  constructor(location: string) {
    super(`Invalid location: ${location}`);
    this.name = 'InvalidLocationError';
  }
}

