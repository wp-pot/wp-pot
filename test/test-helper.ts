"use strict";

import { strict as assert } from "assert";

type VerifyLanguageBlockOptions = {
  msgid: string;
  comment?: string;
  fileinfo?: string;
  plural?: string;
  context?: string;
};

export const verifyLanguageBlock = (
  potContents: string,
  expected: VerifyLanguageBlockOptions
): boolean => {
  const blocks = potContents.split("\n\n");

  for (const block of blocks) {
    const blocklines = block.split("\n");

    const commentLines = blocklines.reduce(
      (lines: string[], line: string): string[] => {
        if (line.match(/^#\. /)) {
          lines.push(line);
        }

        return lines;
      },
      []
    );

    if (
      expected.comment &&
      commentLines.indexOf(`#. ${expected.comment}`) === -1
    ) {
      continue;
    } else if (!expected.comment && commentLines.length) {
      continue;
    }

    // Check if correct file
    if (
      expected.fileinfo &&
      blocklines[commentLines.length].indexOf(expected.fileinfo) === -1
    ) {
      continue;
    }

    // Check if msgid is correct
    if (block.indexOf(`msgid "${expected.msgid}"\n`) === -1) {
      continue;
    }

    // Check if plural msgid is correct
    if (
      expected.plural &&
      block.indexOf(`msgid_plural "${expected.plural}"\n`) === -1
    ) {
      continue;
    } else if (!expected.plural && block.indexOf("msgid_plural") !== -1) {
      continue;
    }

    // Check if context is correct
    if (
      expected.context &&
      block.indexOf(`msgctxt "${expected.context}"\n`) === -1
    ) {
      continue;
    } else if (!expected.context && block.indexOf("msgctxt") !== -1) {
      continue;
    }

    // Check if msgstr is correct when plural
    if (
      expected.plural &&
      block.indexOf('msgstr[0] ""\n') === -1 &&
      block.indexOf('msgstr[1] ""\n') === -1 &&
      block.indexOf('msgstr ""\n') !== -1
    ) {
      continue;
      // Check if msgstr is correct when singular
    } else if (
      !expected.plural &&
      block.indexOf('msgstr[0] ""\n') !== -1 &&
      block.indexOf('msgstr[1] ""\n') !== -1 &&
      block.indexOf('msgstr ""\n') === -1
    ) {
      continue;
    }

    return true;
  }
  return false;
};

/**
 * Test the valid-functions.php file
 * Since this file is used many times its a separate function
 * @param potContents
 * @param fixturePath
 * @param invert
 */
export const testValidFunctions = (
  potContents: string,
  fixturePath: string,
  invert = false
): void => {
  const test: typeof assert["ok"] = (value, message?: string | Error): void => {
    assert.equal(value, !invert, message);
  };

  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":2",
      msgid: "Return string",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":3",
      msgid: "Print string",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":4",
      msgid: "Escape for attribute and return string",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":5",
      msgid: "Escape for attribute and print string",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":6",
      msgid: "Escape for html and return string",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":7",
      msgid: "Escape for html and print string",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":8",
      msgid: "Return string with context",
      context: "Some context",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":9",
      msgid: "Print string with context",
      context: "Some context",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":10",
      msgid: "Escape string with context for attribute",
      context: "Some context",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":11",
      msgid: "Escape string with context for html",
      context: "Some context",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":12",
      msgid: "Singular string",
      plural: "Plural string",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":13",
      msgid: "Singular string with noop",
      plural: "Plural string with noop",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":14",
      msgid: "Singular string with context",
      plural: "Plural string with context",
      context: "Some context",
    })
  );
  test(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":15",
      msgid: "Singular string with noop and context",
      plural: "Plural string with noop and context",
      context: "Some context",
    })
  );
};
