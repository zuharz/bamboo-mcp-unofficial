module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../src', '<rootDir>/../test'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    '../src/**/*.ts',
    '!../src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  testTimeout: process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT, 10) : 10000
};