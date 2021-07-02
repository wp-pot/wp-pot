import { WP_Pot } from "../src/index";
import { verifyLanguageBlock } from "./helpers/test-helper";

import test from "ava";

test("Test custom method from $this", (t) => {
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

  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":2",
      msgid: "Hello",
    })
  );
  t.false(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":3",
      msgid: "World",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":10",
      msgid: "Custom translate function in method call",
    })
  );
});

test("Test custom method from custom class", (t) => {
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

  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":2",
      msgid: "Hello",
    })
  );
  t.false(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":3",
      msgid: "World",
    })
  );
});

test("Test function calls in other methods", (t) => {
  const fixturePath = "test/fixtures/custom-method.php";

  const potContents = new WP_Pot().parse(fixturePath).generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":7",
      msgid: "Translate function in method call",
    })
  );
});
