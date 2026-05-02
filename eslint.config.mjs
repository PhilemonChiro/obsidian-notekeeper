import obsidianmd from 'eslint-plugin-obsidianmd';
import tsParser from '@typescript-eslint/parser';

const plugin = obsidianmd.default || obsidianmd;

export default [
  ...plugin.configs.recommended,
  {
    files: ['main.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ['main.js', 'node_modules/**', 'docs/**', 'launch/**'],
  },
  {
    files: ['main.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'error',
    },
  },
];
