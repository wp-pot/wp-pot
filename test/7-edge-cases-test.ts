/* eslint-env node, mocha */
"use strict";

import { strict as assert } from "assert";
import { WP_Pot } from "../src/index";
import { describe, it } from "mocha";
import { verifyLanguageBlock } from "./test-helper";

describe("Edge cases function tests", () => {
  const fixturePath = "test/fixtures/edge-cases.php";
  const potContents = new WP_Pot().parse(fixturePath).generatePot();

  it("should handle strings with escaped single quotes", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":2",
        msgid: "It's escaped",
      })
    );
  });

  it("should handle strings with unescaped double quotes within single quotes", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":3",
        msgid: "It's escaped",
      })
    );
  });

  it("should handle strings with escaped double quotes", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":4",
        msgid: 'This is \\"escaped\\"',
      })
    );
  });

  it("should handle strings with double quotes", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":5",
        msgid: 'This is \\"escaped\\"',
      })
    );
  });

  it("should handle strings with line breaks in function call", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":6",
        msgid: '"\n"New\\n"\n"Line',
      })
    );
  });

  it("should handle strings with line breaks in function call", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":8",
        msgid: '"\n"New\\n"\n"Line',
      })
    );
  });

  it("should handle empty strings", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":53",
        msgid: "",
      })
    );
  });

  it("should handle plural methods with non-integer value as count", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":13",
        msgid: "Singular string",
        plural: "Plural string",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":14",
        msgid: "Singular string",
        plural: "Plural string",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":15",
        msgid: "Singular string",
        plural: "Plural string",
      })
    );
  });

  it("should handle methods within other methods", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":22",
        msgid: "Translation in function call",
      })
    );
  });

  it("should handle echoed methods", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":23",
        msgid: "Echoed translation",
      })
    );
  });

  it("should handle methods in if blocks", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":25",
        msgid: "Method in if block",
      })
    );
  });

  it("should handle methods in elseif blocks", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":27",
        msgid: "Method in elseif block",
      })
    );
  });

  it("should handle methods in returns", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":29",
        msgid: "Returned function",
      })
    );
  });

  it("should handle methods in exits", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":31",
        msgid: "Exit message",
      })
    );
  });

  it("should handle methods in dies", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":32",
        msgid: "Exit message",
      })
    );
  });

  it("should handle methods in try", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":34",
        msgid: "Text within try",
      })
    );
  });

  it("should handle methods in catch", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":34",
        msgid: "Text within catch",
      })
    );
  });

  it("should handle methods with root namespace", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":36",
        msgid: "With root namespace",
      })
    );
  });

  it("should not include strings that are variables", () => {
    // https://github.com/wp-pot/wp-pot/issues/72
    assert(
      !verifyLanguageBlock(potContents, {
        msgid: "$object->ignoreThis",
      })
    );
    assert(
      !verifyLanguageBlock(potContents, {
        msgid: "$object->ignoreThis",
      })
    );
    assert(
      !verifyLanguageBlock(potContents, {
        msgid: "$ignoreThis",
      })
    );
    assert(
      !verifyLanguageBlock(potContents, {
        msgid: "$ignoreThis",
      })
    );
  });

  it("should include strings from concatenated functions", () => {
    // https://github.com/wp-pot/gulp-wp-pot/issues/108
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":44",
        msgid: "Concat functions with .",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":44",
        msgid: "Concat functions with . again",
      })
    );
  });

  it("should include text in new class parameter", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":46",
        msgid: "Text in new class parameter",
      })
    );
  });

  it("should include text in ternary statements", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":48",
        msgid: "Text in true ternary statements",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":49",
        msgid: "Text in false ternary statements",
      })
    );
  });

  it("should include text in array keys", () => {
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":51",
        msgid: "Translation is in an array key",
      })
    );
  });
});

describe("Namespace edge cases", () => {
  // https://github.com/wp-pot/wp-pot/issues/3
  const fixturePath = "test/fixtures/mixed-namespaces.php";
  it("should not die when using multiple namespaces in a file", () => {
    const potContents = new WP_Pot().parse(fixturePath).generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":3",
        msgid: "Return string",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":7",
        msgid: "Return string",
      })
    );
  });
});

describe("Edge cases domain tests", () => {
  const fixturePath = "test/fixtures/edge-cases.php";

  it("should handle strings with domain set as variable", () => {
    const potContents = new WP_Pot({ php: { textdomain: "$test" } })
      .parse(fixturePath)
      .generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":16",
        msgid: "Domain is a variable",
      })
    );
  });

  it("should handle strings with domain set as a object variable", () => {
    const potContents = new WP_Pot({ php: { textdomain: "$this->test" } })
      .parse(fixturePath)
      .generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":17",
        msgid: "Domain is a object variable",
      })
    );
  });

  it("should handle strings with domain set as a static class variable", () => {
    const potContents = new WP_Pot({ php: { textdomain: "$this::test" } })
      .parse(fixturePath)
      .generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":18",
        msgid: "Domain is a static class variable",
      })
    );
  });

  it("should handle strings with domain set as a constant", () => {
    const potContents = new WP_Pot({ php: { textdomain: "TEST" } })
      .parse(fixturePath)
      .generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":19",
        msgid: "Domain is a constant",
      })
    );
  });

  it("should not include methods without domain when domain is set", () => {
    const potContents = new WP_Pot({ php: { textdomain: "TEST" } })
      .parse(fixturePath)
      .generatePot();

    assert(
      !verifyLanguageBlock(potContents, {
        msgid: "Missing domain",
      })
    );
  });
});
