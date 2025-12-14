import "./normalize.css";
import "./style.css";

import { makeBase85Codec } from "./b85.js";

let brotliModule = null;
async function getBrotli() {
  if (!brotliModule) {
    brotliModule =
      await import("https://unpkg.com/brotli-wasm@3.0.1/index.web.js?module").then(
        (m) => m.default,
      );
  }
  return brotliModule;
}

let b85Codec = null;
/**
 * @return {ReturnType<makeBase85Codec>}
 */
function getB85Codec() {
  if (!b85Codec) b85Codec = makeBase85Codec();
  return b85Codec;
}

async function compressDeflate(data) {
  const stream = new Blob([data])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompressDeflate(data) {
  const stream = new Blob([data])
    .stream()
    .pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function setLink(value) {
  document.getElementById("copy-link").value = value;
  document.getElementById("link-length").textContent = value.length;
}

function setText(value) {
  document.getElementById("text").value = value;
  document.getElementById("text-length").textContent = value.length;
}

/** @type {"b64" | "b85"} */
let encodeMode = "b64";
function getEncodeMode() {
  return encodeMode;
}

/**
 * @param {"b64" | "b85"} mode
 */
function setEncodeMode(mode) {
  encodeMode = mode === "b85" ? "b85" : "b64";
  const el = document.getElementById("encode-mode");
  if (el instanceof HTMLButtonElement) {
    el.textContent = encodeMode === "b64" ? "Base64" : "Base85";
  }
}

/**
 * @param {string} href
 * @returns {{ prefix: string, encoded: string } | null}
 */
function parsePrefixAndEncodedFromHref(href) {
  try {
    const url = new URL(href);
    const afterOrigin = url.href.slice(url.origin.length + 1);
    const firstSlash = afterOrigin.indexOf("/");
    if (firstSlash === -1) return null;
    const prefix = afterOrigin.slice(0, firstSlash);
    const encoded = afterOrigin.slice(firstSlash + 1);
    if (!prefix || !encoded) return null;
    return {
      prefix: decodeURIComponent(prefix),
      encoded: decodeURIComponent(encoded),
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * @param {string} prefix
 * @returns {"b64" | "b85" | null}
 */
function modeFromPrefix(prefix) {
  if (prefix === "b64" || prefix === "lz64" || prefix === "br64") return "b64";
  if (prefix === "b85" || prefix === "lz85" || prefix === "br85") {
    return "b85";
  }
  return null;
}

/**
 * @param {string} prefix
 * @param {"b64" | "b85"} mode
 * @returns {string | null}
 */
function prefixForMode(prefix, mode) {
  if (prefix === "b64" || prefix === "b85") return mode;
  if (prefix === "lz85" || prefix === "lz64") {
    return mode === "b64" ? "lz64" : "lz85";
  }
  if (prefix === "br85" || prefix === "br64") {
    return mode === "b64" ? "br64" : "br85";
  }
  return null;
}

document.getElementById("encode-mode").addEventListener("click", () => {
  const nextMode = encodeMode === "b64" ? "b85" : "b64";
  setEncodeMode(nextMode);

  const existingLink = document.getElementById("copy-link").value;
  if (!existingLink) return;

  const parsed = parsePrefixAndEncodedFromHref(existingLink);
  if (!parsed) return;

  const currentLinkMode = modeFromPrefix(parsed.prefix);
  const nextPrefix = prefixForMode(parsed.prefix, nextMode);
  if (!currentLinkMode || !nextPrefix) return;

  try {
    const bytes = decodeBytes(parsed.encoded, currentLinkMode);
    const encoded = encodeBytes(bytes, nextMode);
    setLinkFromPrefix(nextPrefix, encoded);
  } catch (error) {
    console.error(error);
  }
});

/**
 * @param {Uint8Array} bytes
 * @param {"b64" | "b85"} mode
 */
function encodeBytes(bytes, mode) {
  if (mode === "b64") return bytes.toBase64({ alphabet: "base64url" });
  return getB85Codec().encode(bytes);
}

/**
 * @param {string} encoded
 * @param {"b64" | "b85"} mode
 */
function decodeBytes(encoded, mode) {
  if (mode === "b64") {
    return Uint8Array.fromBase64(encoded, { alphabet: "base64url" });
  }
  return getB85Codec().decode(encoded);
}

/**
 * @param {string} prefix
 * @param {string} encoded
 */
function setLinkFromPrefix(prefix, encoded) {
  const origin = new URL(window.location.origin);
  setLink(origin + prefix + "/" + encoded);
}

// Encode text handler
document.getElementById("encode-text").addEventListener("click", () => {
  const mode = getEncodeMode();
  const text = document.getElementById("text").value;
  const bytes = new TextEncoder().encode(text);
  const encoded = encodeBytes(bytes, mode);
  setLinkFromPrefix(mode, encoded);
});

// Compress handler
document.getElementById("encode-zlib").addEventListener("click", async () => {
  const mode = getEncodeMode();
  const input = document.getElementById("text").value;
  const uncompressedData = new TextEncoder().encode(input);
  const compressedData = await compressDeflate(uncompressedData);

  const compressedPath = encodeBytes(compressedData, mode);
  setLinkFromPrefix(mode === "b64" ? "lz64" : "lz85", compressedPath);
});

// Compress Brotli handler
document.getElementById("encode-brotli").addEventListener("click", async () => {
  const mode = getEncodeMode();
  const brotli = await getBrotli();
  const input = document.getElementById("text").value;
  const uncompressedData = new TextEncoder().encode(input);
  const compressedData = brotli.compress(uncompressedData);
  const compressedBytes =
    compressedData instanceof Uint8Array
      ? compressedData
      : new Uint8Array(compressedData);

  const compressedPath = encodeBytes(compressedBytes, mode);
  setLinkFromPrefix(mode === "b64" ? "br64" : "br85", compressedPath);
});

// Text area handler
// On any input change reset copy-link
document.getElementById("text").addEventListener("input", () => {
  setLink("");
  document.getElementById("text-length").textContent =
    document.getElementById("text").value.length;
});

// Copy to clipboard button handler
document.getElementById("copy-clipboard").addEventListener("click", () => {
  const copyText = document.getElementById("copy-link").value;
  if (!copyText) return;

  if (navigator.clipboard) {
    const type = "text/plain";
    const clipboardItemData = {
      [type]: copyText,
    };
    const clipboardItem = new ClipboardItem(clipboardItemData);
    navigator.clipboard.write([clipboardItem]);
  }
});

// When first loaded, parse URL
window.addEventListener("load", async () => {
  const url = new URL(window.location.href);
  const parsed = parsePrefixAndEncodedFromHref(url);
  if (!parsed) return;
  const prefix = parsed.prefix;
  const encoded = parsed.encoded;

  const incomingMode = modeFromPrefix(prefix);
  if (incomingMode) setEncodeMode(incomingMode);

  if (prefix === "b64") {
    const intarray = decodeBytes(encoded, "b64");
    const decoded = new TextDecoder().decode(intarray);
    setText(decoded);
  } else if (prefix === "b85") {
    const intarray = decodeBytes(encoded, "b85");
    const decoded = new TextDecoder().decode(intarray);
    setText(decoded);
  } else if (prefix === "lz85") {
    const compressedData = decodeBytes(encoded, "b85");
    const decompressedData = await decompressDeflate(compressedData);
    const decoded = new TextDecoder().decode(decompressedData);
    setText(decoded);
  } else if (prefix === "lz64") {
    const compressedData = decodeBytes(encoded, "b64");
    const decompressedData = await decompressDeflate(compressedData);
    const decoded = new TextDecoder().decode(decompressedData);
    setText(decoded);
  } else if (prefix === "br85" || prefix === "br64") {
    const { default: decompressBrotli } =
      await import("https://esm.sh/brotli/decompress.js");
    const compressedData = decodeBytes(
      encoded,
      prefix === "br64" ? "b64" : "b85",
    );
    const decompressed = decompressBrotli(compressedData);
    setText(new TextDecoder().decode(decompressed));
  }
});

// Color switcher
const colorScheme = document.querySelector("meta[name=color-scheme]");
localStorage.getItem("theme") === "dark"
  ? (colorScheme.content = "dark")
  : (colorScheme.content = "light");
document.getElementById("theme").addEventListener("click", () => {
  if (colorScheme.content === "light") {
    colorScheme.content = "dark";
  } else {
    colorScheme.content = "light";
  }
  localStorage.setItem("theme", colorScheme.content);
});

// Log source code repo
console.log(
  "👋 Send feedback / checkout https://github.com/weiliddat/btoa-link/",
);
