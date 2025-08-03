// Simple ESLint Configuration
// Following project philosophy: simplicity over completeness

import js from '@eslint/js';

export default [
  // Global ignores
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
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        AbortController: 'readonly',
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
      'prefer-const': 'warn',
      'no-var': 'warn',
      eqeqeq: ['warn', 'always'],
      curly: ['warn', 'all'],

      // Security essentials
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Code clarity
      'no-debugger': 'warn',
      'no-alert': 'warn',
    },
  },

  // Specific configuration for built server files
  {
    files: ['server/**/*.js'],
    rules: {
      // More lenient for generated code
      'no-unused-vars': 'warn',
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
