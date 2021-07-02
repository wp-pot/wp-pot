import { WP_Pot } from "../src/index";
import { tmpdir } from "os";
import { readFileSync, statSync } from "fs";
import test from "ava";

test("Write a file to the correct destination when given", (t) => {
  // Random string
  const randomName = [...Array(15)]
    .map(() => (~~(Math.random() * 36)).toString(36))
    .join("");

  const fixturePath = "test/fixtures/valid-functions.php";
  const tempPot = `${tmpdir()}/${randomName}.pot`; // Set temporary directory for file creation

  const wpPot = new WP_Pot().parse(fixturePath);
  const potContents = wpPot.generatePot();

  wpPot.writePot(tempPot);

  t.true(statSync(tempPot).isFile());
  t.is(readFileSync(tempPot).toString(), potContents);
});
