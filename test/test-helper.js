/* eslint-env node */

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
  var blocks = potContents.split('\n\n');
  for (var i = 1; i < blocks.length; i++) {
    var blocklines = blocks[ i ].split('\n');
    var fileinfoLine = 0;

    if (comment && blocks[ i ].indexOf('#. ' + comment) === -1) {
      continue;
    } else if (comment) {
      fileinfoLine++;
    }

    // Check if correct file
    if (fileinfo && blocklines[ fileinfoLine ].indexOf(fileinfo) === -1) {
      continue;
    }

    // Check if msgid is correct
    if (msgid && blocks[ i ].indexOf('msgid "' + msgid + '"\n') === -1) {
      continue;
    }

    // Check if plural msgid is correct
    if (plural && blocks[ i ].indexOf('msgid_plural "' + plural + '"\n') === -1) {
      continue;
    } else if (!plural && blocks[ i ].indexOf('msgid_plural') !== -1) {
      continue;
    }

    // Check if context is correct
    if (context && blocks[ i ].indexOf('msgctxt "' + context + '"\n') === -1) {
      continue;
    } else if (!context && blocks[ i ].indexOf('msgctxt') !== -1) {
      continue;
    }

    // Check if msgstr is correct when plural
    if (plural && blocks[ i ].indexOf('msgstr[0] ""\n') === -1 && blocks[ i ].indexOf('msgstr[1] ""\n') === -1 && blocks[ i ].indexOf('msgstr ""\n') !== -1) {
      continue;
      // Check if msgstr is correct when singular
    } else if (!plural && blocks[ i ].indexOf('msgstr[0] ""\n') !== -1 && blocks[ i ].indexOf('msgstr[1] ""\n') !== -1 && blocks[ i ].indexOf('msgstr ""\n') === -1) {
      continue;
    }

    return true;
  }
  return false;
}
module.exports = {
  verifyLanguageBlock: verifyLanguageBlock
};
