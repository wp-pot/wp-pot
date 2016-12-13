/* eslint-env node */
'use strict';

const fs = require('fs');
const getLineFromPos = require('get-line-from-pos');
const parser = require('php-parser').create({});
const path = require('path');
const globby = require('globby');

const EOF = parser.lexer.EOF;
const names = parser.tokens.values;
const validFunctionCalls = /^(__|_e|esc_attr__|esc_attr_e|esc_html__|esc_html_e|_x|_ex|esc_attr_x|esc_html_x|_n|_n_noop|_nx|_nx_noop)$/;
const validFunctionsInFile = new RegExp(validFunctionCalls.source.substr(1, validFunctionCalls.source.length - 2));

let translations;
let options;
let commentRegexp;

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

  // Set comment regexp to find translator comments
  commentRegexp = new RegExp('^[\\s\\*\\/]+' + options.commentKeyword + '(.*)', 'im');

  // Find files
  const files = globby.sync(options.src);

  // Parse files
  for (let i = 0; i < files.length; i++) {
    const filecontent = fs.readFileSync(files[ i ]).toString();
    parseFile(filecontent, files[ i ]);
  }

  setHeaders();

  const potContents = generatePot();

  if (options.writeFile) {
    writePot(potContents);
  }

  return potContents;
}

function setHeaders () {
  if (!options.headers) {
    options.headers = {};
  }

  if (options.bugReport) {
    options.headers['Report-Msgid-Bugs-To'] = options.bugReport;
  }

  if (options.lastTranslator) {
    options.headers['Last-Translator'] = options.lastTranslator;
  }

  if (options.team) {
    options.headers['Language-Team'] = options.team;
  }
}

function parseComment (lexer, filecontent) {
  const commentmatch = commentRegexp.exec(lexer.yytext);
  let comment = {};

  if (commentmatch !== null) {
    comment = {
      text: commentmatch[ 1 ],
      line: getLineFromPos(filecontent, lexer.offset - 1)
    };
  }

  return comment;
}

function parseFunctionCall (lexer, filename, filecontent) {
  let translationCall = {};

  if (validFunctionCalls.test(lexer.yytext)) {
    translationCall = {
      argumentCount: 0,
      arguments: [],
      file: filename,
      inParantheses: 0,
      line: getLineFromPos(filecontent, lexer.offset - 1),
      method: lexer.yytext
    };
  }

  return translationCall;
}

function addArgument (translationCall, tokenName, lexer) {
  if (tokenName === 'T_CONSTANT_ENCAPSED_STRING') {
    let text = lexer.yytext;
    // Strip quotes
    const quote = lexer.yytext.substr(0, 1);
    text = text.substr(1, lexer.yytext.length - 2);

    // Remove escapes
    text = text.replace(new RegExp('\\\\' + quote, 'g'), quote).replace(new RegExp('\\\\n', 'g'), '\n');

    // Add quotes to "
    text = text.replace(/\\([\s\S])|(")/g, '\\$1$2');
    translationCall.arguments[ translationCall.argumentCount ] += text;
  } else {
    translationCall.arguments[ translationCall.argumentCount ] += lexer.yytext;
  }

  return translationCall;
}

function addTranslation (translationCall, lastComment) {
  const textDomainPos = getDomainPos(translationCall.method);

  if (translationCall.arguments && (!options.domain || options.domain === translationCall.arguments[ textDomainPos ])) {
    if (lastComment && (translationCall.line - lastComment.line === 1)) {
      translationCall.comment = lastComment.text;
    }

    const translationObject = generateTranslationObject(translationCall);

    const translationKey = generateTranslationKey(translationObject);
    if (!translations[ translationKey ]) {
      translations[ translationKey ] = translationObject;
    } else {
      translations[ translationKey ].info += ', ' + translationObject.info;

      if (translationObject.msgid_plural) {
        translations[ translationKey ].msgid_plural = translationObject.msgid_plural;
      }
    }
  }
}

function validArgument (tokenName) {
  return [ 'T_CONSTANT_ENCAPSED_STRING', 'T_VARIABLE', 'T_STRING', 'T_OBJECT_OPERATOR', 'T_DOUBLE_COLON' ].indexOf(tokenName) !== -1;
}

function parseFile (filecontent, filePath) {
  // Skip file if no translation functions is found
  if (!validFunctionsInFile.test(filecontent)) {
    return;
  }
  const filename = path.relative(options.relativeTo || path.dirname(options.destFile || __filename), filePath).replace(/\\/g, '/');

  let prevToken = null;
  let translationCall = {};
  let lastComment = {};
  let token;

  parser.lexer.setInput(filecontent);

  while ((token = parser.lexer.lex() || EOF) !== EOF) {
    // console.log(getLineFromPos(filecontent, parser.lexer.offset - 1), ':', names[ token ], '(', parser.lexer.yytext, ')', 'prev:', prevToken);
    if (isEmptyObject(translationCall)) {
      // Detect function calls, ignore function defines and object calls
      if (names[ token ] === 'T_STRING' && [ 'T_FUNCTION', 'T_OBJECT_OPERATOR', 'T_DOUBLE_COLON' ].indexOf(prevToken) === -1) {
        translationCall = parseFunctionCall(parser.lexer, filename, filecontent);
      } else if (names[ token ] === 'T_COMMENT') {
        lastComment = parseComment(parser.lexer, filecontent) || lastComment;
      }
    } else {
      if (!translationCall.arguments[ translationCall.argumentCount ]) {
        translationCall.arguments[ translationCall.argumentCount ] = '';
      }

      if (token === '(') {
        translationCall.inParantheses++;
      } else if (token === ')') {
        translationCall.inParantheses--;
      } else if (token === ',' && translationCall.inParantheses === 1) {
        translationCall.argumentCount++;
      } else if (validArgument(names[ token ])) {
        translationCall = addArgument(translationCall, names[ token ], parser.lexer);
      }

      // End of translation function.
      // Add it to the list or append it to duplicate translation
      if (translationCall.inParantheses === 0) {
        addTranslation(translationCall, lastComment);
        translationCall = {};
      }
    }

    // Ignore whitespace as previous token
    if (names[ token ] !== 'T_WHITESPACE') {
      prevToken = names[ token ] || token;
    }
  }
}

function extend (target) {
  const sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
    for (let prop in source) {
      if (source.hasOwnProperty(prop)) {
        target[ prop ] = source[ prop ];
      }
    }
  });
  return target;
}

