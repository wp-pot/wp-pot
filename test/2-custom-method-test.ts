/* eslint-env node, mocha */
"use strict";

import { strict as assert } from "assert";
import { WP_Pot } from "../src/index";
import { verifyLanguageBlock } from "./test-helper";
import { describe, it } from "mocha";

describe("Custom method tests", () => {
  it("Test custom method from this", () => {
    const fixturePath = "test/fixtures/custom-method.php";

    const potContents = new WP_Pot({
      php: {
        gettextFunctions: [
          {
            name: "$this->trans",
          },
        ],
      },
    })
      .parse(fixturePath)
      .generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":2",
        msgid: "Hello",
      })
    );
    assert(
      !verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":3",
        msgid: "World",
      })
    );
    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":10",
        msgid: "Custom translate function in method call",
      })
    );
  });

  it("Test custom method from custom class", () => {
    const fixturePath = "test/fixtures/custom-method.php";

    const potContents = new WP_Pot({
      php: {
        gettextFunctions: [
          {
            name: "$this->trans",
          },
        ],
      },
    })
      .parse(fixturePath)
      .generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":2",
        msgid: "Hello",
      })
    );
    assert(
      !verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":3",
        msgid: "World",
      })
    );
  });

  it("Test function calls in other methods", () => {
    const fixturePath = "test/fixtures/custom-method.php";

    const potContents = new WP_Pot().parse(fixturePath).generatePot();

    assert(
      verifyLanguageBlock(potContents, {
        fileinfo: fixturePath + ":7",
        msgid: "Translate function in method call",
      })
    );
  });
});
