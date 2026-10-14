import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'visuals'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: false }],
      // No swallowed errors: a catch must rethrow, exit, or at least log the error it caught
      'no-restricted-syntax': ['error', {
        selector: 'CatchClause:not(:has(ThrowStatement)):not(:has(CallExpression[callee.object.name="process"][callee.property.name="exit"])):not(:has(CallExpression[callee.object.name="console"][callee.property.name="error"]))',
        message: 'Do not swallow errors: rethrow, process.exit, or console.error the caught error.',
      }],
    },
  },
)
