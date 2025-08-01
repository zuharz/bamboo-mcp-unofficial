// Layer 3: Security & Quality Rules (Industry Best Practices)
// Production-ready configuration with security and code quality rules

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';

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

  // Base JavaScript configuration
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
      },
    },
    plugins: {
      security,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...security.configs.recommended.rules,

      // Essential quality rules
      'no-console': 'off', // Required for MCP server
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

      // Security rules (customize for MCP server context)
      'security/detect-object-injection': 'warn', // Often false positive with API data
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',

      // Additional security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Code clarity
      'no-debugger': 'error',
      'no-alert': 'error',
    },
  },

  // TypeScript source files configuration
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      security,
    },
    rules: {
      // Base TypeScript recommended rules
      ...tseslint.configs.recommended.rules,

      // Security rules for TypeScript
      ...security.configs.recommended.rules,
      'security/detect-object-injection': 'warn', // Tuned for API usage

      // Override JS rules for TS
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // TypeScript specific
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-empty-function': 'warn',

      // Code quality
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // Import/Export quality
      'no-duplicate-imports': 'error',
    },
  },

  // Test files - more lenient rules
  {
    files: ['test/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'security/detect-object-injection': 'off', // Test data is safe
    },
  },

  // Built server files - production validation
  {
    files: ['server/**/*.js'],
    plugins: {
      security,
    },
    rules: {
      // Basic validation for built files
      'no-unused-vars': 'warn',
      'no-console': 'off', // Required for MCP server

      // Security rules for production code
      ...security.configs.recommended.rules,
      'security/detect-object-injection': 'warn', // API data context

      // Performance-critical rules only
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },

  // Configuration files
  {
    files: ['*.config.js', '*.config.mjs', '*.config.ts'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'security/detect-non-literal-require': 'off',
    },
  },
];
