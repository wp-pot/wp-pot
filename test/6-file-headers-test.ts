import test from "ava";
import { WP_Pot } from "../src/index";
import { verifyLanguageBlock } from "./helpers/test-helper";

test("Read theme headers", (t) => {
  const fixturePath = "test/fixtures/theme-headers.php";

  const potContents = new WP_Pot({ php: { metadataFile: fixturePath } })
    .parse(fixturePath)
    .generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":3",
      msgid: "Test Theme",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":4",
      msgid: "Rasmus Bengtsson",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":5",
      msgid: "Test Description",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":6",
      msgid: "http://www.example.org",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":7",
      msgid: "http://www.example.com",
    })
  );
});

test("Read plugin headers", (t) => {
  const fixturePath = "test/fixtures/plugin-headers.php";

  const potContents = new WP_Pot({ php: { metadataFile: fixturePath } })
    .parse(fixturePath)
    .generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":3",
      msgid: "Test Plugin",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":4",
      msgid: "Rasmus Bengtsson",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":5",
      msgid: "Test Description",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":6",
      msgid: "http://www.example.org",
    })
  );
  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":7",
      msgid: "http://www.example.com",
    })
  );
});

test("Read template name headers", (t) => {
  const fixturePath = "test/fixtures/template-headers.php";

  const potContents = new WP_Pot({ php: { metadataFile: fixturePath } })
    .parse(fixturePath)
    .generatePot();

  t.true(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":3",
      msgid: "Hello World",
    })
  );
});

test("Skip reading template name headers if ignoreTemplateNameHeader option true", (t) => {
  const fixturePath = "test/fixtures/template-headers.php";

  const potContents = new WP_Pot({ php: { ignoreTemplateNameHeader: true } })
    .parse(fixturePath)
    .generatePot();

  t.false(
    verifyLanguageBlock(potContents, {
      fileinfo: fixturePath + ":3",
      msgid: "Hello World",
    })
  );
});
