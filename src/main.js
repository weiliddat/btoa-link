import "./normalize.css";
import "./style.css";

import brotliPromise from "brotli-wasm?init"; // Import the default export

function setLink(value) {
  document.getElementById("copy-link").value = value;
  document.getElementById("link-length").textContent = value.length;
}

// Encode button handler
document.getElementById("encode").addEventListener("click", () => {
  const code = document.getElementById("code").value;
  const intarray = new TextEncoder().encode(code);
  const encoded = intarray.toBase64({ alphabet: "base64url" });

  const origin = new URL(window.location.origin);
  setLink(origin + "b64/" + encoded);
});

// Compress handler
document.getElementById("compress").addEventListener("click", async () => {
  const brotli = await brotliPromise; // Import is async in browsers due to wasm requirements!
  const textEncoder = new TextEncoder();

  const input = document.getElementById("code").value;
  const uncompressedData = textEncoder.encode(input);
  const compressedData = brotli.compress(uncompressedData);

  const compressedPath = compressedData.toBase64({ alphabet: "base64url" });
  const origin = new URL(window.location.origin);
  setLink(origin + "br/" + compressedPath);
});

// Code area handler
// On any input change reset copy-link
document.getElementById("code").addEventListener("input", () => {
  setLink("");
  document.getElementById("code-length").textContent =
    document.getElementById("code").value.length;
});

// Copy to clipboard button handler
document.getElementById("copy-clipboard").addEventListener("click", () => {
  const copyText = document.getElementById("copy-link").value;

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

  const encoded = url.pathname.split("/")[2];
  if (!encoded) return;

  if (url.pathname.startsWith("/b64/")) {
    const intarray = Uint8Array.fromBase64(encoded, {
      alphabet: "base64url",
    });
    const decoded = new TextDecoder().decode(intarray);
    document.getElementById("code").value = decoded;
  } else if (url.pathname.startsWith("/br/")) {
    const brotli = await brotliPromise; // Import is async in browsers due to wasm requirements!
    const intarray = Uint8Array.fromBase64(encoded, {
      alphabet: "base64url",
    });
    const decompressedData = brotli.decompress(intarray);
    const decoded = new TextDecoder().decode(decompressedData);
    document.getElementById("code").value = decoded;
  }
});
