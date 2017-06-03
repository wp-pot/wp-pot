# wp-pot

## Information

[![npm version](https://badge.fury.io/js/wp-pot.svg)](https://www.npmjs.com/package/wp-pot) [![Build Status](https://travis-ci.org/rasmusbe/wp-pot.svg?branch=master)](https://travis-ci.org/rasmusbe/wp-pot) [![Dependency Status](https://www.versioneye.com/user/projects/586ba33f3ab14800408b105f/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/586ba33f3ab14800408b105f) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/rasmusbe/wp-pot/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/rasmusbe/wp-pot/?branch=master) [![Code Coverage](https://scrutinizer-ci.com/g/rasmusbe/wp-pot/badges/coverage.png?b=master)](https://scrutinizer-ci.com/g/rasmusbe/wp-pot/?branch=master)

| Package     | wp-pot                                   |
| ----------- | ---------------------------------------- |
| Description | Generate pot files for WordPress plugins and themes. |

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
  Description: Header with URL for reporting translation bugs  
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
  Description: Filename for template file  
  Type: `string`  
  Default: `domain.pot` or `translations.pot` if domain is undefined
- `headers`  
  Description: Object containing extra POT-file headers. Set to false to not generate the default extra headers for Poedit.  
  Type: `object|bool`  
  Default: Headers used by Poedit
- `gettextFunctions`  
  Description: Gettext functions used for finding translations.  
  Type: `object`  
  Default: WordPress translation functions
- `lastTranslator`  
  Description: Name and email address of the last translator (ex: `John Doe <me@example.com>`)  
  Type: `string`  
  Default: undefined
- `metadataFile`  
  Description: Path to file containing plugin/theme metadata header relative to `relativeTo`  
  Type: `string`  
  Default: undefined
- `package`  
  Description: Package name  
  Type: `string`  
  Default: `domain` or `unnamed project` if domain is undefined
- `relativeTo`  
  Description: Path to folder that file comments should be relative to  
  Type: `string`  
  Default: `destFile` location or current working directory if `destFile` is undefined
- `src`  
  Description: Glob or globs to match files (see [Globbing Patterns](https://github.com/sindresorhus/globby#globbing-patterns))  
  Type: `string|array`  
  Default: `**/*.php`
- `team`  
  Description: Name and email address of the translation team (ex: `Team <team@example.com> `)  
  Type: `string`    
  Default: undefined
- `writeFile`  
  Description: Write pot-file to disk. The function always returns the contents as well.  
  Type: `boolean`  
  Default: `true`


## Related
- [gulp-wp-pot](https://github.com/rasmusbe/gulp-wp-pot) - Run wp-pot via gulp  
- [wp-pot-cli](https://github.com/rasmusbe/wp-pot-cli) - Run wp-pot via cli command


## License

MIT © [Rasmus Bengtsson](https://github.com/rasmusbe)
