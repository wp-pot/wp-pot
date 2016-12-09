/* eslint-env node, mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const wpPot = require('../');
const fs = require('fs');
const os = require('os');

describe('File write tests', function () {
  it('should write a file named translations.pot when no destination is given', function () {
    const currentDir = process.cwd();
    process.chdir(os.tmpdir()); // Set temporary directory for file creation
    fs.unlink('translations.pot', function () {}); // Remove file if existing
    wpPot({
      src: 'test/fixures/empty-dir/*.php'
    });
    assert(fs.statSync('translations.pot').isFile());
    fs.unlink('translations.pot', function () {}); // Remove file
    process.chdir(currentDir); // Set temporary directory for file creation
  });

  it('should write a file to the correct destination when given', function () {
    const tempPot = os.tmpdir() + '/file-write-test.pot'; // Set temporary directory for file creation
    fs.unlink(tempPot, function () {}); // Remove file if existing
    wpPot({
      src: 'test/fixures/empty-dir/*.php',
      destFile: tempPot
    });
    assert(fs.statSync(tempPot).isFile());
    fs.unlink(tempPot, function () {}); // Remove file
  });
});
