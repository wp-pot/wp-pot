import { WP_Pot } from "../src/index";
import { readFileSync } from "fs";
import anyTest, { TestInterface } from "ava";
import Observable from "zen-observable";

type Context = {
  defaultHeaders: string;
};

const test = anyTest as TestInterface<Context>;

test.before((t) => {
  t.context.defaultHeaders = readFileSync(
    "test/fixtures/default-headers.txt"
  ).toString();
});

test("Generate a pot file with default headers when no headers is set", (t) => {
  const potContents = new WP_Pot()
    .parse("test/fixures/empty-dir/*.php")
    .generatePot();

  t.not(potContents.indexOf(t.context.defaultHeaders), -1);
});

test("Generate a pot file with team, translator and bug report options set", (t) => {
  const potContents = new WP_Pot({
    pot: {
      bugReport: "http://example.com",
      lastTranslator: "John Doe <mail@example.com>",
      team: "Team Team <mail@example.com>",
    },
  })
    .parse("test/fixures/empty-dir/*.php")
    .generatePot();

  t.not(potContents.indexOf(t.context.defaultHeaders), -1);

  t.not(
    potContents.indexOf('"Report-Msgid-Bugs-To: http://example.com\\n"\n'),
    -1
  );

  t.not(
    potContents.indexOf('"Last-Translator: John Doe <mail@example.com>\\n"\n'),
    -1
  );

  t.not(
    potContents.indexOf('"Language-Team: Team Team <mail@example.com>\\n"\n'),
    -1
  );
});

test("Generate a pot file with extra headers set", (t) => {
  const potContents = new WP_Pot({
    pot: {
      extraHeaders: {
        "Report-Msgid-Bugs-To": "http://example.org",
        "Last-Translator": "John Doe <mail@example.org>",
        "Language-Team": "Team Team <mail@example.org>",
      },
    },
  })
    .parse("test/fixures/empty-dir/*.php")
    .generatePot();

  t.not(potContents.indexOf(t.context.defaultHeaders), -1);

  t.not(
    potContents.indexOf('"Report-Msgid-Bugs-To: http://example.org\\n"\n'),
    -1
  );

  t.not(
    potContents.indexOf('"Last-Translator: John Doe <mail@example.org>\\n"\n'),
    -1
  );

  t.not(
    potContents.indexOf('"Language-Team: Team Team <mail@example.org>\\n"\n'),
    -1
  );
});

test("Generate a pot file without default headers", (t) => {
  const potContents = new WP_Pot({
    pot: { defaultHeaders: false },
  })
    .parse("test/fixures/empty-dir/*.php")
    .generatePot();

  return Observable.from(t.context.defaultHeaders.split("\n")).map((line) =>
    t.is(potContents.indexOf(line), -1)
  );
});
