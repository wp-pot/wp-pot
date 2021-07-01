"use strict";

import { strict as assert } from "assert";
import { WP_Pot } from "../src/index";
import { describe, it } from "mocha";
import { verifyLanguageBlock } from "./test-helper";

describe("File path comment tests", () => {
  it("Can hide file paths", () => {
    const fixturePath = "test/fixtures/valid-functions.php";

    const potContents = new WP_Pot({ pot: { noFilePaths: true } })
      .parse(fixturePath)
      .generatePot();

    // Do not find the path
    assert(
      !verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":2",
        msgid: "Return string",
      })
    );

    // But find the string
    assert(
      verifyLanguageBlock(potContents, {
        msgid: "Return string",
      })
    );
  });

  it("Sets paths relative to option if set", () => {
    const fixturePath = "test/fixtures/comments.php";

    const potContents = new WP_Pot({
      pathsRelativeTo: "test",
    })
      .parse(fixturePath)
      .generatePot();

    assert(
      !verifyLanguageBlock(potContents, {
        comment: "translators: This is a test",
        fileinfo: fixturePath + ":3",
        msgid: "Single line comment",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        comment: "translators: This is a test",
        fileinfo: "fixtures/comments.php:3",
        msgid: "Single line comment",
      })
    );
  });
});

describe("Comment tests", () => {
  it("Can read different type of comments", () => {
    const fixturePath = "test/fixtures/comments.php";

    const potContents = new WP_Pot().parse(fixturePath).generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        comment: "translators: This is a test",
        fileinfo: fixturePath + ":3",
        msgid: "Single line comment",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        comment: "translators: This is also a test",
        fileinfo: fixturePath + ":8",
        msgid: "Multiline comment, one line",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        comment: "translators: This is test number three",
        fileinfo: fixturePath + ":15",
        msgid: "Multiline comment, multi line",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":20",
        msgid: "Comment too far away from function",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        comment: "translators: This is a test with stored translations",
        fileinfo: fixturePath + ":26",
        msgid: "Stored translation with comment",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        comment: "translators: sprintf test translation in array",
        fileinfo: fixturePath + ":30",
        msgid: "sprintf translation in array",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        comment: "translators: test translation in keyed array",
        fileinfo: fixturePath + ":35",
        msgid: "translation in keyed array",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        comment: "translators: example inside sprintf",
        fileinfo: fixturePath + ":40",
        msgid: "translation inside sprintf",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        comment: "translators: This is comment 1",
        fileinfo: fixturePath + ":44",
        msgid: "Multiple comments for same id",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        comment: "translators: This is comment 2",
        fileinfo: fixturePath + ":47",
        msgid: "Multiple comments for same id",
      })
    );
  });

  it("Can read comments with other trigger", () => {
    const fixturePath = "test/fixtures/comments.php";

    const potContents = new WP_Pot({
      php: { commentKeyword: "Other keyword:" },
    })
      .parse(fixturePath)
      .generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        comment: "Other keyword: This is a comment to the translator",
        fileinfo: fixturePath + ":23",
        msgid: "Comment with other keyword",
      })
    );

    // https://github.com/wp-pot/wp-pot/issues/39
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":44",
        msgid: "Multiple comments for same id",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":47",
        msgid: "Multiple comments for same id",
      })
    );
  });
});

describe("Comment edge cases", () => {
  it("Edge case with missing comment", () => {
    // https://github.com/wp-pot/wp-pot/issues/29#issuecomment-384191855

    const fixturePath = "test/fixtures/missing-comment.php";

    const potContents = new WP_Pot({
      php: { textdomain: "testdomain" },
    })
      .parse(fixturePath)
      .generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        comment: "translators: 1: current year, 2: site title link.",
        fileinfo: fixturePath + ":10",
        msgid: "&copy; %1$d %2$s",
        context: "site copyright",
      })
    );
  });
});
