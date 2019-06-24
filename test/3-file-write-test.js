/* eslint-env node, mocha */
'use strict';

const assert = require('assert');
const wpPot = require('../');
const fs = require('fs');
const os = require('os');

describe('File write tests', () => {
  it('should write a file named translations.pot when no destination is given', (done) => {
    const currentDir = process.cwd();
    process.chdir(os.tmpdir()); // Set temporary directory for file creation

    // Remove file if existing
    fs.unlink('translations.pot', () => {
      wpPot({
        src: 'test/fixures/empty-dir/*.php'
      });

      assert(fs.statSync('translations.pot').isFile());

      fs.unlinkSync('translations.pot'); // Remove file
      process.chdir(currentDir); // Set temporary directory for file creation
      done();
    });
  });

  it('should write a file to the correct destination when given', (done) => {
    const tempPot = os.tmpdir() + '/file-write-test.pot'; // Set temporary directory for file creation

    // Remove file if existing
    fs.unlink(tempPot, () => {
      wpPot({
        src: 'test/fixures/empty-dir/*.php',
        destFile: tempPot
      });
      assert(fs.statSync(tempPot).isFile());
      fs.unlinkSync(tempPot); // Remove file
      done();
    });
  });
});
