const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettier = require('eslint-config-prettier');
const sveltePlugin = require('eslint-plugin-svelte');
const turbo = require('eslint-config-turbo/flat').default;

const sveltePrettier = sveltePlugin.configs['flat/prettier'].find(
	(config) => config.name === 'svelte:prettier:turn-off-rules',
);

module.exports = [
	{
		ignores: [
			'**/node_modules/**',
			'**/.svelte-kit/**',
			'**/build/**',
			'**/dist/**',
			'**/out/**',
			'**/coverage/**',
			'**/storybook-static/**',
			'**/*.cjs',
		],
	},
	...turbo,
	...tsPlugin.configs['flat/recommended'],
	...sveltePlugin.configs['flat/recommended'],
	{
		files: ['**/*.ts', '**/*.svelte.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
			},
		},
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tsParser,
			},
		},
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'svelte/no-dom-manipulating': 'off',
			'svelte/prefer-svelte-reactivity': 'off',
			'svelte/require-each-key': 'off',
		},
	},
	prettier,
	sveltePrettier,
];
