/* eslint-env node */
'use strict';

const fs = require('fs');
const globby = require('globby');
const pathSort = require('path-sort');

const TranslationParser = require('./translation-parser');
const PotMaker = require('./pot-maker');

/**
 * Set default options
 *
 * @param {object} options
 *
 * @return {object}
 */
function setDefaultOptions (options) {
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

  const functionCalls = {
    valid: [],
    contextPosition: {},
    pluralPosition: {}
  };

  options.gettextFunctions.forEach(function (methodObject) {
    functionCalls.valid.push(methodObject.name);

    if (methodObject.plural) {
      functionCalls.pluralPosition[ methodObject.name ] = methodObject.plural;
    }
    if (methodObject.context) {
      functionCalls.contextPosition[ methodObject.name ] = methodObject.context;
    }
  });

  options.functionCalls = functionCalls;

  return options;
}

/**
 * Generate string for header from gettext function
 *
 * @param {object} gettextFunctions
 *
 * @return {Array}
 */
function keywordsListStrings (gettextFunctions) {
  const methodStrings = [];

  for (const getTextFunction of gettextFunctions) {
    let methodString = getTextFunction.name;

    if (getTextFunction.plural || getTextFunction.context) {
      methodString += ':1';
    }
    if (getTextFunction.plural) {
      methodString += `,${getTextFunction.plural}`;
    }
    if (getTextFunction.context) {
      methodString += `,${getTextFunction.context}c`;
    }

    methodStrings.push(methodString);
  }

  return methodStrings;
}

/**
 * Set default pot headers
 *
 * @param {object} options
 *
 * @return {object}
 */
function setHeaders (options) {
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
    options.headers[ 'X-Poedit-KeywordsList' ] = keywordsListStrings(options.gettextFunctions).join(';');
  }

  return options;
}

/**
 * Write file to disk
 *
 * @param {string} potContent
 * @param {object} options
 */
function writePot (potContent, options) {
  fs.writeFileSync(options.destFile, potContent);
}

/**
 * Constructor
 * @param {object} options
 * @return {string}
 */
function wpPot (options) {
  // Reset states
  let translations = {};

  // Set options
  options = setDefaultOptions(options);

  // Find and sort file paths
  const files = pathSort(globby.sync(options.src));

  // Parse files
  for (const file of files) {
    const filecontent = fs.readFileSync(file).toString();
    const translationParser = new TranslationParser(options);
    translations = translationParser.parseFile(filecontent, file, translations);
  }

  options = setHeaders(options);

  const potMaker = new PotMaker(options);
  const potContents = potMaker.generatePot(translations);

  if (options.writeFile) {
    writePot(potContents, options);
  }

  return potContents;
}

module.exports = wpPot;
