#!/usr/bin/env node

const meow = require('meow');
const wpPot = require('.');
const cli = meow(`
    Usage
      $ wp-pot <input>

    Options
      --src, -s  Source file
      --dest-file, -d Destination file
      --write-file, -w Write file

    Examples
      $ wp-pot --src 'src/*.php'
`, {
  alias: {
    s: 'src',
    d: 'dest-file',
    w: 'write-file'
  }
});

// Bail if source file is undefined.
if (cli.flags.src === undefined) {
  console.log('Source flag is empty');
  process.exit(1);
}

// Destination file cannot be empty if write file is true.
if (!cli.flags.destFile && cli.flags.writeFile) {
  console.log('Destination file flag is empty');
  process.exit(1);
}

let content = wpPot({
  src: cli.flags.src,
  destFile: cli.flags.destFile,
  writeFile: cli.flags.writeFile
});

// Output content if we shouldn't write a file.
if (!cli.flags.writeFile) {
  console.log(content);
}
