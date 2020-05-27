/* eslint-env node, mocha */
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

  it('should handle methods within other methods', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':22', 'Translation in function call', false, false));
  });

  it('should handle echoed methods', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':23', 'Echoed translation', false, false));
  });

  it('should handle methods in if blocks', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':25', 'Method in if block', false, false));
  });

  it('should handle methods in elseif blocks', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':27', 'Method in elseif block', false, false));
  });

  it('should handle methods in returns', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':29', 'Returned function', false, false));
  });

  it('should handle methods in exits', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':31', 'Exit message', false, false));
  });

  it('should handle methods in dies', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':32', 'Exit message', false, false));
  });

  it('should handle methods in try', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':34', 'Text within try', false, false));
  });

  it('should handle methods in catch', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':34', 'Text within catch', false, false));
  });

  it('should handle methods with root namespace', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':36', 'With root namespace', false, false));
  });

  it('should not include strings that are variables', () => {
    // https://github.com/wp-pot/wp-pot/issues/72
    assert(!testHelper.verifyLanguageBlock(potContents, false, false, '$object->ignoreThis', false, false));
    assert(!testHelper.verifyLanguageBlock(potContents, false, false, false, '$object->ignoreThis', false));
    assert(!testHelper.verifyLanguageBlock(potContents, false, false, '$ignoreThis', false));
    assert(!testHelper.verifyLanguageBlock(potContents, false, false, false, '$ignoreThis', false, false));
  });

  it('should include strings from concatenated functions', () => {
    // https://github.com/wp-pot/gulp-wp-pot/issues/108
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':44', 'Concat functions with .', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':44', 'Concat functions with . again', false, false));
  });

  it('should include text in new class parameter', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':46', 'Text in new class parameter', false, false));
  });

  it('should include text in ternary statements', () => {
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':48', 'Text in true ternary statements', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':49', 'Text in false ternary statements', false, false));
  });
});

describe('Namespace edge cases', () => {
  // https://github.com/wp-pot/wp-pot/issues/3
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
