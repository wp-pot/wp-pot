import test from "ava";
import { WP_Pot } from "../src/index";
import { verifyLanguageBlock } from "./helpers/test-helper";

test("Hide file paths", (t) => {
  const fixturePath = "test/fixtures/valid-functions.php";

  const potContents = new WP_Pot({ pot: { noFilePaths: true } })
    .parse(fixturePath)
    .generatePot();

  // Do not find the path
  t.false(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":2",
      msgid: "Return string",
    })
  );

  // But find the string
  t.true(
    verifyLanguageBlock(potContents, {
      msgid: "Return string",
    })
  );
});

test("Set file paths relative to option", (t) => {
  const fixturePath = "test/fixtures/comments.php";

  const potContents = new WP_Pot({
    pathsRelativeTo: "test",
  })
    .parse(fixturePath)
    .generatePot();

  t.false(
    verifyLanguageBlock(potContents, {
      comment: "translators: This is a test",
      fileinfo: fixturePath + ":3",
      msgid: "Single line comment",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      comment: "translators: This is a test",
      fileinfo: "fixtures/comments.php:3",
      msgid: "Single line comment",
    })
  );
});

test("Read different type of comments", (t) => {
  const fixturePath = "test/fixtures/comments.php";

  const potContents = new WP_Pot().parse(fixturePath).generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      comment: "translators: This is a test",
      fileinfo: fixturePath + ":3",
      msgid: "Single line comment",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      comment: "translators: This is also a test",
      fileinfo: fixturePath + ":8",
      msgid: "Multiline comment, one line",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      comment: "translators: This is test number three",
      fileinfo: fixturePath + ":15",
      msgid: "Multiline comment, multi line",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":20",
      msgid: "Comment too far away from function",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      comment: "translators: This is a test with stored translations",
      fileinfo: fixturePath + ":26",
      msgid: "Stored translation with comment",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      comment: "translators: sprintf test translation in array",
      fileinfo: fixturePath + ":30",
      msgid: "sprintf translation in array",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      comment: "translators: test translation in keyed array",
      fileinfo: fixturePath + ":35",
      msgid: "translation in keyed array",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      comment: "translators: example inside sprintf",
      fileinfo: fixturePath + ":40",
      msgid: "translation inside sprintf",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      comment: "translators: This is comment 1",
      fileinfo: fixturePath + ":44",
      msgid: "Multiple comments for same id",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      comment: "translators: This is comment 2",
      fileinfo: fixturePath + ":47",
      msgid: "Multiple comments for same id",
    })
  );
});

test("Read comments with other trigger", (t) => {
  const fixturePath = "test/fixtures/comments.php";

  const potContents = new WP_Pot({
    php: { commentKeyword: "Other keyword:" },
  })
    .parse(fixturePath)
    .generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      comment: "Other keyword: This is a comment to the translator",
      fileinfo: fixturePath + ":23",
      msgid: "Comment with other keyword",
    })
  );

  // https://github.com/wp-pot/wp-pot/issues/39
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":44",
      msgid: "Multiple comments for same id",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":47",
      msgid: "Multiple comments for same id",
    })
  );
});

test("Edge case with missing comment", (t) => {
  // https://github.com/wp-pot/wp-pot/issues/29#issuecomment-384191855

  const fixturePath = "test/fixtures/missing-comment.php";

  const potContents = new WP_Pot({
    php: { textdomain: "testdomain" },
  })
    .parse(fixturePath)
    .generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      comment: "translators: 1: current year, 2: site title link.",
      fileinfo: fixturePath + ":10",
      msgid: "&copy; %1$d %2$s",
      context: "site copyright",
    })
  );
});
