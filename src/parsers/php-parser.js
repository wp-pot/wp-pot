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
  },
  lexer: {
    short_tags: true
  }
});

function objectHas (obj, key) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function replaceAll (string, search, replace) {
  return string.split(search).join(replace);
}

class PHPParser {
  constructor (options) {
    this.options = options;
    this.translations = [];
    this.comments = {};
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
            const headerValue = match[1].replace(/\s*(?:\*\/|\?>).*/, '').trim();

            const translationCall = {
              args: [headerValue],
              filename,
              line: line + 1,
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
   * @param  {object} commentAst
   */
  parseComment (commentAst) {
    let commentRegexp;
    if (commentAst.kind === 'commentblock') {
      commentRegexp = new RegExp(`(?:\\/\\*)?[\\s*]*${this.options.commentKeyword}(.*)\\s*(?:\\*\\/)$`, 'im');
    } else {
      commentRegexp = new RegExp(`^\\/\\/\\s*${this.options.commentKeyword}(.*)$`, 'im');
    }
    const commentParts = commentRegexp.exec(commentAst.value);

    if (commentParts) {
      let lineNumber = commentAst.loc.end.line;
      if (commentAst.loc.end.column === 0) {
        lineNumber--;
      }

      this.comments[lineNumber] = commentParts[1];
    }
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
      if (arg.kind === 'propertylookup') {
        argsArray.push(`$${arg.what.name}->${arg.offset.name}`);
      } else if (arg.kind === 'staticlookup') {
        argsArray.push(`$${arg.what.name}::${arg.offset.name}`);
      } else if (arg.kind === 'variable') {
        argsArray.push(`$${arg.name}`);
      } else if (arg.kind === 'name' && arg.resolution === 'uqn') {
        argsArray.push(arg.name);
      } else {
        argsArray.push(arg.value);
      }
    }

    return argsArray;
  }

  /**
   * Get context argument position
   *
   * @param {string} method
   *
   * @return {number}
   */
  getContextPos (method) {
    return this.options.functionCalls.contextPosition[method] - 1;
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
      msgid: translationCall.args[0],
      comment: []
    };

    if (translationCall.comment) {
      translationObject.comment.push(this.options.commentKeyword + translationCall.comment);
    }

    if (objectHas(this.options.functionCalls.pluralPosition, translationCall.method)) {
      translationObject.msgid_plural = translationCall.args[1];
    }

    if (objectHas(this.options.functionCalls.contextPosition, translationCall.method)) {
      const contextKey = this.getContextPos(translationCall.method);
      translationObject.msgctxt = translationCall.args[contextKey];
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

      const translationKey = PHPParser.generateTranslationKey(translationObject);
      if (!this.translations[translationKey]) {
        this.translations[translationKey] = translationObject;
      } else {
        this.translations[translationKey].info += `, ${translationObject.info}`;

        if (translationObject.msgid_plural) {
          this.translations[translationKey].msgid_plural = translationObject.msgid_plural;
        }

        if (translationObject.comment[0]) {
          this.translations[translationKey].comment.push(translationObject.comment[0]);
        }
      }
    }
  }

  getComment (lineNumber) {
    const linesWithComment = Object.keys(this.comments);
    if (!linesWithComment) {
      return null;
    }

    if (linesWithComment[0] > lineNumber) {
      return null;
    }

    let comment;
    if (lineNumber - linesWithComment[0] > 2) {
      delete this.comments[linesWithComment[0]];
      comment = this.getComment(lineNumber);
    } else {
      comment = this.comments[linesWithComment[0]];
      delete this.comments[linesWithComment[0]];
    }

    if (comment) {
      comment = comment.replace(/\s+$/, '');
    }

    return comment;
  }

  /**
   * Check if ast is a valid function call
   *
   * @param {object} ast
   *
   * @return {string|null}
   */
  validFunctionCall (ast) {
    if (ast.kind === 'call') {
      let methodName = ast.what.name;

      if (ast.what.kind === 'propertylookup' && ast.what.what.kind === 'variable') {
        methodName = ['$', ast.what.what.name, '->', ast.what.offset.name].join('');
      } else if (ast.what.kind === 'name' && ast.what.resolution === 'fqn') {
        methodName = ast.what.name.replace(/^\\/, '');
      }

      if (this.options.functionCalls.valid.indexOf(methodName) !== -1) {
        return methodName;
      }
    }

    return null;
  }

  validArgs (methodName, args) {
    if (args[0] && args[0].kind !== 'string') {
      return false;
    }

    if (objectHas(this.options.functionCalls.pluralPosition, methodName) && args[1] && args[1].kind !== 'string') {
      return false;
    }

    return true;
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

    if (ast.comments) {
      for (const comment of ast.comments) {
        this.parseComment(comment);
      }
    }

    if (Array.isArray(ast)) {
      for (const child of ast) {
        this.parseCodeTree(child, filename);
      }
      return;
    }

    const methodName = this.validFunctionCall(ast);

    if (methodName) {
      const args = PHPParser.parseArguments(ast.arguments);

      if ((!this.options.domain || this.options.domain === args[args.length - 1]) && this.validArgs(methodName, ast.arguments)) {
        const translationCall = {
          args,
          filename,
          line: ast.loc.start.line,
          method: methodName,
          comment: this.getComment(ast.loc.start.line)
        };

        this.addTranslation(translationCall);
      }
    } else {
      // List can not be in alphabetic order, otherwise it will not be ordered by occurence in code.
      const childrenContainingCalls = [
        'arguments',
        'alternate',
        'body',
        'catches',
        'children',
        'expr',
        'expression',
        'expressions',
        'trueExpr',
        'falseExpr',
        'items',
        'key',
        'left',
        'right',
        'value',
        'what'
      ];

      for (const child of childrenContainingCalls) {
        if (ast[child]) {
          this.parseCodeTree(ast[child], filename);
        }
      }
    }
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
      this.parseFileHeader(['Plugin Name', 'Theme Name', 'Description', 'Author', 'Author URI', 'Plugin URI', 'Theme URI'], filecontent, filename);
    }

    if (!this.options.ignoreTemplateNameHeader) {
      this.parseFileHeader(['Template Name'], filecontent, filename);
    }

    // Skip file if no translation functions is found
    const validFunctionsInFile = new RegExp(replaceAll(this.options.functionCalls.valid.join('|'), '$', '\\$'));

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

module.exports = PHPParser;
