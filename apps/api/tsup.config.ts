import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Bundle @repo/shared (exports raw .ts, no build step)
  // Do NOT bundle @repo/database (has its own tsup build → dist/)
  // Do NOT bundle @prisma/* (CJS require() internally)
  noExternal: ['@repo/shared'],
})
