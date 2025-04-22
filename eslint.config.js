export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/_site/**', '**/.git/**']
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-undef': 'error',
      'no-var': 'error'
    }
  }
];
