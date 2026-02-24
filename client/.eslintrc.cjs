module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    // Tests (Jest, Testing Library)
    jest: 'readonly',
    describe: 'readonly',
    it: 'readonly',
    expect: 'readonly',

    // Node-style globals used in config / mocks / tests
    module: 'writable',
    require: 'readonly',
    __dirname: 'readonly'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',

    // Adapter ESLint au style existant du frontend
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off'
  },
  overrides: [
    {
      files: ['vite.config.js', 'playwright.config.*'],
      env: {
        node: true
      }
    },
    {
      files: ['tests/**/*.{js,jsx}', 'src/**/*.test.{js,jsx}', 'src/test/**'],
      env: {
        jest: true,
        node: true
      }
    }
  ]
};

