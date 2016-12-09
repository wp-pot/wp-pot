# wp-pot

## Information

[![npm version](https://badge.fury.io/js/wp-pot.svg)](https://www.npmjs.com/package/wp-pot) [![Build Status](https://travis-ci.org/rasmusbe/wp-pot.svg?branch=master)](https://travis-ci.org/rasmusbe/wp-pot) [![Dependency Status](https://www.versioneye.com/user/projects/584abc29bcc3a20035a9a836/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/584abc29bcc3a20035a9a836) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/rasmusbe/wp-pot/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/rasmusbe/wp-pot/?branch=master)[![Code Coverage](https://scrutinizer-ci.com/g/rasmusbe/wp-pot/badges/coverage.png?b=master)](https://scrutinizer-ci.com/g/rasmusbe/wp-pot/?branch=master)



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
- `package`  
  Description: Package name
  Type: `string`  
  Default: `domain` or `unnamed project` if domain is undefined
- `src`  
  Description: Glob or globs to match files (see [Globbing Patterns](https://github.com/sindresorhus/globby#globbing-patterns))  
  Type: `string|array`  
  Default: `**/*.php`
- `writeFile`  
  Description: Write pot-file to disk. The function always returns the contents as well.  
  Type: `boolean`  
  Default: `true`



## License

MIT © [Rasmus Bengtsson](https://github.com/rasmusbe)
