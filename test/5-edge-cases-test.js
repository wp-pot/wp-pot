/* eslint-env node, mocha */
/* global before, after, describe, it */
'use strict';

const assert = require('assert');
const wpPot = require('../');
const testHelper = require('./test-helper');

describe('Edge cases function tests', () => {
  let potContents;
  const fixturePath = 'test/fixtures/edge-cases.php';

  before(() => {
    potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      domain: 'testdomain'
    });
  });

  it('should handle strings with escaped single quotes', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':2', "It's escaped", false, false));
  });

  it('should handle strings with unescaped double quotes within single quotes', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':3', "It's escaped", false, false));
  });

  it('should handle strings with escaped double quotes', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':4', 'This is \\"escaped\\"', false, false));
  });

  it('should handle strings with double quotes', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':5', 'This is \\"escaped\\"', false, false));
  });

  it('should handle strings with line breaks in function call', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':6', '"\n"New\\n"\n"Line', false, false));
  });

  it('should handle strings with line breaks in function call', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':8', '"\n"New\\n"\n"Line', false, false));
  });

  it('should handle plural methods with non-integer value as count', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':13', 'Singular string', 'Plural string', false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':14', 'Singular string', 'Plural string', false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':15', 'Singular string', 'Plural string', false));
  });
});

describe('Namespace edge cases', () => {
  // https://github.com/rasmusbe/wp-pot/issues/3
  const fixturePath = 'test/fixtures/mixed-namespaces.php';
  it('should not die when using multiple namespaces in a file', () => {
    const potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      domain: 'testdomain'
    });

    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':3', 'Return string', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':7', 'Return string', false, false));
  });
});

describe('Edge cases domain tests', () => {
  const fixturePath = 'test/fixtures/edge-cases.php';

  it('should handle strings with domain set as variable', () => {
    const potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      domain: '$test'
    });
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':16', 'Domain is a variable', false, false));
  });

  it('should handle strings with domain set as a object variable', () => {
    const potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      domain: '$this->test'
    });
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':17', 'Domain is a object variable', false, false));
  });

  it('should handle strings with domain set as a static class variable', () => {
    const potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      domain: '$this::test'
    });
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':18', 'Domain is a static class variable', false, false));
  });

  it('should handle strings with domain set as a constant', () => {
    const potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      domain: 'TEST'
    });
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':19', 'Domain is a constant', false, false));
  });

  it('should not include methods without domain when domain is set', () => {
    const potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      domain: 'TEST'
    });
    assert(!testHelper.verifyLanguageBlock(potContents, false, false, 'Missing domain', false, false));
  });
});
