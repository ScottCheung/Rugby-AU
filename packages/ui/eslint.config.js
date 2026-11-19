import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  { files: ['**/*.ts', '**/*.tsx'], languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' }, globals: { console: 'readonly', document: 'readonly', window: 'readonly', navigator: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', HTMLElement: 'readonly', HTMLButtonElement: 'readonly', HTMLInputElement: 'readonly', Event: 'readonly' } }, plugins: { '@typescript-eslint': tsPlugin }, rules: { ...tsPlugin.configs.recommended.rules, 'no-undef': 'off', '@typescript-eslint/no-explicit-any': 'error' } }
];
