/* eslint-env node */
'use strict';

const path = require('path');
const Engine = require('php-parser');
const parser = new Engine({
  parser: {
    extractDoc: true
  },
  ast: {
    withPositions: true
  }
});

class TranslationParser {
  constructor (options) {
    this.options = options;
    this.translations = [];
  }

  /**
   * Parse theme or plugin meta data from file header
   *
   * @param {Array} headers
   * @param {string} filecontent
   * @param {string} filename
   */
  parseFileHeader (headers, filecontent, filename) {
    const _this = this;
    const lines = filecontent.match(/[^\r\n]+/g);

    if (lines) {
      lines.splice(30);

      lines.forEach(function (lineContent, line) {
        headers.forEach(function (header, index) {
          const regex = new RegExp('^(?:[ \t]*<?php)?[ \t/*#@]*' + header + ':(.*)$', 'i');
          const match = regex.exec(lineContent);

          if (match) {
            headers.splice(index, 1);
            const headerValue = match[ 1 ].replace(/\s*(?:\*\/|\?>).*/, '').trim();

            const translationCall = {
              args: [ headerValue ],
              filename,
              line,
              method: ''
            };

            _this.addTranslation(translationCall);
          }
        });
      });
    }
  }

  /**
   * Parse comment AST
   *
   * @param  {object} ast
   */
  parseComment (ast) {
    let comment = null;

    if (ast.loc && this.lastComment && this.lastComment.line === ast.loc.start.line) {
      comment = this.lastComment;
    }

    if (ast.kind === 'doc') {
      // Set comment regexp to find translator comments
      const commentRegexp = new RegExp(`^[\\s*]*${this.options.commentKeyword}(.*)`, 'im');

      for (const line of ast.lines) {
        const commentmatch = commentRegexp.exec(line);

        if (commentmatch !== null) {
          let commentLine = ast.loc.end.line;
          if (ast.loc.end.column !== 0) {
            commentLine++;
          }

          comment = {
            text: commentmatch[ 1 ],
            line: commentLine
          };
        }
      }
    }

    this.lastComment = comment;
  }

  /**
   * Parse arguments in a function call
   *
   * @param {Array} args
   *
   * @return {Array}
   */
  static parseArguments (args) {
    const argsArray = [];
    for (const arg of args) {
      if (arg.inner) {
        argsArray.push(arg.inner.value);
      } else if (arg.kind === 'propertylookup') {
        argsArray.push(`$${arg.what.name}->${arg.offset.name}`);
      } else if (arg.kind === 'staticlookup') {
        argsArray.push(`$${arg.what.name}::${arg.offset.name}`);
      } else if (arg.kind === 'variable') {
        argsArray.push(`$${arg.name}`);
      } else if (arg.kind === 'constref') {
        argsArray.push(`${arg.name.name}`);
      } else {
        argsArray.push(arg.value);
      }
    }
    return argsArray;
  }

  /**
   * Determine if `key` is plural or not.
   *
   * @param  {string} method
   *
   * @return {boolean}
   */
  isPlural (method) {
    return this.options.functionCalls.pluralPosition.hasOwnProperty(method);
  }

  /**
   * Determine if `key` has context or not.
   *
   * @param  {string} method
   *
   * @return {boolean}
   */
  hasContext (method) {
    return this.options.functionCalls.contextPosition.hasOwnProperty(method);
  }

  /**
   * Get context argument position
   *
   * @param {string} method
   *
   * @return {number}
   */
  getContextPos (method) {
    return this.options.functionCalls.contextPosition[ method ] - 1;
  }

  /**
   * Generate a object for a translation
   *
   * @param {object} translationCall
   * @return {object}
   */
  generateTranslationObject (translationCall) {
    const translationObject = {
      info: `${translationCall.filename}:${translationCall.line}`,
      msgid: translationCall.args[ 0 ]
    };

    if (translationCall.comment) {
      translationObject.comment = this.options.commentKeyword + translationCall.comment;
    }

    if (this.isPlural(translationCall.method)) {
      translationObject.msgid_plural = translationCall.args[ 1 ];
    }

    if (this.hasContext(translationCall.method)) {
      const contextKey = this.getContextPos(translationCall.method);
      translationObject.msgctxt = translationCall.args[ contextKey ];
    }

    return translationObject;
  }

