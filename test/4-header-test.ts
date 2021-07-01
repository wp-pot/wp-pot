/* eslint-env node, mocha */
"use strict";

import { strict as assert } from "assert";
import { WP_Pot } from "../src/index";
import { describe, it } from "mocha";
import { readFileSync } from "fs";

const defaultHeaders = readFileSync(
  "test/fixtures/default-headers.txt"
).toString();

describe("Header tests", () => {
  it("should generate a pot file with default headers when no headers is set", () => {
    const potContents = new WP_Pot()
      .parse("test/fixures/empty-dir/*.php")
      .generatePot();

    assert(potContents.indexOf(defaultHeaders) !== -1);
  });

  it("should generate a pot file with team, translator or bug report options set", () => {
    const potContents = new WP_Pot({
      pot: {
        bugReport: "http://example.com",
        lastTranslator: "John Doe <mail@example.com>",
        team: "Team Team <mail@example.com>",
      },
    })
      .parse("test/fixures/empty-dir/*.php")
      .generatePot();

    assert(potContents.indexOf(defaultHeaders) !== -1);
    assert(
      potContents.indexOf('"Report-Msgid-Bugs-To: http://example.com\\n"\n') !==
        -1
    );
    assert(
      potContents.indexOf(
        '"Last-Translator: John Doe <mail@example.com>\\n"\n'
      ) !== -1
    );
    assert(
      potContents.indexOf(
        '"Language-Team: Team Team <mail@example.com>\\n"\n'
      ) !== -1
    );
  });

  it("should generate a pot file with extra headers set", () => {
    const potContents = new WP_Pot({
      pot: {
        extraHeaders: {
          "Report-Msgid-Bugs-To": "http://example.com",
          "Last-Translator": "John Doe <mail@example.com>",
          "Language-Team": "Team Team <mail@example.com>",
        },
      },
    })
      .parse("test/fixures/empty-dir/*.php")
      .generatePot();

    assert(potContents.indexOf(defaultHeaders) !== -1);

    assert(
      potContents.indexOf('"Report-Msgid-Bugs-To: http://example.com\\n"\n') !==
        -1
    );
    assert(
      potContents.indexOf(
        '"Last-Translator: John Doe <mail@example.com>\\n"\n'
      ) !== -1
    );
    assert(
      potContents.indexOf(
        '"Language-Team: Team Team <mail@example.com>\\n"\n'
      ) !== -1
    );
  });

  it("should generate a pot file without default headers from php file with headers false", () => {
    const potContents = new WP_Pot({
      pot: { defaultHeaders: false },
    })
      .parse("test/fixures/empty-dir/*.php")
      .generatePot();

    defaultHeaders.split("\n").forEach(function (line) {
      assert(potContents.indexOf(line) === -1);
    });
  });
});
