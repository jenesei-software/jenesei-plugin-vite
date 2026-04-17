import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import path, { resolve } from 'node:path';

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        '@local': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      dts({
        include: ['src/'],
        exclude: [],
        rollupTypes: true,
        insertTypesEntry: true,
        tsconfigPath: './tsconfig.json',
      }),
    ].filter(Boolean),
    publicDir: false,
    build: {
      sourcemap: true,
      outDir: './build',
      rootDir: './src',
      lib: {
        entry: {
          index: resolve(__dirname, 'src/index.ts'),
        },
        formats: ['es', 'cjs'],
        fileName: (format, name) => `${name}.${format}.js`,
      },
      rollupOptions: {
        external: ['fs', 'path', 'os', 'sharp'],
        output: {
          globals: {},
        },
      },
    },
  };
});
