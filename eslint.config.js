const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const jestPlugin = require('eslint-plugin-jest');
const securityPlugin = require('eslint-plugin-security');
const prettierConfig = require('eslint-config-prettier');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  {
    ignores: ['node_modules/**', 'bin/**', 'eslint.config.js'],
  },
  ...compat.extends('airbnb-base'),
  jestPlugin.configs['flat/recommended'],
  securityPlugin.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2019,
      sourceType: 'commonjs',
      globals: {
        node: true,
        jest: true,
      },
    },
    rules: {
      'no-console': 'error',
      'func-names': 'off',
      'no-underscore-dangle': 'off',
      'consistent-return': 'off',
      'jest/expect-expect': 'off',
      'security/detect-object-injection': 'off',
    },
  },
];