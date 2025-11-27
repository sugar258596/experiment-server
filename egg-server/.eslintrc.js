module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'strict': ['error', 'global'],
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
};
