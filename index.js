/* eslint-env node */
'use strict';

const fs = require('fs');
const getLineFromPos = require('get-line-from-pos');
const glob = require('glob');
const parser = require('php-parser').create({});
const path = require('path');

const EOF = parser.lexer.EOF;
const names = parser.tokens.values;
const patternFunctionCalls = /(__|_e|esc_attr__|esc_attr_e|esc_html__|esc_html_e|_x|_ex|esc_attr_x|esc_html_x|_n|_n_noop|_nx|_nx_noop)/;

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
  commentRegexp = new RegExp('^[\\s\\*\\/]+' + options.commentKeyword + '\\s*(.*)', 'im');

  // Find files
  const files = glob.sync(options.src);

  // Parse files
  for (let i = 0; i < files.length; i++) {
    const filecontent = fs.readFileSync(files[ i ]).toString();
    parseFile(filecontent, files[ i ]);
  }

  const potContents = generatePot();

  if (options.destFile) {
    writePot(potContents);
  }

  return potContents;
}

function parseFile (filecontent, filePath) {
  // Skip file if no translation functions is found
  if (!patternFunctionCalls.test(filecontent)) {
    return;
  }

  let translatorComment;
  let token;

  let prevToken = null;
  let translationCall = {};
  const filename = path.relative(path.dirname(options.destFile || __filename), filePath).replace(/\\/g, '/');

  parser.lexer.setInput(filecontent);

  while ((token = parser.lexer.lex() || EOF) !== EOF) {
    // console.log(getLineFromPos(filecontent, engine.lexer.offset - 1), ':', names[ token ], '(', engine.lexer.yytext, ')', 'prev:', prevToken);

    // Detect function calls, ignore function defines and object calls
    if (isEmptyObject(translationCall) && names[ token ] === 'T_STRING' && prevToken !== 'T_FUNCTION' && prevToken !== 'T_OBJECT_OPERATOR' && prevToken !== 'T_DOUBLE_COLON' && patternFunctionCalls.test(parser.lexer.yytext)) {
      translationCall.argumentCount = 0;
      translationCall.arguments = [];
      translationCall.file = filename;
      translationCall.inParantheses = 0;
      translationCall.line = getLineFromPos(filecontent, parser.lexer.offset - 1);
      translationCall.method = parser.lexer.yytext;
    }

    if (!translationCall.method && names[ token ] === 'T_COMMENT') {
      const commentmatch = commentRegexp.exec(parser.lexer.yytext);

      if (commentmatch !== null) {
        translatorComment = {
          text: commentmatch[ 1 ],
          line: getLineFromPos(filecontent, parser.lexer.offset - 1)
        };
      }
    }
    // Ignore whitespace as previous token
    if (names[ token ] !== 'T_WHITESPACE') {
      prevToken = names[ token ] || token;
    }

    // If not in a translation method we can ignore the rest
    if (isEmptyObject(translationCall)) {
      continue;
    }

    if (!translationCall.arguments[ translationCall.argumentCount ]) {
      translationCall.arguments[ translationCall.argumentCount ] = '';
    }

    if (token === '(') {
      translationCall.inParantheses++;
    }

    // Add arguments from translation function
    if (names[ token ] === 'T_CONSTANT_ENCAPSED_STRING') {
      // Strip quotes
      const quote = parser.lexer.yytext.substr(0, 1);
      translationCall.arguments[ translationCall.argumentCount ] += parser.lexer.yytext.substr(1, parser.lexer.yytext.length - 2).replace(new RegExp('\\\\' + quote, 'g'), quote).replace(new RegExp('\\\\n', 'g'), '\n');
    } else if (translationCall.argumentCount === getDomainPos(translationCall.method) && [ 'T_VARIABLE', 'T_STRING', 'T_OBJECT_OPERATOR', 'T_DOUBLE_COLON' ].indexOf(names[ token ]) !== -1) {
      translationCall.arguments[ translationCall.argumentCount ] += parser.lexer.yytext;
    }

    if (token === ',' && translationCall.inParantheses === 1) {
      translationCall.argumentCount++;
    }

    // End of paranthese
    if (token === ')') {
      translationCall.inParantheses--;
    }

    // End of translation function.
    // Add it to the list or append it to duplicate translation
    if (token === ')' && translationCall.inParantheses === 0) {
      const textDomainPos = getDomainPos(translationCall.method);

      if (translationCall.arguments && (!options.domain || options.domain === translationCall.arguments[ textDomainPos ])) {
        if (translatorComment && (translationCall.line - translatorComment.line <= 1)) {
          translationCall.comment = translatorComment.text;
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

      translationCall = {};
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
    commentKeyword: 'translators: ',
    headers: {
      'X-Poedit-Basepath': '..',
      'X-Poedit-SourceCharset': 'UTF-8',
      'X-Poedit-KeywordsList': '__;_e;_n:1,2;_x:1,2c;_ex:1,2c;_nx:4c,1,2;esc_attr__;esc_attr_e;esc_attr_x:1,2c;esc_html__;esc_html_e;esc_html_x:1,2c;_n_noop:1,2;_nx_noop:3c,1,2;__ngettext_noop:1,2',
      'X-Poedit-SearchPath-0': '.',
      'X-Poedit-SearchPathExcluded-0': '*.js'
    }
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
  var textDomainPos = 1;

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
    var rows = msgid.split(/\n/);

    for (var rowId = 0; rowId < rows.length; rowId++) {
      var lineBreak = rowId === (rows.length - 1) ? '' : '\\n';

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
  var year = new Date().getFullYear();

  var contents = (
    `# Copyright (C) ${year} ${options.package}
# This file is distributed under the same license as the ${options.package} package.
msgid ""
msgstr ""
"Project-Id-Version: ${options.package}\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"\n`);

  if (options.headers) {
    for (var key in options.headers) {
      if (options.headers.hasOwnProperty(key)) {
        contents += `"${key}: ${options.headers[ key ]}\\n"\n`;
      }
    }
  }

  contents += '"Plural-Forms: nplurals=2; plural=(n != 1);\\n"\n';
  contents += '\n';

  var translationLines = translationToPot();
  contents += translationLines.join('\n');

  return contents;
}

function writePot (potContent) {
  fs.writeFileSync(options.destFile, potContent);
}

module.exports = wpPot;