  /**
   * Generate key to match duplicate translations
   *
   * @param {object} translationObject
   * @return {string}
   */
  static generateTranslationKey (translationObject) {
    return `${translationObject.msgid}${(translationObject.msgctxt)}`;
  }

  /**
   * Add translation call to array
   *
   * @param {object} translationCall
   */
  addTranslation (translationCall) {
    if (translationCall.args) {
      const translationObject = this.generateTranslationObject(translationCall);

      const translationKey = TranslationParser.generateTranslationKey(translationObject);
      if (!this.translations[ translationKey ]) {
        this.translations[ translationKey ] = translationObject;
      } else {
        this.translations[ translationKey ].info += `, ${translationObject.info}`;

        if (translationObject.msgid_plural) {
          this.translations[ translationKey ].msgid_plural = translationObject.msgid_plural;
        }
      }
    }
  }

  /**
   * Parse the AST code tree
   *
   * @param {object} ast
   * @param {string} filename
   */
  parseCodeTree (ast, filename) {
    if (!ast) {
      return;
    }

    if (Array.isArray(ast)) {
      for (const child of ast) {
        this.parseCodeTree(child, filename);
      }
    } else {
      let methodName = '';
      if (ast.kind === 'call') {
        methodName = ast.what.name;
        if (ast.what.kind === 'propertylookup' && ast.what.what.kind === 'variable') {
          methodName = [ '$', ast.what.what.name, '->', ast.what.offset.name ].join('');
        }
      }

      if (ast.kind === 'call' && this.options.functionCalls.valid.indexOf(methodName) !== -1) {
        const args = TranslationParser.parseArguments(ast.arguments);

        if (!this.options.domain || this.options.domain === args[ args.length - 1 ]) {
          let comment = null;
          if (this.lastComment) {
            comment = this.lastComment.text;
          }

          const translationCall = {
            args,
            filename,
            line: ast.loc.start.line,
            method: methodName,
            comment: comment
          };

          this.addTranslation(translationCall);
        }
      } else {
        // List can not be in alphabetic order, otherwise it will not be ordered by occurence in code.
        const childrenContainingCalls = [
          'arguments',
          'body',
          'alternate',
          'catches',
          'children',
          'expr',
          'trueExpr',
          'falseExpr',
          'ifnull',
          'inner',
          'items',
          'key',
          'left',
          'right',
          'source',
          'status',
          'test',
          'value',
          'what'
        ];

        for (const child of childrenContainingCalls) {
          if (ast[ child ]) {
            this.parseCodeTree(ast[ child ], filename);
          }
        }
      }
    }

    this.parseComment(ast);
  }

  /**
   * Parse PHP file
   *
   * @param {string} filecontent
   * @param {string} filePath
   * @param {object} existingTranslations
   *
   * @return {Array}
   */
  parseFile (filecontent, filePath, existingTranslations) {
    if (existingTranslations === undefined) {
      existingTranslations = {};
    }

    this.translations = existingTranslations;

    const filename = path.relative(this.options.relativeTo || path.dirname(this.options.destFile || __filename), filePath).replace(/\\/g, '/');

    if (this.options.metadataFile === filename) {
      this.parseFileHeader([ 'Plugin Name', 'Theme Name', 'Version', 'Author' ], filecontent, filename);
    }

    this.parseFileHeader([ 'Template Name' ], filecontent, filename);

    // Skip file if no translation functions is found
    const validFunctionsInFile = new RegExp(this.options.functionCalls.valid.join('|').replace('$', '\\$'));

    if (validFunctionsInFile.test(filecontent)) {
      try {
        const ast = parser.parseCode(filecontent, filename);
        this.parseCodeTree(ast, filename);
      } catch (e) {
        e.message += ` | Unable to parse ${filename}`;
        throw e;
      }
    }

    return this.translations;
  }
}

module.exports = TranslationParser;
