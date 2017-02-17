/* eslint-env node */
'use strict';

const fs = require('fs');
const Engine = require('php-parser');
const path = require('path');
const globby = require('globby');
const pathSort = require('path-sort');

const parser = new Engine({
  parser: {
    extractDoc: true
  },
  ast: {
    withPositions: true
  }
});

let translations;
let options;
let commentRegexp;

let lastComment;

let functionCalls = {
  valid: [],
  contextPosition: {},
  pluralPosition: {}
};

/**
 * Check if variable is a empty object
 *
 * @param  {object}  obj
 *
 * @return {boolean}
 */
function isEmptyObject (obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Set default options
 */
function setDefaultOptions () {
  const defaultOptions = {
    src: '**/*.php',
    destFile: 'translations.pot',
    commentKeyword: 'translators:',
    headers: {
      'X-Poedit-Basepath': '..',
      'X-Poedit-SourceCharset': 'UTF-8',
      'X-Poedit-SearchPath-0': '.',
      'X-Poedit-SearchPathExcluded-0': '*.js'
    },
    defaultHeaders: true,
    writeFile: true,
    gettextFunctions: [
      { name: '__' },
      { name: '_e' },
      { name: '_ex', context: 2 },
      { name: '_n', plural: 2 },
      { name: '_n_noop', plural: 2 },
      { name: '_nx', plural: 2, context: 4 },
      { name: '_nx_noop', plural: 2, context: 3 },
      { name: '_x', context: 2 },
      { name: 'esc_attr__' },
      { name: 'esc_attr_e' },
      { name: 'esc_attr_x', context: 2 },
      { name: 'esc_html__' },
      { name: 'esc_html_e' },
      { name: 'esc_html_x', context: 2 }
    ]
  };

  if (options.headers === false) {
    options.defaultHeaders = false;
  }

  options = Object.assign({}, defaultOptions, options);

  if (!options.package) {
    options.package = options.domain || 'unnamed project';
  }

  options.gettextFunctions.forEach(function (methodObject) {
    functionCalls.valid.push(methodObject.name);

    if (methodObject.plural) {
      functionCalls.pluralPosition[ methodObject.name ] = methodObject.plural;
    }
    if (methodObject.context) {
      functionCalls.contextPosition[ methodObject.name ] = methodObject.context;
    }
  });
}

/**
 * Parse comment AST
 *
 * @param  {object} ast
 */
function parseComment (ast) {
  let comment = null;

  if (ast.kind === 'doc') {
    // Set comment regexp to find translator comments
    commentRegexp = new RegExp(`^[\\s*]*${options.commentKeyword}(.*)`, 'im');

    for (const line of ast.lines) {
      const commentmatch = commentRegexp.exec(line);

      if (commentmatch !== null) {
        comment = commentmatch[ 1 ];
      }
    }
  }

  lastComment = comment;
}

/**
 * Determine if `key` is plural or not.
 *
 * @param  {string} method
 *
 * @return {boolean}
 */
function isPlural (method) {
  return functionCalls.pluralPosition.hasOwnProperty(method);
}

/**
 * Determine if `key` has context or not.
 *
 * @param  {string} method
 *
 * @return {boolean}
 */
function hasContext (method) {
  return functionCalls.contextPosition.hasOwnProperty(method);
}

/**
 * Get context argument position
 *
 * @param {string} method
 *
 * @return {number}
 */
function getContextPos (method) {
  return functionCalls.contextPosition[ method ] - 1;
}

/**
 * Generate a object for a translation
 *
 * @param {object} translationCall
 * @return {object}
 */
function generateTranslationObject (translationCall) {
  const translationObject = {
    info: `${translationCall.filename}:${translationCall.line}`,
    msgid: translationCall.args[ 0 ]
  };

  if (translationCall.comment) {
    translationObject.comment = options.commentKeyword + translationCall.comment;
  }

  if (isPlural(translationCall.method)) {
    translationObject.msgid_plural = translationCall.args[ 1 ];
  }

  if (hasContext(translationCall.method)) {
    const contextKey = getContextPos(translationCall.method);
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
function generateTranslationKey (translationObject) {
  return `${translationObject.msgid}${(translationObject.msgctxt)}`;
}

/**
 * Add translation call to array
 *
 * @param {object} translationCall
 */
function addTranslation (translationCall) {
  if (translationCall.args) {
    const translationObject = generateTranslationObject(translationCall);

    const translationKey = generateTranslationKey(translationObject);
    if (!translations[ translationKey ]) {
      translations[ translationKey ] = translationObject;
    } else {
      translations[ translationKey ].info += `, ${translationObject.info}`;

      if (translationObject.msgid_plural) {
        translations[ translationKey ].msgid_plural = translationObject.msgid_plural;
      }
    }
  }
}

/**
 * Parse arguments in a function call
 *
 * @param {Array} args
 *
 * @return {Array}
 */
function parseArguments (args) {
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
 * Parse the AST code tree
 *
 * @param {object} ast
 * @param {string} filename
 */
function parseCodeTree (ast, filename) {
  if (!ast) {
    return;
  } else if (Array.isArray(ast)) {
    for (const child of ast) {
      parseCodeTree(child, filename);
    }
  } else if (ast.kind === 'call' && functionCalls.valid.indexOf(ast.what.name) !== -1) {
    const args = parseArguments(ast.arguments);

    if (!options.domain || options.domain === args[ args.length - 1 ]) {
      const translationCall = {
        args,
        filename,
        line: ast.loc.start.line,
        method: ast.what.name,
        comment: lastComment
      };

      addTranslation(translationCall);
    }
  } else {
    // List can not be in alphabetic order, otherwise it will not be ordered by occurence in code.
    const childrenContainingCalls = [
      'arguments',
      'body',
      'alternate',
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
      'test',
      'value',
      'what'
    ];

    for (const child of childrenContainingCalls) {
      if (ast[ child ]) {
        parseCodeTree(ast[ child ], filename);
      }
    }
  }

  parseComment(ast);
}

/**
 * Parse PHP file
 *
 * @param {string} filecontent
 * @param {string} filePath
 */
function parseFile (filecontent, filePath) {
  // Skip file if no translation functions is found
  const validFunctionsInFile = new RegExp(functionCalls.valid.join('|'));
  if (!validFunctionsInFile.test(filecontent)) {
    return;
  }

  const filename = path.relative(options.relativeTo || path.dirname(options.destFile || __filename), filePath).replace(/\\/g, '/');

  try {
    const ast = parser.parseCode(filecontent, filename);
    parseCodeTree(ast, filename);
  } catch (e) {
    e.message += ` | Unable to parse ${filename}`;
    throw e;
  }
}

/**
 * Set default pot headers
 */
function setHeaders () {
  if (!options.headers) {
    options.headers = {};
  }

  if (options.bugReport) {
    options.headers[ 'Report-Msgid-Bugs-To' ] = options.bugReport;
  }

  if (options.lastTranslator) {
    options.headers[ 'Last-Translator' ] = options.lastTranslator;
  }

  if (options.team) {
    options.headers[ 'Language-Team' ] = options.team;
  }

  if (options.defaultHeaders && !options.headers.hasOwnProperty('X-Poedit-KeywordsList')) {
    options.headers[ 'X-Poedit-KeywordsList' ] = options.gettextFunctions.map(function (obj) {
      let keyword = obj.name;

      if (obj.plural || obj.context) {
        keyword += ':1';
      }
      if (obj.plural) {
        keyword += `,${obj.plural}`;
      }
      if (obj.context) {
        keyword += `,${obj.context}c`;
      }

      return keyword;
    }).join(';');
  }
}

/**
 * Escape unescaped double quotes
 *
 * @param {string} text
 * @return string
 */
function escapeQuotes (text) {
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
function getPotMsgId (msgid, plural) {
  const output = [];
  const idKey = (plural ? 'msgid_plural' : 'msgid');

  if (msgid) {
    msgid = escapeQuotes(msgid);

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
function getPotMsgStr (plural) {
  if (!plural) {
    return [ 'msgstr ""\n' ];
  } else {
    return [ 'msgstr[0] ""', 'msgstr[1] ""\n' ];
  }
}

/**
 * Write translation to array with pot format.
 *
 * @return {Array}
 */
function translationToPot () {
  // Write translation rows.
  let output = [];

  if (translations) {
    for (let translationElement in translations) {
      if (translations.hasOwnProperty(translationElement)) {
        if (translations[ translationElement ].comment) {
          output.push(`#. ${translations[ translationElement ].comment}`);
        }

        // Unify paths for Unix and Windows
        output.push(`#: ${translations[ translationElement ].info.replace(/\\/g, '/')}`);

        if (translations[ translationElement ].msgctxt) {
          output.push(`msgctxt "${escapeQuotes(translations[ translationElement ].msgctxt)}"`);
        }

        output = output.concat(getPotMsgId(translations[ translationElement ].msgid));

        output = output.concat(getPotMsgId(translations[ translationElement ].msgid_plural, true));

        output = output.concat(getPotMsgStr(Boolean(translations[ translationElement ].msgid_plural)));
      }
    }
  }

  return output;
}

/**
 * Geneate pot contents
 *
 * @return {string}
 */
function generatePot () {
  const year = new Date().getFullYear();

  let contents = (
    `# Copyright (C) ${year} ${options.package}
# This file is distributed under the same license as the ${options.package} package.
msgid ""
msgstr ""
"Project-Id-Version: ${options.package}\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"\n`);

  if (options.headers && !isEmptyObject(options.headers)) {
    Object.keys(options.headers).sort().forEach(function (key) {
      contents += `"${key}: ${options.headers[ key ]}\\n"\n`;
    });
  }

  contents += '"Plural-Forms: nplurals=2; plural=(n != 1);\\n"\n';
  contents += '\n';

  const translationLines = translationToPot();
  contents += translationLines.join('\n');

  return contents;
}

/**
 * Write file to disk
 *
 * @param {string} potContent
 */
function writePot (potContent) {
  fs.writeFileSync(options.destFile, potContent);
}

/**
 * Constructor
 * @param userOptions
 * @return {string}
 */
function wpPot (userOptions) {
  // Reset states
  translations = {};

  // Set options
  options = userOptions;
  setDefaultOptions();

  // Find and sort file paths
  const files = pathSort(globby.sync(options.src));

  // Parse files
  for (const file of files) {
    const filecontent = fs.readFileSync(file).toString();
    parseFile(filecontent, file);
  }

  setHeaders();

  const potContents = generatePot();

  if (options.writeFile) {
    writePot(potContents);
  }

  return potContents;
}

module.exports = wpPot;
