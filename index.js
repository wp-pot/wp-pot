/* eslint-env node */

var engine = require('php-parser');
var fs = require('fs');
var getLineFromPos = require('get-line-from-pos');
var path = require('path');
var glob = require('glob');

var EOF = engine.lexer.EOF;
var patternFunctionCalls = /(__|_e|esc_attr__|esc_attr_e|esc_html__|esc_html_e|_x|_ex|esc_attr_x|esc_html_x|_n|_n_noop|_nx|_nx_noop)/;

var translations;
var options;

/**
 * Constructor
 * @param userOptions
 * @return {string}
 */
function wpPot (userOptions) {
  translations = {};
  // Set options
  options = userOptions;
  setDefaultOptions();

  // Find files
  var files = glob.sync(options.src);

  // Parse files
  for (var i = 0; i < files.length; i++) {
    var file = fs.readFileSync(files[ i ]);
    var filecontent = file.toString();
    parseFile(filecontent, files[ i ]);
  }
  var potContents = generatePot();

  if (options.destFile) {
    writePot(potContents);
  }
  return potContents;
}

function parseFile (filecontent, filePath) {
  if (!patternFunctionCalls.test(filecontent)) {
    return;
  }

  engine.lexer.setInput(filecontent);

  var commentRegexp = new RegExp('^[\\s\\*\\/]+' + options.commentKeyword + '\\s*(.*)', 'im');
  var names = engine.tokens.values;
  var prevToken = null;
  var token;
  var translationCall = {};
  var translatorComment;

  while ((token = engine.lexer.lex() || EOF) !== EOF) {
    // console.log(getLineFromPos(filecontent, engine.lexer.offset - 1), ':', names[ token ], '(', engine.lexer.yytext, ')', 'prev:', prevToken);

    // Detect function calls, ignore function defines and object calls
    if (isEmptyObject(translationCall) && names[ token ] === 'T_STRING' && prevToken !== 'T_FUNCTION' && prevToken !== 'T_OBJECT_OPERATOR' && prevToken !== 'T_DOUBLE_COLON' && patternFunctionCalls.test(engine.lexer.yytext)) {
      translationCall.argumentCount = 0;
      translationCall.arguments = [];
      translationCall.file = path.relative(path.dirname(options.destFile || __filename), filePath).replace(/\\/g, '/');
      translationCall.inParantheses = 0;
      translationCall.line = getLineFromPos(filecontent, engine.lexer.offset - 1);
      translationCall.method = engine.lexer.yytext;
    }

    if (!translationCall.method && names[ token ] === 'T_COMMENT') {
      var commentmatch = commentRegexp.exec(engine.lexer.yytext);
      if (commentmatch !== null) {
        translatorComment = {
          text: commentmatch[ 1 ],
          line: getLineFromPos(filecontent, engine.lexer.offset - 1)
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
      var quote = engine.lexer.yytext.substr(0, 1);
      translationCall.arguments[ translationCall.argumentCount ] += engine.lexer.yytext.substr(1, engine.lexer.yytext.length - 2).replace(new RegExp('\\\\' + quote, 'g'), quote).replace(new RegExp('\\\\n', 'g'), '\n');
    } else if (translationCall.argumentCount === getDomainPos(translationCall.method) && [ 'T_VARIABLE', 'T_STRING', 'T_OBJECT_OPERATOR', 'T_DOUBLE_COLON' ].indexOf(names[ token ]) !== -1) {
      translationCall.arguments[ translationCall.argumentCount ] += engine.lexer.yytext;
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
      var textDomainPos = getDomainPos(translationCall.method);

      if (translationCall.arguments && (!options.domain || options.domain === translationCall.arguments[ textDomainPos ])) {
        if (translatorComment && (translationCall.line - translatorComment.line <= 1)) {
          translationCall.comment = translatorComment.text;
        }

        var translationObject = generateTranslationObject(translationCall);

        var translationKey = generateTranslationKey(translationObject);
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
  var sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
    for (var prop in source) {
      target[ prop ] = source[ prop ];
    }
  });
  return target;
}

function setDefaultOptions () {
  var defaultOptions = {
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

function generateTranslationKey (translationObject) {
  return translationObject.msgid + (translationObject.msgctxt || '');
}

function generateTranslationObject (translationCall) {
  var translationObject = {
    info: translationCall.file + ':' + translationCall.line,
    msgid: translationCall.arguments[ 0 ]
  };

  if (translationCall.comment) {
    translationObject.comment = options.commentKeyword + translationCall.comment;
  }

  if (isPlural(translationCall.method)) {
    translationObject.msgid_plural = translationCall.arguments[ 1 ];
  }

  if (hasContext(translationCall.method)) {
    // Default context position
    var contextKey = 1;

    // Plural has two more arguments before context
    if (isPlural(translationCall.method)) {
      contextKey += 2;
    }

    // Noop-functions has one less argument before context
    if (isNoop(translationCall.method)) {
      contextKey -= 1;
    }

    translationObject.msgctxt = translationCall.arguments[ contextKey ];
  }

  return translationObject;
}

/**
 * Write translation to array with pot format.
 *
 * @return {Array}
 */
function translationToPot () {
  // Write translation rows.
  var output = [];

  if (translations) {
    for (var el in translations) {
      if (translations.hasOwnProperty(el)) {
        if (translations[ el ].comment) {
          output.push('#. ' + translations[ el ].comment);
        }

        // Unify paths for Unix and Windows
        output.push('#: ' + translations[ el ].info.replace(/\\/g, '/'));

        if (translations[ el ].msgctxt) {
          output.push('msgctxt "' + translations[ el ].msgctxt + '"');
        }

        if (/\n/.test(translations[ el ].msgid)) {
          output.push('msgid ""');
          var rows = translations[ el ].msgid.split(/\n/);

          for (var rowId = 0; rowId < rows.length; rowId++) {
            var lineBreak = rowId === (rows.length - 1) ? '' : '\\n';

            output.push('"' + rows[ rowId ] + lineBreak + '"');
          }
        } else {
          output.push('msgid "' + translations[ el ].msgid + '"');
        }

        if (!translations[ el ].msgid_plural) {
          output.push('msgstr ""\n');
        } else {
          output.push('msgid_plural "' + translations[ el ].msgid_plural + '"');
          output.push('msgstr[0] ""');
          output.push('msgstr[1] ""\n');
        }
      }
    }
  }

  return output;
}

function generatePot () {
  var year = new Date().getFullYear();

  var contents = '# Copyright (C) ' + year + ' ' + options.package + '\n';

  contents += '# This file is distributed under the same license as the ' + options.package + ' package.\n';
  contents += 'msgid ""\n';
  contents += 'msgstr ""\n';
  contents += '"Project-Id-Version: ' + options.package + '\\n"\n';

  if (options[ 'bugReport' ]) {
    contents += '"Report-Msgid-Bugs-To: ' + options[ 'bugReport' ] + '\\n"\n';
  }

  contents += '"MIME-Version: 1.0\\n"\n';
  contents += '"Content-Type: text/plain; charset=UTF-8\\n"\n';
  contents += '"Content-Transfer-Encoding: 8bit\\n"\n';
  contents += '"PO-Revision-Date: ' + year + '-MO-DA HO:MI+ZONE\\n"\n';

  if (options[ 'lastTranslator' ]) {
    contents += '"Last-Translator: ' + options[ 'lastTranslator' ] + '\\n"\n';
  }

  if (options[ 'team' ]) {
    contents += '"Language-Team: ' + options[ 'team' ] + '\\n"\n';
  }

  if (options.headers) {
    for (var key in options.headers) {
      if (options.headers.hasOwnProperty(key)) {
        contents += '"' + key + ': ' + options.headers[ key ] + '\\n"\n';
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
