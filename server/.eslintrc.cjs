module.exports = {
  env: {
    es2021: true,
    node: true,
    jest: true
  },
  extends: ['standard'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  },
  overrides: [
    {
      files: ['src/**/*.test.js', 'src/**/__mocks__/**/*.js'],
      env: {
        jest: true
      }
    }
  ]
};

