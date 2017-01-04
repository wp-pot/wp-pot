/* eslint-env node */
'use strict';

function extend (target) {
  const sources = [].slice.call(arguments, 1);
  sources.forEach(source => {
    for (let prop in source) {
      if (source.hasOwnProperty(prop)) {
        target[ prop ] = source[ prop ];
      }
    }
  });
  return target;
}
module.exports = extend;
