/* eslint-env node, mocha */
/* global before, after, describe, it */

var assert = require('assert');
var wpPot = require('../');
var fs = require('fs');

var defaultHeaders = fs.readFileSync('test/fixtures/default-headers.txt').toString();

describe('Header tests', function () {
  it('should generate a pot file with default headers when no headers is set', function () {
    var potContents = wpPot({
      src: 'test/fixures/empty-dir/*.php',
      destFile: false
    });

    assert(potContents.indexOf(defaultHeaders) !== -1);
  });

  it('should generate a pot file with custom headers from php file with headers set', function () {
    var potContents = wpPot({
      headers: {
        'Report-Msgid-Bugs-To': 'http://example.com',
        'Last-Translator': 'John Doe <mail@example.com>',
        'Language-Team': 'Team Team <mail@example.com>'
      },
      src: 'test/fixures/empty-dir/*.php',
      destFile: false
    });

    assert(potContents.indexOf(defaultHeaders) === -1);
    assert(potContents.indexOf('"Report-Msgid-Bugs-To: http://example.com\\n"\n') !== -1);
    assert(potContents.indexOf('"Last-Translator: John Doe <mail@example.com>\\n"\n') !== -1);
    assert(potContents.indexOf('"Language-Team: Team Team <mail@example.com>\\n"\n') !== -1);
  });

  it('should generate a pot file without default headers from php file with headers false', function () {
    var potContents = wpPot({
      src: 'test/fixures/empty-dir/*.php',
      destFile: false,
      headers: false
    });

    assert(potContents.indexOf(defaultHeaders) === -1);
  });
});
