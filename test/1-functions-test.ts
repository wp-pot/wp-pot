import { WP_Pot } from "../src/index";
import { testValidFunctions, verifyLanguageBlock } from "./helpers/test-helper";

import test from "ava";

test("Read all valid functions without domain check", (t) => {
  const fixturePath = "test/fixtures/valid-functions.php";

  const potContents = new WP_Pot().parse(fixturePath).generatePot();

  testValidFunctions(t, { fixturePath, potContents });
});

test("Can read all valid functions with domain check", (t) => {
  const fixturePath = "test/fixtures/valid-functions.php";

  const potContents = new WP_Pot({ php: { textdomain: "testdomain" } })
    .parse(fixturePath)
    .generatePot();

    testValidFunctions(t, { fixturePath, potContents });
});

test("Can not find any functions with domain check if invalid domain", (t) => {
  const fixturePath = "test/fixtures/valid-functions.php";

  const potContents = new WP_Pot({ php: { textdomain: "other-domain" } })
    .parse(fixturePath)
    .generatePot();

    testValidFunctions(t, { fixturePath, potContents }, false);
});

test("Can merge duplicate strings and separate with context", (t) => {
  const fixturePaths = [
    "test/fixtures/duplicated-strings-1.php",
    "test/fixtures/duplicated-strings-2.php",
  ];

  const potContents = new WP_Pot({ php: { textdomain: "testdomain" } })
    .parse(fixturePaths)
    .generatePot();

  for (const fixturePath of fixturePaths) {
    t.true(
      verifyLanguageBlock(potContents, {
        msgid: "Simple string",
        fileinfo: `${fixturePath}:2`,
      })
    );
    t.true(
      verifyLanguageBlock(potContents, {
        msgid: "Simple string",
        fileinfo: `${fixturePath}:3`,
      })
    );
    t.true(
      verifyLanguageBlock(potContents, {
        msgid: "Simple string",
        fileinfo: `${fixturePath}:4`,
        context: "with context",
      })
    );
    t.true(
      verifyLanguageBlock(potContents, {
        msgid: "Simple string",
        fileinfo: `${fixturePath}:5`,
        context: "with context",
      })
    );
    t.true(
      verifyLanguageBlock(potContents, {
        msgid: "Single and plural string",
        fileinfo: `${fixturePath}:6`,
        plural: "Plural string",
      })
    );
    t.true(
      verifyLanguageBlock(potContents, {
        msgid: "Single and plural string",
        fileinfo: `${fixturePath}:7`,
        plural: "Plural string",
      })
    );
    t.true(
      verifyLanguageBlock(potContents, {
        msgid: "Single and plural string",
        fileinfo: `${fixturePath}:8`,
        plural: "Plural string",
        context: "with context",
      })
    );
    t.false(
      verifyLanguageBlock(potContents, {
        msgid: "Simple string",
        fileinfo: `${fixturePath}:9`,
      })
    );
  }
});
