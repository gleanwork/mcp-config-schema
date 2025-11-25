import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    shims: true,
    minify: process.env.NODE_ENV === 'production',
    target: 'node18',
    external: ['configs'],
    platform: 'node',
  },
  {
    entry: ['src/browser.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    minify: process.env.NODE_ENV === 'production',
    target: 'es2020',
    platform: 'browser',
    external: ['mkdirp', 'glob', 'fs', 'path'],
    esbuildOptions(options) {
      options.conditions = ['browser'];
      options.loader = {
        '.json': 'json',
      };
      options.define = {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      };
    },
    noExternal: ['js-yaml', 'zod'],
  },
]);
