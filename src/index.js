/* eslint-env node */
'use strict';

const fs = require('fs');
const matched = require('matched');
const pathSort = require('path-sort');

const PHParser = require('./parsers/php-parser');
const JSParser = require('./parsers/js-parser');
const PotMaker = require('./pot-maker');
const path = require('path');

const parsers = {
  php: PHParser,
  js: JSParser
};

function setDefaultHeaders (headers, options) {
  const defaultHeaders = {
    'Project-Id-Version': options.package,
    'MIME-Version': '1.0',
    'Content-Type': 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding': '8bit',
    'X-Poedit-Basepath': '..',
    'X-Poedit-SourceCharset': 'UTF-8',
    'X-Poedit-SearchPath-0': '.',
    'X-Poedit-SearchPathExcluded-0': '*.js'
  };

  return Object.assign({}, defaultHeaders, headers || {});
}

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
    globOpts: {},
    destFile: 'translations.pot',
    commentKeyword: 'translators:',
    headers: {},
    copyrightText: function (options) {
      const year = new Date().getFullYear();

      return `# Copyright (C) ${year} ${options.package}
# This file is distributed under the same license as the ${options.package} package.`;
    },
    defaultHeaders: true,
    includePOTCreationDate: true,
    noFilePaths: false,
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
    ],
    ignoreTemplateNameHeader: false,
    parser: 'php'
  };

  options = Object.assign({}, defaultOptions, options);

  if (options.headers === false) {
    options.defaultHeaders = false;
  } else {
    options.headers = setDefaultHeaders(options.headers, options);
  }

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
      functionCalls.pluralPosition[methodObject.name] = methodObject.plural;
    }
    if (methodObject.context) {
      functionCalls.contextPosition[methodObject.name] = methodObject.context;
    }
  });

  options.functionCalls = functionCalls;

  const ext = path.extname(options.src instanceof Array ? options.src[0] : options.src).slice(1);
  if (typeof parsers[ext] !== 'undefined') {
    options.parser = ext;
  }

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
    options.headers['Report-Msgid-Bugs-To'] = options.bugReport;
  }

  if (options.includePOTCreationDate) {
    const d = new Date();
    const nowString = [
      `${d.getUTCFullYear()}`,
      `-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      `-${String(d.getUTCDate()).padStart(2, '0')}`,
      ` ${String(d.getUTCHours()).padStart(2, '0')}`,
      `:${String(d.getUTCMinutes()).padStart(2, '0')}`,
      '+0000'
    ].join('');
    options.headers['POT-Creation-Date'] = nowString;
  }

  if (options.lastTranslator) {
    options.headers['Last-Translator'] = options.lastTranslator;
  }

  if (options.team) {
    options.headers['Language-Team'] = options.team;
  }

  if (options.defaultHeaders && !Object.prototype.hasOwnProperty.call(options.headers, 'X-Poedit-KeywordsList')) {
    options.headers['X-Poedit-KeywordsList'] = keywordsListStrings(options.gettextFunctions).join(';');
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
  const files = pathSort(matched.sync(options.src, options.globOpts));

  const Parser = parsers[options.parser];

  // Parse files
  for (const file of files) {
    const filecontent = fs.readFileSync(file).toString();
    const translationParser = new Parser(options);
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
