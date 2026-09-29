import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import tailwindcss from 'eslint-plugin-tailwindcss';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  tailwindcss.configs.recommended,
  prettier,
  {
    settings: {
      tailwindcss: {
        cssConfigPath: './src/app/globals.css',
        functions: ['cn', 'clsx', 'cva'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'tailwindcss/classnames-order': 'off',
      'tailwindcss/no-custom-classname': 'off',
      'no-alert': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-arrow-callback': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'convex/_generated']),
]);

export default eslintConfig;
