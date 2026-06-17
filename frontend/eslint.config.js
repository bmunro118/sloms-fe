// @ts-check
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import hooks from 'eslint-plugin-react-hooks';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    // Apply to all TS/TSX source files
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': hooks,
    },
    rules: {
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      /**
       * IMPORT BOUNDARY ENFORCEMENT
       *
       * The `app-shell` feature module exposes a single public barrel:
       *   src/features/app-shell/index.ts
       *
       * Direct imports into sub-modules are forbidden. Consumers MUST use:
       *   import { ... } from '../../src/features/app-shell';
       *
       * To ADD a new export, add it to src/features/app-shell/index.ts only.
       * To ADD a new sub-module, keep its internals private until exposed via the barrel.
       */
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/features/app-shell/context',
                '**/features/app-shell/context/**',
                '**/features/app-shell/layout-mode',
                '**/features/app-shell/layout-mode/**',
                '**/features/app-shell/navigation-policy',
                '**/features/app-shell/navigation-policy/**',
              ],
              message:
                "Do not import app-shell internals directly. Use the public barrel: import { ... } from 'src/features/app-shell' (or the relative equivalent).",
            },
          ],
        },
      ],
    },
  },
  {
    // Exclude generated, example, and config files from import-boundary checks
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      'src/features/app-shell/**', // internals are allowed to import each other
    ],
  },
];
