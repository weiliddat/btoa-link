import { suite, test } from "node:test";
import { equal } from "node:assert";

import { makeBase85Codec } from "./b85.js";

const cases = [{ input: "asdf" }, { input: "hello" }, { input: "hello world" }];

suite("b85", () => {
  cases.forEach(({ input }) => {
    test(`round-trip ${input}`, () => {
      const b85 = makeBase85Codec();
      const encoded = b85.encodeText(input);
      console.log(`${input} encoded into ${encoded}`);

      const decoded = b85.decodeText(encoded);
      equal(decoded, input);
    });
  });
});
