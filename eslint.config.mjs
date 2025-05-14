import pluginJs from '@eslint/js'
import configPrettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'
import globals from 'globals'
import pluginTypescript from 'typescript-eslint'

export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  {
    languageOptions: {
      parser: pluginTypescript.parser,
      globals: {
        ...globals.node,
        ...globals.browser
      }
    }
  },
  ...pluginTypescript.configs.recommended,
  pluginJs.configs.recommended,
  configPrettier,
  {
    plugins: {
      prettier: pluginPrettier
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  }
]
