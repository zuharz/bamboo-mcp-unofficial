// Layer 1: Essential ESLint Configuration (Industry Best Practices)
// Minimal dependencies, maximum compatibility

import js from '@eslint/js';

export default [
  // Global ignores - files we never want to lint
  {
    ignores: [
      'node_modules/**/*',
      'dist/**/*',
      'coverage/**/*',
      '*.dxt',
      '.cursor/**/*',
    ],
  },

  // Base configuration for all JavaScript files
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        // Modern JS globals
        fetch: 'readonly',
        Response: 'readonly',
      },
    },
    rules: {
      // Use ESLint recommended rules as baseline
      ...js.configs.recommended.rules,

      // Essential code quality rules
      'no-console': 'off', // Allowed for MCP server logging
      'no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // Security essentials
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Code clarity
      'no-debugger': 'error',
      'no-alert': 'error',
    },
  },

  // Specific configuration for built server files
  {
    files: ['server/**/*.js'],
    rules: {
      // More lenient for generated code
      'no-unused-vars': 'warn',
    },
    settings: {
      // Ignore unknown rule comments in built files
      'eslint-comments-require-description': false,
    },
  },

  // Configuration files
  {
    files: ['*.config.js', '*.config.mjs'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
  },
];
