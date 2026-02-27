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
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Adapter ESLint au style déjà présent dans le projet
    semi: 'off',
    'comma-dangle': 'off',
    camelcase: 'off',
    'no-trailing-spaces': 'off',
    'space-before-function-paren': 'off',
    'brace-style': 'off',
    'multiline-ternary': 'off',
    quotes: 'off',
    indent: 'off',
    'object-shorthand': 'off',
    'prefer-const': 'off'
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

