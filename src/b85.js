// @ts-check

const BASE85_ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=~!/*?&_,()[]{}@;$#";

if (BASE85_ALPHABET.length !== 85) {
  throw new Error("Alphabet must be exactly 85 chars.");
}

export function makeBase85Codec() {
  /**
   * @param {Uint8Array} bytes
   * @returns {string}
   */
  function encode(bytes) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError("encode() expects Uint8Array.");
    }

    // ...
  }

  /**
   * @param {string} str
   * @returns {Uint8Array}
   */
  function decode(str) {
    if (typeof str !== "string") {
      throw new TypeError("decode() expects a string.");
    }

    // ...
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
