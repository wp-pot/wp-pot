// translators: This is a test
__('Single line comment', 'testdomain');

/*
 * translators: This is also a test
 */
__('Multiline comment, one line', 'testdomain');

/*
 * This comment includes lots of text
 *
 * translators: This is test number three
 */
__('Multiline comment, multi line', 'testdomain');

// translators: This comment doesn't do anything for translation
random_code();
random_code();
__('Comment too far away from function', 'testdomain');

// Other keyword: This is a comment to the translator
__('Comment with other keyword', 'testdomain');

// translators: This is a test with stored translations
const variable = __('Stored translation with comment', 'testdomain');

var t = [
  /* translators: sprintf test translation in array */
  sprintf(__('sprintf translation in array', 'testdomain')) // TODO
];

var t = {
  /* translators: test translation in keyed array */
  foo: __('translation in keyed array', 'testdomain')
};

const message = sprintf(
  /* translators: example inside sprintf */
  __('translation inside sprintf', 'testdomain') // TODO
);

// translators: This is comment 1
__('Multiple comments for same id', 'testdomain');

// translators: This is comment 2
__('Multiple comments for same id', 'testdomain');
