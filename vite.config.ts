import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'

import { peerDependencies } from './package.json'

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        '@local': path.resolve(__dirname, './src')
      }
    },
    plugins: [
      tsconfigPaths(),
      dts({
        include: ['src/'],
        exclude: [],
        rollupTypes: true,
        insertTypesEntry: true,
        tsconfigPath: './tsconfig.json'
      })
    ].filter(Boolean),
    publicDir: false,
    build: {
      sourcemap: true,
      outDir: './build',
      rootDir: './src',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      lib: {
        entry: {
          ['function-test']: resolve(__dirname, 'src/functions/test/index.ts')
        },
        formats: ['es', 'cjs'],
        fileName: (format, name) => `${name}.${format}.js`
      },
      rollupOptions: {
        external: Object.keys(peerDependencies),
        output: {
          globals: {}
        }
      }
    }
  }
})
