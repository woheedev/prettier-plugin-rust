import { build } from 'tsup';

await build({
  dts: {
    resolve: true
  },
  tsconfig: 'tsconfig.json',
  entry: ['src/index.ts'],
  external: ['jinx-rust'],
  outDir: 'dist',
  format: ['cjs', 'esm'],
  treeshake: {
    preset: 'smallest',
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false
  }
});
