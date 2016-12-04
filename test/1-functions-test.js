/* eslint-env node, mocha */
/* global before, after, describe, it */

var assert = require('assert');
var wpPot = require('../');
var testHelper = require('./test-helper');

describe('Function tests', function () {
  it('Can read all valid functions without domain check', function () {
    var fixturePath = 'test/fixtures/valid-functions.php';

    var potContents = wpPot({
      src: fixturePath,
      destFile: false
    });

    testValidFunctions(potContents, fixturePath);
  });

  it('Can read all valid functions with domain check', function () {
    var fixturePath = 'test/fixtures/valid-functions.php';

    var potContents = wpPot({
      src: fixturePath,
      domain: 'testdomain',
      destFile: false
    });

    testValidFunctions(potContents, fixturePath);
  });

  it('Can not find any functions with domain check if invalid domain', function () {
    var fixturePath = 'test/fixtures/valid-functions.php';

    var potContents = wpPot({
      src: fixturePath,
      domain: 'other-domain',
      destFile: false
    });

    testValidFunctions(potContents, fixturePath, true);
  });

  it('Can merge duplicate strings and separate with context', function () {
    var fixturePath = 'test/fixtures/duplicated-strings.php';

    var potContents = wpPot({
      src: fixturePath,
      destFile: false,
      domain: 'testdomain'
    });

    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':2', 'Simple string', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':3', 'Simple string', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':4', 'Simple string', false, 'with context'));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':5', 'Simple string', false, 'with context'));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':6', 'Single and plural string', 'Plural string', false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':7', 'Single and plural string', 'Plural string', false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':8', 'Single and plural string', 'Plural string', 'with context'));
    assert(!testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':9', 'Simple string', false, false));
  });
});

/**
 * Test the valid-functions.php file
 * Since this file is used many times its a separate function
 * @param potContents
 * @param fixturePath
 * @param invert
 */
function testValidFunctions (potContents, fixturePath, invert) {
  var test = assert;

  if (invert) {
    test = function (value, message) {
      assert(!value, message);
    };
  }

  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':2', 'Return string', false, false));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':3', 'Print string', false, false));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':4', 'Escape for attribute and return string', false, false));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':5', 'Escape for attribute and print string', false, false));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':6', 'Escape for html and return string', false, false));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':7', 'Escape for html and print string', false, false));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':8', 'Return string with context', false, 'Some context'));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':9', 'Print string with context', false, 'Some context'));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':10', 'Escape string with context for attribute', false, 'Some context'));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':11', 'Escape string with context for html', false, 'Some context'));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':12', 'Singular string', 'Plural string', false));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':13', 'Singular string with noop', 'Plural string with noop', false));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':14', 'Singular string with context', 'Plural string with context', 'Some context'));
  test(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':15', 'Singular string with noop and context', 'Plural string with noop and context', 'Some context'));
}
