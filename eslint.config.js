<<<<<<< Updated upstream
const globals = require('globals');
const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        // Add Jest/Mocha testing globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        before: 'readonly',
        after: 'readonly',
        jest: 'readonly',
        cy: 'readonly'
      },
      parserOptions: {
        allowImportExportEverywhere: true,
        sourceType: 'module'
      }
    },
    files: ['**/*.{js,mjs,cjs,jsx}'],
    plugins: {},
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-undef': 'error',
      'no-var': 'warn',
      'no-case-declarations': 'off' // Turn off no-case-declarations rule
    },
    ignores: [
      'node_modules/**',
      '_site/**',
      '.jekyll-cache/**',
      'vendor/**',
      'dist/**',
      'main_backup_*/**'
    ]
  },
  prettier
=======
// eslint.config.js
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '_site/**', '.git/**']
  },
  // CommonJS files configuration
  {
    files: ['**/scripts/**/*.js', '**/utils/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        // ES2021 globals
        Promise: 'readonly'
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
      noInlineConfig: false
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: true,
          tabWidth: 2,
          trailingComma: 'none',
          printWidth: 100,
          bracketSpacing: true,
          arrowParens: 'avoid'
        }
      ],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'error'
    }
  },
  // Test files configuration
  {
    files: ['**/tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        // Browser globals
        console: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error'
    }
  },
  // Web Workers configuration
  {
    files: ['**/workers-site/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Web Workers API
        addEventListener: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        self: 'readonly',
        // Other globals
        console: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error'
    }
  },
  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: {
        importSourceParser: 'typescript'
      },
      parserOptions: {
        project: './tsconfig.json'
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly'
      }
    },
    rules: {
      'no-undef': 'off' // TypeScript handles this
    }
  },
  // ES modules configuration (default)
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        // Node.js globals
        process: 'readonly',
        // ES2021 globals
        Promise: 'readonly'
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
      noInlineConfig: false
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: true,
          tabWidth: 2,
          trailingComma: 'none',
          printWidth: 100,
          bracketSpacing: true,
          arrowParens: 'avoid'
        }
      ],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'error'
    }
  }
>>>>>>> Stashed changes
];
