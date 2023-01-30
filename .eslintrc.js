/*
👋 Hi! This file was autogenerated by tslint-to-eslint-config.
https://github.com/typescript-eslint/tslint-to-eslint-config

It represents the closest reasonable ESLint configuration to this
project's original TSLint configuration.

We recommend eventually switching this configuration to extend from
the recommended rulesets in typescript-eslint.
https://github.com/typescript-eslint/tslint-to-eslint-config/blob/master/docs/FAQs.md

Happy linting! 💖
*/
export default {
    env: {
        browser: true,
        es6: true,
        node: true
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.spec.json',
        sourceType: 'module'
    },
    plugins: ['@angular-eslint/eslint-plugin', '@typescript-eslint'],
    extends: [
        // "eslint:recommended",
        // "plugin:@typescript-eslint/recommended",
        'plugin:prettier/recommended'
    ],
    root: true,
    ignorePatterns: [
        '/compiled/*',
        '/dist/*',
        'rollup.config.js',
        'jest.config.ts',
        '.eslintrc.js'
    ],
    rules: {
        '@angular-eslint/component-class-suffix': 'error',
        '@angular-eslint/component-selector': [
            'error',
            {
                type: 'element',
                prefix: 'app',
                style: 'kebab-case'
            }
        ],
        '@angular-eslint/directive-class-suffix': 'error',
        '@angular-eslint/directive-selector': [
            'error',
            {
                type: 'attribute',
                prefix: 'app',
                style: 'camelCase'
            }
        ],
        '@angular-eslint/no-input-rename': 'error',
        '@angular-eslint/no-output-rename': 'error',
        '@angular-eslint/use-pipe-transform-interface': 'error',
        '@typescript-eslint/consistent-type-definitions': 'error',
        '@typescript-eslint/consistent-type-exports': 'error',
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/dot-notation': 'off',
        '@typescript-eslint/explicit-member-accessibility': [
            'off',
            {
                accessibility: 'explicit'
            }
        ],
        '@typescript-eslint/member-ordering': 'error',
        '@typescript-eslint/naming-convention': [
            'error',
            {
                selector: 'variable',
                format: ['camelCase', 'UPPER_CASE'],
                leadingUnderscore: 'forbid',
                trailingUnderscore: 'forbid'
            },
            {
                selector: 'variable',
                modifiers: ['unused'],
                format: null,
                leadingUnderscore: 'require'
            }
        ],
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-inferrable-types': [
            'error',
            {
                ignoreParameters: true
            }
        ],
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-shadow': [
            'error',
            {
                hoist: 'all'
            }
        ],
        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/quotes': ['off', 'single'],
        '@typescript-eslint/unified-signatures': 'error',
        'arrow-body-style': 'warn',
        'constructor-super': 'error',
        curly: 'error',
        'dot-notation': 'off',
        eqeqeq: ['error', 'smart'],
        'guard-for-in': 'error',
        'id-denylist': 'off',
        'id-match': 'off',
        indent: 'off',
        'max-len': [
            'error',
            {
                code: 80
            }
        ],
        'no-bitwise': 'error',
        'no-caller': 'error',
        'no-console': [
            'error',
            {
                allow: [
                    'log',
                    'warn',
                    'dir',
                    'timeLog',
                    'assert',
                    'clear',
                    'count',
                    'countReset',
                    'group',
                    'groupEnd',
                    'table',
                    'dirxml',
                    'error',
                    'groupCollapsed',
                    'Console',
                    'profile',
                    'profileEnd',
                    'timeStamp',
                    'context'
                ]
            }
        ],
        'no-debugger': 'error',
        'no-empty': 'off',
        'no-empty-function': 'off',
        'no-eval': 'error',
        'no-fallthrough': 'error',
        'no-new-wrappers': 'error',
        'no-restricted-imports': [
            'error',
            {
                patterns: []
            }
        ],
        'no-shadow': 'off',
        'no-throw-literal': 'error',
        'no-undef-init': 'error',
        'no-underscore-dangle': 'off',
        'no-unused-expressions': 'off',
        'no-unused-labels': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        quotes: 'off',
        radix: 'error',
        semi: 'off',
        'spaced-comment': [
            'error',
            'always',
            {
                exceptions: ['/']
            }
        ]
    }
};
