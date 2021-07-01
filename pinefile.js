const { run, log } = require('@pinefile/pine');
const { build } = require('esbuild');
const rimraf = require('rimraf');

const buildOptions = (format) => ({
  entryPoints: ['./src/index.ts'],
  format,
  platform: 'node',
  target: 'node12',
  outfile: `./dist/${format}/index.js`,
});

module.exports = {
  build: async () => {
    log.info('Cleaning dist folder');
    rimraf.sync('dist');

    log.info('Building types');
    await run('tsc --emitDeclarationOnly --declaration --outDir "dist/types"');

    log.info('Building cjs');
    await build(buildOptions('cjs'));

    log.info('Building esm');
    await build(buildOptions('esm'));
  },
};
