export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/utils/**/*.js',
    'src/middlewares/**/*.js',
    '!src/index.js',
    '!src/scripts/**',
    '!src/config/passport.js',
    '!src/models/**',
    '!src/utils/contestConfig.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  // Seuils relevés tant qu’il n’y a pas (ou peu) de tests sous tests/**/*.test.js
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
