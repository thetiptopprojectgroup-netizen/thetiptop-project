export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/utils/**/*.js',
    'src/middlewares/**/*.js',
    'src/models/Ticket.js',
    '!src/index.js',
    '!src/scripts/**',
    '!src/config/passport.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
