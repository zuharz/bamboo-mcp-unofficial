// Production ESLint Configuration (Industry Best Practices)
// Layer 4: Performance-optimized, production-ready linting
// Follows industry standards for TypeScript MCP server development

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';

export default [
  // Global ignores - performance optimization
  {
    ignores: [
      // Build outputs
      'node_modules/**/*',
      'dist/**/*',
      'coverage/**/*',
      'build/**/*',
      '*.dxt',

      // Development
      '.cursor/**/*',
      '.vscode/**/*',
      '.git/**/*',

      // Temporary
      '*.tmp',
      '*.temp',
      '.cache/**/*',
    ],
  },

  // Base JavaScript configuration
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js environment
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',

        // Modern JavaScript
        fetch: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    plugins: {
      security,
    },
    rules: {
      // ESLint recommended baseline
      ...js.configs.recommended.rules,

      // Security rules (essential for production)
      ...security.configs.recommended.rules,

      // Core quality rules
      'no-console': 'off', // Required for MCP server logging
      'no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Modern JavaScript best practices
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'no-duplicate-imports': 'error',

      // Security (tuned for MCP server context)
      'security/detect-object-injection': 'warn', // API data context
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

      // Additional security hardening
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Code clarity
      'no-debugger': 'error',
      'no-alert': 'error',
      'spaced-comment': ['error', 'always', { markers: ['/'] }],
    },
  },

  // TypeScript source files (development-focused)
  {
    files: ['src/**/*.ts'],
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
      // TypeScript recommended baseline
      ...tseslint.configs.recommended.rules,

      // Security for TypeScript
      ...security.configs.recommended.rules,
      'security/detect-object-injection': 'warn',

      // Override JavaScript rules for TypeScript
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // TypeScript-specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // Code quality
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'prefer-template': 'error',
      'no-duplicate-imports': 'error',
    },
  },

  // Test files - lenient but secure
  {
    files: ['test/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
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
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      security,
    },
    rules: {
      // More lenient for test files
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',

      // Still maintain quality
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Built server files - production validation
  {
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js environment
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',

        // Node.js APIs
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        AbortController: 'readonly',

        // Modern JavaScript
        fetch: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    plugins: {
      security,
    },
    rules: {
      // Validation for production code
      'no-unused-vars': 'warn',
      'no-console': 'off', // Required for MCP server

      // Security rules for production
      ...security.configs.recommended.rules,
      'security/detect-object-injection': 'warn',

      // Critical rules only for performance
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-debugger': 'error',
    },
  },

  // Configuration files and ESLint rules
  {
    files: [
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'eslint-*.js',
      'jest.config.js',
    ],
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
      'security/detect-unsafe-regex': 'off', // ESLint rules may contain complex regex patterns
    },
  },
];
