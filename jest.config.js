export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
    '^.+\\.js$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    // Handle .js imports in ES modules - Jest should find the actual .js files
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Ensure Jest can resolve both .js and .ts files
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    'server/**/*.js',
    '!src/**/*.d.ts',
    '!server/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
  maxWorkers: 1,
  forceExit: true,
};
