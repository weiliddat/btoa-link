import { suite, test } from "node:test";
import { equal } from "node:assert";

import { makeBase85Codec } from "./b85.js";

const cases = [
  { input: "asdf", output: "vrk;," },
  { input: "hello", output: "1g4I1(m" },
  { input: "hello world", output: "aBng7.H[/kelWb" },
];

suite("b85", () => {
  cases.forEach(({ input, output }) => {
    test(`encode ${input}`, () => {
      const b85 = makeBase85Codec();
      const encoded = b85.encode(new TextEncoder().encode(input));
      equal(encoded, output);
    });
  });

  cases.forEach(({ input, output }) => {
    test(`decode ${output}`, () => {
      const b85 = makeBase85Codec();
      const decoded = b85.decodeText(output);
      equal(decoded, input);
    });
  });
});
