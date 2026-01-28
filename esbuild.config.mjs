#!/usr/bin/env node
import { build, context } from 'esbuild';
import { readFileSync } from 'fs'
import { sassPlugin } from 'esbuild-sass-plugin'

const pkg = JSON.parse(readFileSync('./package.json'))
const dateNow = (
  (new Date())
    .toLocaleString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric' })
).replace(/\//g, '-')

const defaultConfigs = {
  logLevel: 'info',
  entryPoints: ['src/main.ts', 'src/styles.scss'],
  loader: { '.ts': 'ts' },
  bundle: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
  target: 'es2022',
  outdir: 'dist',
  plugins: [
    sassPlugin(),
    {
      name: 'build-plugin',
      setup(build) {
        // build.onStart(() => {
        //   console.log('Building...');
        // });
        build.onEnd((result) => {
          if (result.errors.length) {
            console.error('Build failed with errors:', result.errors)
          } else if (result.warnings.length) {
            console.warn('Build succeeded with warnings:', result.warnings)
          }
          // console.info('Build succeeded');
        });
      },
    },
  ],
  define: {
    // Values have to be in JSON syntax
    VERSION: `'v${pkg.version} (${dateNow})'`,
  },
}


async function runDevServer() {
  try {
    const ctx = await context(defaultConfigs)
    await ctx.serve({
      servedir: 'dist',
      port: 4600,
    })
    await ctx.watch();
  } catch (error) {
    console.error('An error occurred during esbuild setup:', error);
    process.exit(1);
  }
}


if (process.argv.includes('--serve')) {
  runDevServer()
} else {
  // console.log(`Building ${defaultConfigs.define.VERSION}`)
  build(defaultConfigs)
    .catch(() => process.exit(1));
}
