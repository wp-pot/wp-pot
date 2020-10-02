# wp-pot

## Information

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/wp-pot/wp-pot/Node%20CI/master)](https://github.com/wp-pot/wp-pot/actions) [![npm version](https://badge.fury.io/js/wp-pot.svg)](https://www.npmjs.com/package/wp-pot) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/wp-pot/wp-pot/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/wp-pot/wp-pot/?branch=master) [![Code Coverage](https://scrutinizer-ci.com/g/wp-pot/wp-pot/badges/coverage.png?b=master)](https://scrutinizer-ci.com/g/wp-pot/wp-pot/?branch=master) [![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/wp-pot/wp-pot.svg)](http://isitmaintained.com/project/wp-pot/wp-pot "Average time to resolve an issue") [![Percentage of issues still open](http://isitmaintained.com/badge/open/wp-pot/wp-pot.svg)](http://isitmaintained.com/project/wp-pot/wp-pot "Percentage of issues still open") 

| Package     | wp-pot                                               |
| ----------- | ---------------------------------------------------- |
| Description | Generate pot files for WordPress plugins and themes. |

## Like my work and want to say thanks?
Do it here:  
<a href="https://www.buymeacoffee.com/rasmus" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## Install

```
$ npm install --save-dev wp-pot
```


## Example usage

```js
const wpPot = require('wp-pot');

wpPot({
  destFile: 'file.pot',
  domain: 'domain',
  package: 'Example project',
  src: 'src/*.php'
});
```


## Options

*All options is optional*

- `bugReport`
  Description: Header with URL for reporting translation bugs.
  Type: `string`
  Default: undefined
- `commentKeyword`
  Description: Keyword to trigger translator comment.
  Type: `string`
  Default: `translators:`
- `domain`
  Description: Domain to retrieve the translated text. All textdomains is included if undefined.
  Type: `string`
  Default: undefined
- `destFile`
  Description: Filename for template file.
  Type: `string`
  Default: `domain.pot` or `translations.pot` if domain is undefined.
- `headers`
  Description: Object containing extra POT-file headers. Set to false to not generate the default extra headers for Poedit.
  Type: `object|bool`
  Default: Headers used by Poedit.
- `gettextFunctions`
  Description: Gettext functions used for finding translations.
  Type: `object`
  Default: WordPress translation functions.
- `lastTranslator`
  Description: Name and email address of the last translator (ex: `John Doe <me@example.com>`).
  Type: `string`
  Default: undefined
- `metadataFile`
  Description: Path to file containing plugin/theme metadata header relative to `relativeTo`
  Type: `string`
  Default: undefined
- `noFilePaths`
  Description: Do not print out file references in pot file.
  Type: `bool`
  Default: false
- `package`
  Description: Package name.
  Type: `string`
  Default: `domain` or `unnamed project` if domain is undefined.
- `relativeTo`
  Description: Path to folder that file comments should be relative to.
  Type: `string`
  Default: `destFile` location or current working directory if `destFile` is undefined.
- `src`
  Description: Glob or globs to match files
  Type: `string|array`
  Default: `**/*.php`
- `globOpts`
  Description: [node-glob options](https://github.com/isaacs/node-glob#options) object to be passed through.
  Type: `Object`
  Default: `{}`
- `team`
  Description: Name and email address of the translation team (ex: `Team <team@example.com> `).
  Type: `string`
  Default: undefined
- `writeFile`
  Description: Write pot-file to disk. The function always returns the contents as well.
  Type: `boolean`
  Default: `true`
- `ignoreTemplateNameHeader`
  Description: Do not extract `/* Template Name: String */` headers to POT file.
  Type: `boolean`
  Default: `false`


## Related
- [php-parser](https://github.com/glayzzle/php-parser) - NodeJS PHP Parser used in this project
- [gulp-wp-pot](https://github.com/wp-pot/gulp-wp-pot) - Run wp-pot via gulp
- [wp-pot-cli](https://github.com/wp-pot/wp-pot-cli) - Run wp-pot via cli command


## License

MIT © [Rasmus Bengtsson](https://github.com/rasmusbe)