function setDefaultOptions () {
  const defaultOptions = {
    src: '**/*.php',
    destFile: 'translations.pot',
    commentKeyword: 'translators:',
    headers: {
      'X-Poedit-Basepath': '..',
      'X-Poedit-SourceCharset': 'UTF-8',
      'X-Poedit-KeywordsList': '__;_e;_n:1,2;_x:1,2c;_ex:1,2c;_nx:4c,1,2;esc_attr__;esc_attr_e;esc_attr_x:1,2c;esc_html__;esc_html_e;esc_html_x:1,2c;_n_noop:1,2;_nx_noop:3c,1,2;__ngettext_noop:1,2',
      'X-Poedit-SearchPath-0': '.',
      'X-Poedit-SearchPathExcluded-0': '*.js'
    },
    writeFile: true
  };

  options = extend({}, defaultOptions, options);

  if (!options.package) {
    options.package = options.domain || 'unnamed project';
  }
}

function isEmptyObject (obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Determine if `key` is plural or not.
 *
 * @param  {string} method
 *
 * @return {boolean}
 */
function isPlural (method) {
  return /(_n|_n_noop|_nx|_nx_noop)/.test(method);
}

/**
 * Determine if `key` has context or not.
 *
 * @param  {string} method
 *
 * @return {boolean}
 */
function hasContext (method) {
  return /(_x|_ex|esc_attr_x|esc_html_x|_nx|_nx_noop)/.test(method);
}

/**
 * Determine if `key` is a noop key or not.
 *
 * @param  {string} method
 *
 * @return {boolean}
 */
function isNoop (method) {
  return /(_nx_noop|_n_noop)/.test(method);
}

function getDomainPos (method) {
  let textDomainPos = 1;

  if (isPlural(method)) {
    textDomainPos += 2;
  }

  if (hasContext(method)) {
    textDomainPos += 1;
  }

  // Noop-functions has one less argument before context
  if (isNoop(method)) {
    textDomainPos -= 1;
  }

  return textDomainPos;
}

function getContextPos (method) {
  // Default position
  let contextPos = 1;

  // Plural has two more arguments before context
  if (isPlural(method)) {
    contextPos += 2;
  }

  // Noop-functions has one less argument before context
  if (isNoop(method)) {
    contextPos -= 1;
  }

  return contextPos;
}

function generateTranslationKey (translationObject) {
  return translationObject.msgid + (translationObject.msgctxt || '');
}

function generateTranslationObject (translationCall) {
  const translationObject = {
    info: `${translationCall.file}:${translationCall.line}`,
    msgid: translationCall.arguments[ 0 ]
  };

  if (translationCall.comment) {
    translationObject.comment = options.commentKeyword + translationCall.comment;
  }

  if (isPlural(translationCall.method)) {
    translationObject.msgid_plural = translationCall.arguments[ 1 ];
  }

  if (hasContext(translationCall.method)) {
    const contextKey = getContextPos(translationCall.method);
    translationObject.msgctxt = translationCall.arguments[ contextKey ];
  }

  return translationObject;
}

function getPotMsgId (msgid, plural) {
  const output = [];
  const idKey = (plural ? 'msgid_plural' : 'msgid');

  if (!msgid) {
    return [];
  } else if (/\n/.test(msgid)) {
    output.push(`${idKey} ""`);
    const rows = msgid.split(/\n/);

    for (let rowId = 0; rowId < rows.length; rowId++) {
      const lineBreak = rowId === (rows.length - 1) ? '' : '\\n';

      output.push(`"${rows[ rowId ] + lineBreak}"`);
    }
  } else {
    output.push(`${idKey} "${msgid}"`);
  }
  return output;
}

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
          output.push(`msgctxt "${translations[ translationElement ].msgctxt}"`);
        }

        output = output.concat(getPotMsgId(translations[ translationElement ].msgid));

        output = output.concat(getPotMsgId(translations[ translationElement ].msgid_plural, true));

        output = output.concat(getPotMsgStr(Boolean(translations[ translationElement ].msgid_plural)));
      }
    }
  }

  return output;
}

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
    for (let key in options.headers) {
      if (options.headers.hasOwnProperty(key)) {
        contents += `"${key}: ${options.headers[ key ]}\\n"\n`;
      }
    }
  }

  contents += '"Plural-Forms: nplurals=2; plural=(n != 1);\\n"\n';
  contents += '\n';

  const translationLines = translationToPot();
  contents += translationLines.join('\n');

  return contents;
}

function writePot (potContent) {
  fs.writeFileSync(options.destFile, potContent);
}

module.exports = wpPot;
