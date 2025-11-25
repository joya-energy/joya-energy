import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@backend/(.*)$': '<rootDir>/src/$1',
    '^@backend$': '<rootDir>/src/index',
    '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^@shared$': '<rootDir>/../shared/src/index.ts',
  },
  verbose: true,
};

export default config;

