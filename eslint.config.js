const globals = require('globals');

module.exports = [
  {
    ignores: [
      '.tmp/**',
      'node_modules/**',
      'source/libs/**'
    ]
  },
  {
    files: ['scripts/**/*.js', 'source/js/**/*.js', 'test/**/*.js', 'tools/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.node,
        hexo: 'readonly'
      }
    },
    rules: {
      'array-callback-return': 'error',
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'off',
      'prefer-const': 'error',
      'semi': ['error', 'always']
    }
  }
];
