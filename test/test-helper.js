/* eslint-env node */
'use strict';

const assert = require('assert');

/**
 * Verify a language block, divided by two new lines
 *
 * @param potContents
 * @param comment
 * @param fileinfo
 * @param msgid
 * @param plural
 * @param context
 * @return {boolean}
 */

function verifyLanguageBlock (potContents, comment, fileinfo, msgid, plural, context) {
  const blocks = potContents.split('\n\n');

  for (const block of blocks) {
    const blocklines = block.split('\n');

    const commentLines = blocklines.slice(0).filter(function (row) {
      return row.match(/^#\. /);
    });

    if (comment && commentLines.indexOf('#. ' + comment) === -1) {
      continue;
    } else if (!comment && commentLines.length) {
      continue;
    }

    // Check if correct file
    if (fileinfo && blocklines[ commentLines.length ].indexOf(fileinfo) === -1) {
      continue;
    }

    // Check if msgid is correct
    if (msgid && block.indexOf('msgid "' + msgid + '"\n') === -1) {
      continue;
    }

    // Check if plural msgid is correct
    if (plural && block.indexOf('msgid_plural "' + plural + '"\n') === -1) {
      continue;
    } else if (!plural && block.indexOf('msgid_plural') !== -1) {
      continue;
    }

    // Check if context is correct
    if (context && block.indexOf('msgctxt "' + context + '"\n') === -1) {
      continue;
    } else if (!context && block.indexOf('msgctxt') !== -1) {
      continue;
    }

    // Check if msgstr is correct when plural
    if (plural && block.indexOf('msgstr[0] ""\n') === -1 && block.indexOf('msgstr[1] ""\n') === -1 && block.indexOf('msgstr ""\n') !== -1) {
      continue;
      // Check if msgstr is correct when singular
    } else if (!plural && block.indexOf('msgstr[0] ""\n') !== -1 && block.indexOf('msgstr[1] ""\n') !== -1 && block.indexOf('msgstr ""\n') === -1) {
      continue;
    }

    return true;
  }
  return false;
}

/**
 * Test the valid-functions.php file
 * Since this file is used many times its a separate function
 * @param potContents
 * @param fixturePath
 * @param invert
 */
function testValidFunctions (potContents, fixturePath, invert) {
  let test = assert;

  if (invert) {
    test = (value, message) => {
      assert.strictEqual(value, false, message);
    };
  }

  test(verifyLanguageBlock(potContents, false, fixturePath + ':2', 'Return string', false, false));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':3', 'Print string', false, false));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':4', 'Escape for attribute and return string', false, false));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':5', 'Escape for attribute and print string', false, false));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':6', 'Escape for html and return string', false, false));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':7', 'Escape for html and print string', false, false));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':8', 'Return string with context', false, 'Some context'));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':9', 'Print string with context', false, 'Some context'));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':10', 'Escape string with context for attribute', false, 'Some context'));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':11', 'Escape string with context for html', false, 'Some context'));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':12', 'Singular string', 'Plural string', false));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':13', 'Singular string with noop', 'Plural string with noop', false));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':14', 'Singular string with context', 'Plural string with context', 'Some context'));
  test(verifyLanguageBlock(potContents, false, fixturePath + ':15', 'Singular string with noop and context', 'Plural string with noop and context', 'Some context'));
}

module.exports = {
  verifyLanguageBlock,
  testValidFunctions
};
