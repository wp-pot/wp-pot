/* eslint-env node, mocha */
/* global before, after, describe, it */
'use strict';

const assert = require('assert');
const wpPot = require('../');
const fs = require('fs');

const defaultHeaders = fs.readFileSync('test/fixtures/default-headers.txt').toString();

describe('Header tests', () => {
  it('should generate a pot file with default headers when no headers is set', () => {
    const potContents = wpPot({
      src: 'test/fixures/empty-dir/*.php',
      writeFile: false
    });

    assert(potContents.indexOf(defaultHeaders) !== -1);
  });

  it('should generate a pot file with team, translator or bug report options set', () => {
    const potContents = wpPot({
      bugReport: 'http://example.com',
      lastTranslator: 'John Doe <mail@example.com>',
      team: 'Team Team <mail@example.com>',
      src: 'test/fixures/empty-dir/*.php',
      writeFile: false
    });

    assert(potContents.indexOf(defaultHeaders) !== -1);
    assert(potContents.indexOf('"Report-Msgid-Bugs-To: http://example.com\\n"\n') !== -1);
    assert(potContents.indexOf('"Last-Translator: John Doe <mail@example.com>\\n"\n') !== -1);
    assert(potContents.indexOf('"Language-Team: Team Team <mail@example.com>\\n"\n') !== -1);
  });

  it('should generate a pot file with custom headers from php file with headers set', () => {
    const potContents = wpPot({
      headers: {
        'Report-Msgid-Bugs-To': 'http://example.com',
        'Last-Translator': 'John Doe <mail@example.com>',
        'Language-Team': 'Team Team <mail@example.com>'
      },
      src: 'test/fixures/empty-dir/*.php',
      writeFile: false
    });

    assert(potContents.indexOf(defaultHeaders) === -1);
    assert(potContents.indexOf('"Report-Msgid-Bugs-To: http://example.com\\n"\n') !== -1);
    assert(potContents.indexOf('"Last-Translator: John Doe <mail@example.com>\\n"\n') !== -1);
    assert(potContents.indexOf('"Language-Team: Team Team <mail@example.com>\\n"\n') !== -1);
  });

  it('should generate a pot file without default headers from php file with headers false', () => {
    const potContents = wpPot({
      src: 'test/fixures/empty-dir/*.php',
      writeFile: false,
      headers: false
    });

    assert(potContents.indexOf(defaultHeaders) === -1);
  });
});
