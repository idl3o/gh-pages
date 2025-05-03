module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  extends: ['eslint:recommended'],
  overrides: [
    // Configuration for React apps
    {
      files: ['frontend/my-react-app*/src/**/*.js'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      extends: ['plugin:react/recommended'],
      plugins: ['react'],
      rules: {
        'react/react-in-jsx-scope': 'off', // Not needed in newer React versions
        'react/prop-types': 'warn', // Downgrade to warning
        'no-unused-vars': 'warn' // Downgrade to warning for development
      },
      settings: {
        react: {
          version: 'detect'
        }
      }
    },
    // Ignore Vite and TypeScript files in webapp
    {
      files: ['frontend/frontend/webapp/**/*.{ts,tsx}'],
      ignorePatterns: ['**/*']
    }
  ]
};
