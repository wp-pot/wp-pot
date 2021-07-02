import { WP_Pot } from "../src/index";
import { verifyLanguageBlock } from "./helpers/test-helper";
import anyTest, { TestInterface } from "ava";

type Context = {
  edgeCases: {
    potContents: string;
    fixturePath: string;
  };
};

const test = anyTest as TestInterface<Context>;

test.before((t) => {
  const edgeCases = "test/fixtures/edge-cases.php";

  t.context.edgeCases = {
    fixturePath: edgeCases,
    potContents: new WP_Pot().parse(edgeCases).generatePot(),
  };
});

test("Handle strings with escaped single quotes", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:2`,
      msgid: "It's escaped",
    })
  );
});

test("Handle strings with unescaped double quotes within single quotes", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:3`,
      msgid: "It's escaped",
    })
  );
});

test("Handle strings with escaped double quotes", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:4`,
      msgid: 'This is \\"escaped\\"',
    })
  );
});

test("Handle strings with double quotes", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:5`,
      msgid: 'This is \\"escaped\\"',
    })
  );
});

test("Handle strings with line breaks in function call", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:6`,
      msgid: '"\n"New\\n"\n"Line',
    })
  );
});

test("should handle strings with line breaks in function call", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:8`,
      msgid: '"\n"New\\n"\n"Line',
    })
  );
});

test("should handle empty strings", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:53`,
      msgid: "",
    })
  );
});

test("should handle plural methods with non-integer value as count", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:13`,
      msgid: "Singular string",
      plural: "Plural string",
    })
  );
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:14`,
      msgid: "Singular string",
      plural: "Plural string",
    })
  );
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:15`,
      msgid: "Singular string",
      plural: "Plural string",
    })
  );
});

test("should handle methods within other methods", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:22`,
      msgid: "Translation in function call",
    })
  );
});

test("should handle echoed methods", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:23`,
      msgid: "Echoed translation",
    })
  );
});

test("should handle methods in if blocks", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:25`,
      msgid: "Method in if block",
    })
  );
});

test("should handle methods in elseif blocks", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:27`,
      msgid: "Method in elseif block",
    })
  );
});

test("should handle methods in returns", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:29`,
      msgid: "Returned function",
    })
  );
});

test("should handle methods in exits", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:31`,
      msgid: "Exit message",
    })
  );
});

test("should handle methods in dies", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:32`,
      msgid: "Exit message",
    })
  );
});

test("should handle methods in try", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:34`,
      msgid: "Text within try",
    })
  );
});

test("should handle methods in catch", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:34`,
      msgid: "Text within catch",
    })
  );
});

test("should handle methods with root namespace", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:36`,
      msgid: "With root namespace",
    })
  );
});

test("should not include strings that are variables", (t) => {
  // https://github.com/wp-pot/wp-pot/issues/72
  t.true(
    !verifyLanguageBlock(t.context.edgeCases.potContents, {
      msgid: "$object->ignoreThis",
    })
  );
  t.true(
    !verifyLanguageBlock(t.context.edgeCases.potContents, {
      msgid: "$object->ignoreThis",
    })
  );
  t.true(
    !verifyLanguageBlock(t.context.edgeCases.potContents, {
      msgid: "$ignoreThis",
    })
  );
  t.true(
    !verifyLanguageBlock(t.context.edgeCases.potContents, {
      msgid: "$ignoreThis",
    })
  );
});

test("should include strings from concatenated functions", (t) => {
  // https://github.com/wp-pot/gulp-wp-pot/issues/108
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:44`,
      msgid: "Concat functions with .",
    })
  );
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:44`,
      msgid: "Concat functions with . again",
    })
  );
});

test("should include text in new class parameter", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:46`,
      msgid: "Text in new class parameter",
    })
  );
});

test("should include text in ternary statements", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:48`,
      msgid: "Text in true ternary statements",
    })
  );
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:49`,
      msgid: "Text in false ternary statements",
    })
  );
});

test("should include text in array keys", (t) => {
  t.true(
    verifyLanguageBlock(t.context.edgeCases.potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:51`,
      msgid: "Translation is in an array key",
    })
  );
});

test("should not die when using multiple namespaces in a file", (t) => {
  // https://github.com/wp-pot/wp-pot/issues/3
  const fixturePath = "test/fixtures/mixed-namespaces.php";
  const potContents = new WP_Pot().parse(fixturePath).generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: `${fixturePath}:3`,
      msgid: "Return string",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: `${fixturePath}:7`,
      msgid: "Return string",
    })
  );
});

test("should handle strings with domain set as variable", (t) => {
  const potContents = new WP_Pot({ php: { textdomain: "$test" } })
    .parse(t.context.edgeCases.fixturePath)
    .generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:16`,
      msgid: "Domain is a variable",
    })
  );
});

test("should handle strings with domain set as a object variable", (t) => {
  const potContents = new WP_Pot({ php: { textdomain: "$this->test" } })
    .parse(t.context.edgeCases.fixturePath)
    .generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:17`,
      msgid: "Domain is a object variable",
    })
  );
});

test("should handle strings with domain set as a static class variable", (t) => {
  const potContents = new WP_Pot({ php: { textdomain: "$this::test" } })
    .parse(t.context.edgeCases.fixturePath)
    .generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:18`,
      msgid: "Domain is a static class variable",
    })
  );
});

test("should handle strings with domain set as a constant", (t) => {
  const potContents = new WP_Pot({ php: { textdomain: "TEST" } })
    .parse(t.context.edgeCases.fixturePath)
    .generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: `${t.context.edgeCases.fixturePath}:19`,
      msgid: "Domain is a constant",
    })
  );
});

test("should not include methods without domain when domain is set", (t) => {
  const potContents = new WP_Pot({ php: { textdomain: "TEST" } })
    .parse(t.context.edgeCases.fixturePath)
    .generatePot();

  t.true(
    !verifyLanguageBlock(potContents, {
      msgid: "Missing domain",
    })
  );
});
