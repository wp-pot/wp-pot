"use strict";

import { strict as assert } from "assert";
import { WP_Pot } from "../src/index";
import {
  testValidFunctions,
  verifyLanguageBlock,
} from "./test-helper";
import { describe, it } from "mocha";

describe("Function tests", () => {
  it("Can read all valid functions without domain check", () => {
    const fixturePath = "test/fixtures/valid-functions.php";

    const potContents = new WP_Pot().parse(fixturePath).generatePot();

    testValidFunctions(potContents, fixturePath);
  });

  it("Can read all valid functions with domain check", () => {
    const fixturePath = "test/fixtures/valid-functions.php";

    const potContents = new WP_Pot({ php: { textdomain: "testdomain" } })
      .parse(fixturePath)
      .generatePot();

    testValidFunctions(potContents, fixturePath);
  });

  it("Can not find any functions with domain check if invalid domain", () => {
    const fixturePath = "test/fixtures/valid-functions.php";

    const potContents = new WP_Pot({ php: { textdomain: "other-domain" } })
      .parse(fixturePath)
      .generatePot();

    testValidFunctions(potContents, fixturePath, true);
  });

  it("Can merge duplicate strings and separate with context", () => {
    const fixturePaths = [
      "test/fixtures/duplicated-strings-1.php",
      "test/fixtures/duplicated-strings-2.php",
    ];

    const potContents = new WP_Pot({ php: { textdomain: "testdomain" } })
      .parse(fixturePaths)
      .generatePot();

    for (const fixturePath of fixturePaths) {
      assert(
        verifyLanguageBlock(potContents, {
          msgid: "Simple string",
          fileinfo: `${fixturePath}:2`,
        })
      );
      assert(
        verifyLanguageBlock(potContents, {
          msgid: "Simple string",
          fileinfo: `${fixturePath}:3`,
        })
      );
      assert(
        verifyLanguageBlock(potContents, {
          msgid: "Simple string",
          fileinfo: `${fixturePath}:4`,
          context: "with context",
        })
      );
      assert(
        verifyLanguageBlock(potContents, {
          msgid: "Simple string",
          fileinfo: `${fixturePath}:5`,
          context: "with context",
        })
      );
      assert(
        verifyLanguageBlock(potContents, {
          msgid: "Single and plural string",
          fileinfo: `${fixturePath}:6`,
          plural: "Plural string",
        })
      );
      assert(
        verifyLanguageBlock(potContents, {
          msgid: "Single and plural string",
          fileinfo: `${fixturePath}:7`,
          plural: "Plural string",
        })
      );
      assert(
        verifyLanguageBlock(potContents, {
          msgid: "Single and plural string",
          fileinfo: `${fixturePath}:8`,
          plural: "Plural string",
          context: "with context",
        })
      );
      assert(
        !verifyLanguageBlock(potContents, {
          msgid: "Simple string",
          fileinfo: `${fixturePath}:9`,
        })
      );
    }
  });
});
