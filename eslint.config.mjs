import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  eslint.configs.recommended,
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.strict,
      // ...tseslint.configs.stylistic, // stylistic rules that improve code consistency
    ],
    // Override specific rules for TypeScript files (these will take priority over the extended configs above)
    rules: {
      'no-alert': 'error',
      'no-console': ['error', {allow: ['error','warn']}],
      'no-debugger': 'error',
      'default-param-last': 'off',
      '@typescript-eslint/default-param-last': 'error',
      'init-declarations': 'off',
      '@typescript-eslint/init-declarations': 'warn',
      '@typescript-eslint/method-signature-style': 'error',
      'no-extra-boolean-cast': 'off',

      // ------------------------------------------------------------
      // Selection from stylistic TS rules
      // ------------------------------------------------------------
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/array-type': ['error', {default: 'array'}],
      '@typescript-eslint/ban-tslint-comment': 'error',
      '@typescript-eslint/class-literal-property-style': 'error',
      '@typescript-eslint/consistent-generic-constructors': 'error',
      '@typescript-eslint/no-confusing-non-null-assertion': 'error',
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/consistent-type-imports': [
        // ESLint docs
        // - https://typescript-eslint.io/rules/consistent-type-imports/
        // - https://typescript-eslint.io/blog/consistent-type-imports-and-exports-why-and-how/
        // Typescript docs:
        // - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#type-modifiers-on-import-names
        'error',
        {
          disallowTypeAnnotations: true,
          fixStyle: 'separate-type-imports',
          prefer: 'type-imports',
        },
      ],

      // ------------------------------------------------------------
      // Modifications to strict TS rules
      // ------------------------------------------------------------
      '@typescript-eslint/no-dynamic-delete': 'error',
      '@typescript-eslint/no-extraneous-class': ['error', {allowWithDecorator: true}],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Enums are not allowed. Please use discriminated unions or other alternatives.',
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          'accessibility': 'explicit',
          'overrides': {
            'accessors': 'explicit',
            'constructors': 'no-public',
            'methods': 'explicit',
            'properties': 'explicit',
            'parameterProperties': 'explicit',
          },
        }
      ],
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    }
  },
);
