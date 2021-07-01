/* eslint-env node, mocha */
"use strict";

import { strict as assert } from "assert";
import { WP_Pot } from "../src/index";
import { describe, it } from "mocha";
import { verifyLanguageBlock } from "./test-helper";

describe("File Headers tests", () => {
  it("Can read theme headers", () => {
    const fixturePath = "test/fixtures/theme-headers.php";

    const potContents = new WP_Pot({ php: { metadataFile: fixturePath } })
      .parse(fixturePath)
      .generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":3",
        msgid: "Test Theme",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":4",
        msgid: "Rasmus Bengtsson",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":5",
        msgid: "Test Description",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":6",
        msgid: "http://www.example.org",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":7",
        msgid: "http://www.example.com",
      })
    );
  });

  it("Can read plugin headers", () => {
    const fixturePath = "test/fixtures/plugin-headers.php";

    const potContents = new WP_Pot({ php: { metadataFile: fixturePath } })
      .parse(fixturePath)
      .generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":3",
        msgid: "Test Plugin",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":4",
        msgid: "Rasmus Bengtsson",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":5",
        msgid: "Test Description",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":6",
        msgid: "http://www.example.org",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":7",
        msgid: "http://www.example.com",
      })
    );
  });

  it("Can read template name headers", () => {
    const fixturePath = "test/fixtures/template-headers.php";

    const potContents = new WP_Pot({ php: { metadataFile: fixturePath } })
      .parse(fixturePath)
      .generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":3",
        msgid: "Hello World",
      })
    );
  });

  it("Skips reading template name headers if skipTemplateNameHeader option true", () => {
    const fixturePath = "test/fixtures/template-headers.php";

    const potContents = new WP_Pot({ php: { ignoreTemplateNameHeader: true } })
      .parse(fixturePath)
      .generatePot();

    assert.strictEqual(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":3",
        msgid: "Hello World",
      }),
      false
    );
  });
});
