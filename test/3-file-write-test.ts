/* eslint-env node, mocha */
"use strict";

import { strict as assert } from "assert";
import { WP_Pot } from "../src/index";
import { describe, it } from "mocha";
import { tmpdir } from "os";
import { readFileSync, statSync } from "fs";

describe("File write tests", () => {
  it("should write a file to the correct destination when given", () => {
    // Random string
    const randomName = [...Array(15)]
      .map(() => (~~(Math.random() * 36)).toString(36))
      .join("");

    const fixturePath = "test/fixtures/valid-functions.php";
    const tempPot = `${tmpdir()}/${randomName}.pot`; // Set temporary directory for file creation

    const wpPot = new WP_Pot().parse(fixturePath);
    const potContents = wpPot.generatePot();

    wpPot.writePot(tempPot);

    assert(statSync(tempPot).isFile());
    assert.equal(readFileSync(tempPot).toString(), potContents);
  });
});
