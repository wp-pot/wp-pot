/* eslint-env node */
'use strict';

const path = require('path');
const espree = require('espree');

function objectHas (obj, key) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function replaceAll (string, search, replace) {
  return string.split(search).join(replace);
}

class JSParser {
  constructor (options) {
    this.options = options;
    this.options.parserOptions = Object.assign({}, {
      comment: true,
      loc: true
    }, this.options.parserOptions);
    this.translations = [];
    this.comments = {};
  }

  /**
   * Add node to array
   *
   * @param {object} node
   */
  addTranslation (node) {
    const translationObject = this.generateTranslationObject(node);
    const translationKey = this.generateTranslationKey(translationObject);

    if (!this.translations[translationKey]) {
      this.translations[translationKey] = translationObject;
    } else if (this.translations[translationKey].info.indexOf(translationObject.info) === -1) {
      this.translations[translationKey].info += `, ${translationObject.info}`;

      if (translationObject.msgid_plural) {
        this.translations[translationKey].msgid_plural =
          translationObject.msgid_plural;
      }

      if (translationObject.comment[0]) {
        this.translations[translationKey].comment.push(
          translationObject.comment[0]
        );
      }
    }
  }

  /**
   * Generate a object for a translation
   *
   * @param {object} node
   * @return {object}
   */
  generateTranslationObject (node) {
    const translationObject = {
      info: `${this.filename}:${node.loc.start.line}`,
      msgid: node.arguments[0].value,
      comment: []
    };

    const comment = this.getComment(node.loc.start.line);
    if (comment) {
      translationObject.comment.push(`${this.options.commentKeyword.trim()} ${comment}`);
    }

    if (objectHas(this.options.functionCalls.pluralPosition, node.callee.name)) {
      translationObject.msgid_plural = node.arguments[1].value;
    }

    // TODO
    if (objectHas(this.options.functionCalls.contextPosition, node.callee.name)) {
      const contextKey = this.getContextPos(node.callee.name);
      translationObject.msgctxt = node.arguments[contextKey].value;
    }

    return translationObject;
  }

  /**
   * Generate key to match duplicate translations
   *
   * @param {object} translationObject
   * @return {string}
   */
  generateTranslationKey (translationObject) {
    return `${translationObject.msgid}${translationObject.msgctxt || ''}`;
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
   * Get comment for line number
   *
   * @param {number} lineNumber
   *
   * @return {string}
   */
  getComment (lineNumber) {
    const linesWithComment = Object.keys(this.comments);
    if (!linesWithComment) {
      return;
    }

    if (linesWithComment[0] > lineNumber) {
      return;
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
      comment = comment.replace(/\s+$/, '').trim();
    }

    return comment;
  }

  /**
   * Parse comment AST
   *
   * @param  {object} commentAst
   */
  parseComment (comment) {
    let commentRegexp;
    if (comment.type === 'Block') {
      commentRegexp = new RegExp(
        `[\\s*]*${this.options.commentKeyword}(.*)\\s*$`,
        'im'
      );
    } else {
      commentRegexp = new RegExp(
        `^\\s*${this.options.commentKeyword}(.*)$`,
        'im'
      );
    }
    const commentParts = commentRegexp.exec(comment.value);

    if (commentParts) {
      let lineNumber = comment.loc.end.line;
      if (comment.loc.end.column === 0) {
        lineNumber--;
      }

      this.comments[lineNumber] = commentParts[1].trim();
    }
  }

  /**
   * Parse node
   *
   * @param {object} node
   */
  parseNode (node) {
    let translationMethod = '';
    let translationNode = null;

    switch (node.type) {
      case 'BinaryExpression':
        if (node.right) {
          this.parseNode(node.right);
        }

        if (node.left) {
          this.parseNode(node.left);
        }

        break;
      case 'ExpressionStatement':
        if (node.expression && node.expression.right) {
          this.parseNode(node.expression.right);
        }

        if (node.expression && node.expression.left) {
          this.parseNode(node.expression.left);
        }

        if (
          node.expression &&
          node.expression.callee
        ) {
          this.parseNode(node.expression);
        }

        break;
      case 'CallExpression':
        node.arguments.filter(node => node.type).forEach(node => {
          this.parseNode(node);
        });

        translationMethod = node.callee.name;
        translationNode = node;

        break;
      case 'ObjectExpression':
        if (node.properties) {
          node.properties.forEach(node => {
            this.parseNode(node);
          });
        }

        break;
      case 'ArrayExpression':
        if (node.elements) {
          node.elements.forEach(node => {
            this.parseNode(node);
          });
        }

        break;
      case 'Identifier':
        translationNode = node;
        translationMethod = node.name;
        break;
      case 'FunctionExpression':
      case 'FunctionDeclaration':
        if (node.id) {
          this.parseNode(node.id);
        }
        if (node.body && node.body.body) {
          node.body.body.forEach(node => {
            this.parseNode(node);
          });
        }

        break;
      case 'VariableDeclaration':
        if (node.declarations) {
          node.declarations.filter(node => node.init).forEach(node => {
            this.parseNode(node.init);
          });
        }

        break;
      default:
        for (const key in node) {
          if (typeof node[key] === 'object' && node.value) {
            this.parseNode(node.value);
          }
        }

        break;
    }

    if (!translationNode) {
      return;
    }

    if (
      !this.options.functionCalls.valid.includes(translationMethod)
    ) {
      return;
    }

    if (!this.options.domain || this.options.domain === translationNode.arguments[translationNode.arguments.length - 1].value) {
      this.addTranslation(translationNode);
    }
  }

  /**
   * Parse the AST code tree
   *
   * @param {object} ast
   */
  parseCodeTree (ast) {
    if (!ast) {
      return;
    }

    if (ast.comments) {
      ast.comments.forEach((comment) => {
        this.parseComment(comment);
      });
    }

    ast.body.forEach((node) => {
      this.parseNode(node);
    });
  }

  /**
   * Parse PHP file
   *
   * @param {string} filecontent
   * @param {string} filePath
   * @param {object} existingTranslations
   *
   * @return {object}
   */
  parseFile (filecontent, filePath, existingTranslations) {
    if (existingTranslations === undefined) {
      existingTranslations = {};
    }

    this.translations = existingTranslations;
    this.filename = path
      .relative(
        this.options.relativeTo ||
          path.dirname(this.options.destFile || __filename),
        filePath
      )
      .replace(/\\/g, '/');

    // Skip file if no translation functions is found
    const validFunctionsInFile = new RegExp(
      replaceAll(this.options.functionCalls.valid.join('|'), '$', '\\$')
    );
    if (validFunctionsInFile.test(filecontent)) {
      try {
        const ast = espree.parse(filecontent, this.options.parserOptions);
        this.parseCodeTree(ast);
      } catch (e) {
        e.message += ` | Unable to parse ${this.filename}`;
        throw e;
      }
    }

    return this.translations;
  }
}

module.exports = JSParser;
