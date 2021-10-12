/* eslint-env node, mocha */
'use strict';

const assert = require('assert');
const wpPot = require('../');
const testHelper = require('./test-helper');

describe('PHP', () => {
  describe('Function tests', () => {
    it('Can read all valid functions without domain check', () => {
      const fixturePath = 'test/fixtures/valid-functions.php';

      const potContents = wpPot({
        src: fixturePath,
        writeFile: false
      });

      testHelper.testValidFunctions(potContents, fixturePath);
    });

    it('Can read all valid functions with domain check', () => {
      const fixturePath = 'test/fixtures/valid-functions.php';

      const potContents = wpPot({
        src: fixturePath,
        domain: 'testdomain',
        writeFile: false
      });

      testHelper.testValidFunctions(potContents, fixturePath);
    });

    it('Can not find any functions with domain check if invalid domain', () => {
      const fixturePath = 'test/fixtures/valid-functions.php';

      const potContents = wpPot({
        src: fixturePath,
        domain: 'other-domain',
        writeFile: false
      });

      testHelper.testValidFunctions(potContents, fixturePath, true);
    });

    it('Can merge duplicate strings and separate with context', () => {
      const fixturePaths = [
        'test/fixtures/duplicated-strings-1.php',
        'test/fixtures/duplicated-strings-2.php'
      ];

      const potContents = wpPot({
        src: fixturePaths,
        writeFile: false,
        domain: 'testdomain'
      });

      for (const fixturePath of fixturePaths) {
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':2', 'Simple string', false, false));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':3', 'Simple string', false, false));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':4', 'Simple string', false, 'with context'));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':5', 'Simple string', false, 'with context'));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':6', 'Single and plural string', 'Plural string', false));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':7', 'Single and plural string', 'Plural string', false));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':8', 'Single and plural string', 'Plural string', 'with context'));
        assert(!testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':9', 'Simple string', false, false));
      }
    });
  });
});

describe('JavaScript', () => {
  describe('Function tests', () => {
    it('Can read all valid functions without domain check', () => {
      const fixturePath = 'test/fixtures/valid-functions.js';

      const potContents = wpPot({
        parser: 'js',
        src: fixturePath,
        writeFile: false
      });

      testHelper.testValidFunctions(potContents, fixturePath, false, 'js');
    });

    it('Can read all valid functions with domain check', () => {
      const fixturePath = 'test/fixtures/valid-functions.js';

      const potContents = wpPot({
        parser: 'js',
        src: fixturePath,
        domain: 'testdomain',
        writeFile: false
      });

      testHelper.testValidFunctions(potContents, fixturePath, false, 'js');
    });

    it('Can not find any functions with domain check if invalid domain', () => {
      const fixturePath = 'test/fixtures/valid-functions.js';

      const potContents = wpPot({
        parser: 'js',
        src: fixturePath,
        domain: 'other-domain',
        writeFile: false
      });

      testHelper.testValidFunctions(potContents, fixturePath, true, 'js');
    });

    it.skip('Can merge duplicate strings and separate with context', () => {
      const fixturePaths = [
        'test/fixtures/duplicated-strings-1.php',
        'test/fixtures/duplicated-strings-2.php'
      ];

      const potContents = wpPot({
        src: fixturePaths,
        writeFile: false,
        domain: 'testdomain'
      });

      for (const fixturePath of fixturePaths) {
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':2', 'Simple string', false, false));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':3', 'Simple string', false, false));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':4', 'Simple string', false, 'with context'));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':5', 'Simple string', false, 'with context'));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':6', 'Single and plural string', 'Plural string', false));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':7', 'Single and plural string', 'Plural string', false));
        assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':8', 'Single and plural string', 'Plural string', 'with context'));
        assert(!testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':9', 'Simple string', false, false));
      }
    });
  });
});
