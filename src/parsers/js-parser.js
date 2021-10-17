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

    if (node.arguments instanceof Array) {
      if (objectHas(this.options.functionCalls.pluralPosition, node.callee.name) && node.arguments.length > 1) {
        translationObject.msgid_plural = node.arguments[1].value;
      }

      if (objectHas(this.options.functionCalls.contextPosition, node.callee.name)) {
        const contextKey = this.getContextPos(node.callee.name);
        if (node.arguments.length > contextKey - 1) {
          translationObject.msgctxt = node.arguments[contextKey].value;
        }
      }
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
   * Try to find domain for translation node
   *
   * @param {object} translationNode
   *
   * @return {string}
   */
  getDomain (translationNode) {
    if (!translationNode.arguments.length) {
      return '';
    }

    const node = translationNode.arguments[translationNode.arguments.length - 1];
    if (!node) {
      return '';
    }

    switch (node.type) {
      case 'Identifier':
        return node.name;
      case 'MemberExpression':
        if (node.object && node.object.type === 'ThisExpression' && node.property && node.property.type === 'Identifier') {
          return `this.${node.property.name}`;
        }

        if (node.object && node.object.type === 'Identifier' && node.property && node.property.type === 'Identifier') {
          return `${node.object.name}.${node.property.name}`;
        }

        return '';
      default:
        return node.value || '';
    }
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
      case 'BlockStatement':
        if (node.body && node.body.body) {
          node.body.body.forEach(node => {
            this.parseNode(node);
          });
        } else if (node.body instanceof Array) {
          node.body.forEach(node => {
            this.parseNode(node);
          });
        }
        break;
      case 'CallExpression':
        node.arguments.filter(node => node.type).forEach(node => {
          this.parseNode(node);
        });

        if (node.callee.object) {
          if (node.callee.type === 'MemberExpression') {
            let customMethod = '';
            if (node.callee.object && node.callee.object.type === 'ThisExpression' && node.callee.property && node.callee.property.type === 'Identifier') {
              customMethod = `this.${node.callee.property.name}`;
            } else if (node.callee.object && node.callee.object.type === 'Identifier' && node.callee.property && node.callee.property.type === 'Identifier') {
              customMethod = `${node.callee.object.name}.${node.callee.property.name}`;
            }

            if (this.options.functionCalls.valid.indexOf(customMethod) !== -1) {
              translationMethod = customMethod;
              translationNode = node;
            } else if (!customMethod) {
              this.parseNode(node.callee.object);
            }
          } else {
            this.parseNode(node.callee.object);
          }
        } else if (node.callee.body) {
          this.parseNode(node.callee);
        } else if (node.callee.property) {
          translationMethod = node.callee.property.name;
          translationNode = node;
        } else {
          translationMethod = node.callee.name;
          translationNode = node;
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
        } else if (node.expression.body && node.expression.body.body) {
          node.expression.body.body.forEach(node => {
            this.parseNode(node);
          });
        } else {
          for (const key in node.expression) {
            if (typeof node.expression[key] === 'object') {
              this.parseNode(node.expression[key]);
            }
          }
        }

        break;
      case 'FunctionExpression':
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
        if (node.id) {
          this.parseNode(node.id);
        }

        if (node.body && node.body.body) {
          node.body.body.forEach(node => {
            this.parseNode(node);
          });
        }

        break;
      case 'Identifier':
        translationNode = node;
        translationMethod = node.name;
        break;
      case 'IfStatement':
        if (node.consequent) {
          this.parseNode(node.consequent);
        }

        if (node.alternate && node.alternate.consequent) {
          this.parseNode(node.alternate.consequent);
        }

        break;
      case 'Property':
        if (typeof node.key === 'object' && node.key) {
          this.parseNode(node.key);
        }

        if (typeof node.value === 'object' && node.value) {
          this.parseNode(node.value);
        }

        break;
      case 'TryStatement':
        if (node.block && node.block.body) {
          node.block.body.forEach(node => {
            this.parseNode(node);
          });
        }

        if (node.handler && node.handler.body) {
          this.parseNode(node.handler.body);
        }

        if (node.finalizer && node.finalizer.body) {
          node.finalizer.body.forEach(node => {
            this.parseNode(node);
          });
        }
        break;
      default:
        for (const key in node) {
          if (typeof node[key] === 'object' && node[key] && node.value) {
            this.parseNode(node.value);
          } else if (typeof node[key] === 'object' && node[key] && typeof node[key].type === 'string') {
            this.parseNode(node[key]);
          } else if (node[key] instanceof Array) {
            node[key].forEach(node => {
              this.parseNode(node);
            });
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

    if (!this.options.domain || this.options.domain === this.getDomain(translationNode)) {
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
          const regex = new RegExp('\\*[\\s+\t/*#@](?:\\s+|)' + header + ':(.*)', 'i');
          const match = regex.exec(lineContent);

          if (match) {
            headers.splice(index, 1);
            const headerValue = match[1].replace(/\s*(?:\*\/|\?>).*/, '').trim();

            const translationCall = {
              filename,
              loc: {
                start: {
                  line: line + 1
                }
              },
              callee: {
                name: ''
              },
              arguments: [{ value: headerValue }]
            };

            _this.addTranslation(translationCall);
          }
        });
      });
    }
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

    if (this.options.metadataFile === this.filename) {
      this.parseFileHeader(['Plugin Name', 'Theme Name', 'Description', 'Author', 'Author URI', 'Plugin URI', 'Theme URI'], filecontent, this.filename);
    }

    if (!this.options.ignoreTemplateNameHeader) {
      this.parseFileHeader(['Template Name'], filecontent, this.filename);
    }

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
