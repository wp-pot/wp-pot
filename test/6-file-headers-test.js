/* eslint-env node, mocha */
/* global before, after, describe, it */
'use strict';

const assert = require('assert');
const wpPot = require('../');
const testHelper = require('./test-helper');

describe('File Headers tests', () => {
  it('Can read theme headers', () => {
    const fixturePath = 'test/fixtures/theme-headers.php';

    const potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      metadataFile: fixturePath
    });

    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':3', 'Test Theme', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':4', 'Rasmus Bengtsson', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':5', 'Test Description', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':6', 'http://www.example.org', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':7', 'http://www.example.com', false, false));
  });

  it('Can read plugin headers', () => {
    const fixturePath = 'test/fixtures/plugin-headers.php';

    const potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      metadataFile: fixturePath
    });

    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':3', 'Test Plugin', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':4', 'Rasmus Bengtsson', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':5', 'Test Description', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':6', 'http://www.example.org', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':7', 'http://www.example.com', false, false));
  });

  it('Can read template name headers', () => {
    const fixturePath = 'test/fixtures/template-headers.php';

    const potContents = wpPot({
      src: fixturePath,
      writeFile: false
    });

    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':3', 'Hello World', false, false));
  });
});
