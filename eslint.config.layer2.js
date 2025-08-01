// Layer 2: TypeScript Support (Industry Best Practices)
// Adds TypeScript-aware linting with minimal security rules

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

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
    rules: {
      ...js.configs.recommended.rules,

      // Essential quality rules
      'no-console': 'off',
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

      // Security essentials (replaces missing security plugin)
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
        project: true, // Enable type-aware rules
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
    },
    rules: {
      // Extend TypeScript recommended rules
      ...tseslint.configs.recommended.rules,

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
    },
  },

  // Built server files - handle legacy comments
  {
    files: ['server/**/*.js'],
    rules: {
      'no-unused-vars': 'warn',
      // Ignore security comments that reference missing plugins
      'no-inline-comments': 'off',
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
    },
  },
];
