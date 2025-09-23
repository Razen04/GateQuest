import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
    { ignores: ['dist'] },
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            parser: tsParser, // <--- add TypeScript parser
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
            globals: globals.browser,
        },
        plugins: {
            '@typescript-eslint': tsPlugin, // <--- add TypeScript plugin
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...tsPlugin.configs.recommended.rules, // TypeScript recommended rules
            'no-unused-vars': 'off',
            indent: 'off',
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
];
