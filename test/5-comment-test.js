/* eslint-env node, mocha */
/* global before, after, describe, it */
'use strict';

const assert = require('assert');
const wpPot = require('../');
const testHelper = require('./test-helper');

describe('File path comment tests', () => {
  it('Can hide file paths', () => {
    const fixturePath = 'test/fixtures/valid-functions.php';

    const potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      noFilePaths: true
    });

    // Do not find the path
    assert.strictEqual(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':2', 'Return string', false, false), false);

    // But find the string
    assert(testHelper.verifyLanguageBlock(potContents, false, false, 'Return string', false, false));
  });
});

describe('Comment tests', () => {
  it('Can read different type of comments', () => {
    const fixturePath = 'test/fixtures/comments.php';

    const potContents = wpPot({
      src: fixturePath,
      writeFile: false
    });

    assert(testHelper.verifyLanguageBlock(potContents, 'translators: This is a test', fixturePath + ':3', 'Single line comment', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, 'translators: This is also a test', fixturePath + ':8', 'Multiline comment, one line', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, 'translators: This is test number three', fixturePath + ':15', 'Multiline comment, multi line', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':20', 'Comment too far away from function', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, 'translators: This is a test with stored translations', fixturePath + ':26', 'Stored translation with comment', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, 'translators: sprintf test translation in array', fixturePath + ':30', 'sprintf translation in array', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, 'translators: test translation in keyed array', fixturePath + ':35', 'translation in keyed array', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, 'translators: example inside sprintf', fixturePath + ':40', 'translation inside sprintf', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, 'translators: This is comment 1', fixturePath + ':44', 'Multiple comments for same id', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, 'translators: This is comment 2', fixturePath + ':47', 'Multiple comments for same id', false, false));
  });

  it('Can read comments with other trigger', () => {
    const fixturePath = 'test/fixtures/comments.php';

    const potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      commentKeyword: 'Other keyword: '
    });

    assert(testHelper.verifyLanguageBlock(potContents, 'Other keyword: This is a comment to the translator', fixturePath + ':23', 'Comment with other keyword', false, false));

    // https://github.com/rasmusbe/wp-pot/issues/39
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':44', 'Multiple comments for same id', false, false));
    assert(testHelper.verifyLanguageBlock(potContents, false, fixturePath + ':47', 'Multiple comments for same id', false, false));
  });
});

describe('File comment tests', () => {
  it('Sets paths relative to option if set', () => {
    const fixturePath = 'test/fixtures/comments.php';

    const potContents = wpPot({
      src: fixturePath,
      relativeTo: 'test',
      writeFile: false
    });

    assert.strictEqual(testHelper.verifyLanguageBlock(potContents, 'translators: This is a test', fixturePath + ':3', 'Single line comment', false, false), false);
    assert(testHelper.verifyLanguageBlock(potContents, 'translators: This is a test', 'fixtures/comments.php:3', 'Single line comment', false, false));
  });

  it('Sets paths relative to pot if no option is set', () => {
    const fixturePath = 'test/fixtures/comments.php';

    const potContents = wpPot({
      src: fixturePath,
      destFile: 'test/test.pot',
      writeFile: false
    });

    assert.strictEqual(testHelper.verifyLanguageBlock(potContents, 'translators: This is a test', fixturePath + ':3', 'Single line comment', false, false), false);
    assert(testHelper.verifyLanguageBlock(potContents, 'translators: This is a test', 'fixtures/comments.php:3', 'Single line comment', false, false));
  });

  it('Sets paths relative to script if no option or destFile is set', () => {
    const fixturePath = 'test/fixtures/comments.php';

    const potContents = wpPot({
      src: fixturePath,
      writeFile: false
    });

    assert(testHelper.verifyLanguageBlock(potContents, 'translators: This is a test', fixturePath + ':3', 'Single line comment', false, false));
  });
});

describe('Comment edge cases', () => {
  it('Edge case with missing comment', () => {
    // https://github.com/rasmusbe/wp-pot/issues/29#issuecomment-384191855

    const fixturePath = 'test/fixtures/missing-comment.php';
    const potContents = wpPot({
      src: fixturePath,
      writeFile: false,
      domain: 'testdomain'
    });

    assert(testHelper.verifyLanguageBlock(potContents, 'translators: 1: current year, 2: site title link.', fixturePath + ':10', '&copy; %1$d %2$s', false, 'site copyright'));
  });
});
