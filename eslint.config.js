// @ts-check

import globals from 'globals';
import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Global defaults
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', '.git/**'],
    linterOptions: {
      reportUnusedDisableDirectives: false, // Don't warn about unused eslint-disable
      noInlineConfig: false,               // Allow inline eslint comments
    },
  },

  // Base JS config
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',  // Make React globally available
        ReactDOM: 'readonly', // Make ReactDOM globally available
      },
    },
    rules: {
      // Downgrade errors to warnings or off
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'no-redeclare': 'warn',
      'getter-return': 'warn',
      'no-constant-condition': 'warn',
      'no-prototype-builtins': 'warn',
      'no-cond-assign': 'warn',
      'no-case-declarations': 'warn',
      'no-useless-catch': 'off',
    },
  },

  // React JSX config
  {
    files: ['frontend/my-react-app*/src/**/*.js'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        jsxPragma: null,
      },
      globals: {
        ...globals.browser,
        JSX: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'warn',
      'react/no-deprecated': 'warn',
    },
  },

  // TypeScript config
  {
    ...tseslint.configs.recommended[0],
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },

  // Ignore specific TypeScript files in webapp that have their own config
  {
    files: ['frontend/frontend/webapp/**/*.{ts,tsx}'],
    ignores: ['frontend/frontend/webapp/**/*.{ts,tsx}'],
  },
];
