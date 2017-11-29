/* eslint-env node */
'use strict';

class PotMaker {
  constructor (options) {
    this.options = options;
  }

  /**
   * Check if variable is a empty object
   *
   * @param  {object}  obj
   *
   * @return {boolean}
   */
  static isEmptyObject (obj) {
    return Object.keys(obj).length === 0;
  }

  /**
   * Escape unescaped double quotes
   *
   * @param {string} text
   * @return string
   */
  static escapeQuotes (text) {
    text = text.replace(/\\([\s\S])|(")/g, '\\$1$2');
    return text;
  }

  /**
   * Get msgid lines in pot format
   *
   * @param {string}  msgid
   * @param {Boolean} [plural]
   *
   * @return {Array}
   */
  static getPotMsgId (msgid, plural) {
    const output = [];
    const idKey = (plural ? 'msgid_plural' : 'msgid');

    if (msgid) {
      msgid = PotMaker.escapeQuotes(msgid);

      if (/\n/.test(msgid)) {
        output.push(`${idKey} ""`);
        const rows = msgid.split(/\n/);

        for (let rowId = 0; rowId < rows.length; rowId++) {
          const lineBreak = rowId === (rows.length - 1) ? '' : '\\n';

          output.push(`"${rows[ rowId ] + lineBreak}"`);
        }
      } else {
        output.push(`${idKey} "${msgid}"`);
      }
    }
    return output;
  }

  /**
   * Get msgstr lines in pot format
   *
   * @param {Boolean} plural
   *
   * @return {Array}
   */
  static getPotMsgStr (plural) {
    if (!plural) {
      return [ 'msgstr ""\n' ];
    } else {
      return [ 'msgstr[0] ""', 'msgstr[1] ""\n' ];
    }
  }

  /**
   * Write translation to array with pot format.
   *
   * @param {object} translations
   * @param {bool}   noFilePaths
   *
   * @return {Array}
   */
  static translationToPot (translations, noFilePaths) {
    // Write translation rows.
    let output = [];

    if (translations) {
      for (const translationElement of Object.keys(translations)) {
        if (translations[ translationElement ].comment) {
          for (const comment of translations[ translationElement ].comment) {
            output.push(`#. ${comment}`);
          }
        }

        if (!noFilePaths) {
          // Unify paths for Unix and Windows
          output.push(`#: ${translations[ translationElement ].info.replace(/\\/g, '/')}`);
        }

        if (translations[ translationElement ].msgctxt) {
          output.push(`msgctxt "${PotMaker.escapeQuotes(translations[ translationElement ].msgctxt)}"`);
        }

        output = output.concat(PotMaker.getPotMsgId(translations[ translationElement ].msgid));

        output = output.concat(PotMaker.getPotMsgId(translations[ translationElement ].msgid_plural, true));

        output = output.concat(PotMaker.getPotMsgStr(Boolean(translations[ translationElement ].msgid_plural)));
      }
    }

    return output;
  }

  /**
   * Sort object by key name
   *
   * @param {object} obj
   */
  sortObject (obj) {
    return Object.keys(obj).sort().reduce(function (result, key) {
      result[ key ] = obj[ key ];
      return result;
    }, {});
  }

  /**
   * Geneate pot contents
   *
   * @param {object} translations
   *
   * @return {string}
   */
  generatePot (translations) {
    const year = new Date().getFullYear();

    let contents = (
      `# Copyright (C) ${year} ${this.options.package}
# This file is distributed under the same license as the ${this.options.package} package.
msgid ""
msgstr ""
"Project-Id-Version: ${this.options.package}\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"\n`);

    if (this.options.headers && !PotMaker.isEmptyObject(this.options.headers)) {
      this.options.headers = this.sortObject(this.options.headers);

      for (const key of Object.keys(this.options.headers)) {
        contents += `"${key}: ${this.options.headers[ key ]}\\n"\n`;
      }
    }

    contents += '"Plural-Forms: nplurals=2; plural=(n != 1);\\n"\n';
    contents += '\n';

    const translationLines = PotMaker.translationToPot(translations, this.options.noFilePaths);
    contents += translationLines.join('\n');

    return contents;
  }
}

module.exports = PotMaker;
