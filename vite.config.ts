import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'

import { peerDependencies } from './package.json'
import { pluginUpdateReadmePD } from './src/plugins/update-readme-peer-dependencies'

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        '@local': path.resolve(__dirname, './src')
      }
    },
    plugins: [
      pluginUpdateReadmePD({
        insertionPoint: '## Peer Dependencies',
        pathPackageJson: resolve(__dirname, 'package.json'),
        pathReadme: resolve(__dirname, 'README.md')
      }),
      tsconfigPaths(),
      dts({
        include: ['src/'],
        exclude: [],
        rollupTypes: true,
        insertTypesEntry: true,
        tsconfigPath: './tsconfig.json'
      })
    ],
    publicDir: false,
    build: {
      sourcemap: true,
      outDir: './build',
      rootDir: './src',
      minify: 'terser',
      terserOptions: {
        compress: {
          // drop_console: true,
          // drop_debugger: true
        }
      },
      lib: {
        entry: {
          ['main']: resolve(__dirname, 'src/main.ts')
        },
        formats: ['es', 'cjs'],
        fileName: (format, name) => `${name}.${format}.js`
      },
      rollupOptions: {
        external: [...Object.keys(peerDependencies), 'fs', 'path', 'os', 'sharp'],
        output: {
          globals: {}
        }
      }
    }
  }
})
