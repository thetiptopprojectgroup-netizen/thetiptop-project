/** ESLint 8 — modules ES + JSX (Vite / React). Sans ceci, le parseur traite le code comme du script ES5 → « import is reserved », etc. */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // Pas de PropTypes dans ce dépôt (composants en JS simple)
    'react/prop-types': 'off',
    // Textes FR avec apostrophes dans le JSX
    'react/no-unescaped-entities': 'off',
  },
  ignorePatterns: ['dist', 'node_modules'],
  overrides: [
    {
      files: ['scripts/**/*.js'],
      env: { node: true, es2022: true },
    },
    {
      files: ['public/sw.js'],
      env: { serviceworker: true, es2022: true },
    },
    {
      files: ['**/*.{test,spec}.{js,jsx}'],
      env: { jest: true, es2022: true },
    },
  ],
};
