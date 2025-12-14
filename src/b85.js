// @ts-check

const BASE85_ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=~!/*?&_,()[]{}@;$#";

export function makeBase85Codec() {
  const charToValue = /** @type {Record<string, number>} */ (
    Object.create(null)
  );

  if (BASE85_ALPHABET.length !== 85) {
    throw new Error("Alphabet must be exactly 85 chars.");
  }

  for (let i = 0; i < BASE85_ALPHABET.length; i++) {
    const ch = BASE85_ALPHABET[i];
    if (ch in charToValue) {
      throw new Error(`Duplicate character in alphabet: ${JSON.stringify(ch)}`);
    }
    charToValue[ch] = i;
  }

  /**
   * @param {Uint8Array} bytes
   * @returns {string}
   */
  function encode(bytes) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError("encode() expects Uint8Array.");
    }

    if (bytes.length === 0) return "";

    let out = "";
    for (let i = 0; i < bytes.length; i += 4) {
      const remaining = bytes.length - i;
      const n0 = bytes[i] ?? 0;
      const n1 = bytes[i + 1] ?? 0;
      const n2 = bytes[i + 2] ?? 0;
      const n3 = bytes[i + 3] ?? 0;

      let value = n0 * 256 ** 3 + n1 * 256 ** 2 + n2 * 256 + n3;

      const digits = new Array(5);
      for (let d = 4; d >= 0; d--) {
        digits[d] = value % 85;
        value = Math.floor(value / 85);
      }

      const outChars = remaining >= 4 ? 5 : remaining + 1;
      for (let d = 0; d < outChars; d++) {
        out += BASE85_ALPHABET[digits[d]];
      }
    }

    return out;
  }

  /**
   * @param {string} str
   * @returns {Uint8Array}
   */
  function decode(str) {
    if (typeof str !== "string") {
      throw new TypeError("decode() expects a string.");
    }

    if (str.length === 0) return new Uint8Array(0);
    if (str.length === 1) {
      throw new Error("Invalid base85: length cannot be 1.");
    }

    const out = [];
    for (let i = 0; i < str.length; i += 5) {
      const chunk = str.slice(i, i + 5);
      if (chunk.length === 1) {
        throw new Error("Invalid base85: trailing length cannot be 1.");
      }

      let value = 0;
      for (let j = 0; j < 5; j++) {
        const ch = chunk[j];
        const digit = ch === undefined ? 84 : charToValue[ch];
        if (digit === undefined) {
          throw new Error(`Invalid base85 character: ${JSON.stringify(ch)}`);
        }
        value = value * 85 + digit;
      }

      const b0 = Math.floor(value / 256 ** 3) & 0xff;
      const b1 = Math.floor(value / 256 ** 2) & 0xff;
      const b2 = Math.floor(value / 256) & 0xff;
      const b3 = value & 0xff;

      if (chunk.length === 5) {
        out.push(b0, b1, b2, b3);
      } else {
        const bytesToTake = chunk.length - 1;
        if (bytesToTake >= 1) out.push(b0);
        if (bytesToTake >= 2) out.push(b1);
        if (bytesToTake >= 3) out.push(b2);
      }
    }

    return Uint8Array.from(out);
  }

  const te = new TextEncoder();
  const td = new TextDecoder();

  /**
   * @param {string} s
   * @returns {string}
   */
  function encodeText(s) {
    return encode(te.encode(s));
  }

  /**
   * @param {string} b85
   * @returns {string}
   */
  function decodeText(b85) {
    return td.decode(decode(b85));
  }

  return { encode, decode, encodeText, decodeText };
}
