import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import path, { resolve } from 'node:path';


export default defineConfig(() => {
  const outputDir = './build';

  return {
    resolve: {
      alias: {
        '@local': path.resolve(__dirname, './src'),
      },
    },
    publicDir: false,
    build: {
      sourcemap: true,
      outDir: outputDir,
      rootDir: './src',
      lib: {
        entry: {
          index: resolve(__dirname, 'src/index.ts'),
        },
        formats: ['es', 'cjs'],
        fileName: (format, name) => `${name}.${format}.js`,
      },
      rollupOptions: {
        external: ['node:fs', 'node:path', 'sharp'],
        output: {
          globals: {},
        },
      },
    },
    plugins: [
      dts({
        tsconfigPath: './tsconfig.json',
        outDir: outputDir,
        entryRoot: './src',
        compilerOptions: {
          rootDir: './src',
        },
        insertTypesEntry: true,
        logLevel: 'info',
      })
    ],
  };
});
