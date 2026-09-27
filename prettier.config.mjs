/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf',
  plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/app/globals.css',
  tailwindFunctions: ['cn', 'clsx', 'cva', 'twMerge'],
  importOrder: [
    '<BUILTIN_MODULES>',
    '',
    '^react',
    '^next',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@/',
    '',
    '^[.]',
  ],
  importOrderSafeSideEffects: ['\\.css$'],
  importOrderParserPlugins: ['typescript', 'jsx'],
};

export default config;
