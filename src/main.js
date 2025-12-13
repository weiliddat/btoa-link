import "./normalize.css";
import "./style.css";

let brotliModule = null;
async function getBrotli() {
  if (brotliModule) return brotliModule;
  const brotli =
    await import("https://unpkg.com/brotli-wasm@3.0.1/index.web.js?module").then(
      (m) => m.default,
    );
  brotliModule = brotli;
  return brotliModule;
}

async function compress(data) {
  const stream = new Blob([data])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompress(data) {
  const stream = new Blob([data])
    .stream()
    .pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function setLink(value) {
  document.getElementById("copy-link").value = value;
  document.getElementById("link-length").textContent = value.length;
}

function setCode(value) {
  document.getElementById("code").value = value;
  document.getElementById("code-length").textContent = value.length;
}

// Encode button handler
document.getElementById("encode-b64").addEventListener("click", () => {
  const code = document.getElementById("code").value;
  const intarray = new TextEncoder().encode(code);
  const encoded = intarray.toBase64({ alphabet: "base64url" });

  const origin = new URL(window.location.origin);
  setLink(origin + "b64/" + encoded);
});

// Compress handler
document.getElementById("encode-zlib").addEventListener("click", async () => {
  const input = document.getElementById("code").value;
  const uncompressedData = new TextEncoder().encode(input);
  const compressedData = await compress(uncompressedData);

  const compressedPath = compressedData.toBase64({ alphabet: "base64url" });
  const origin = new URL(window.location.origin);
  setLink(origin + "lz/" + compressedPath);
});

// Compress Brotli handler
document.getElementById("encode-brotli").addEventListener("click", async () => {
  const brotli = await getBrotli();
  const input = document.getElementById("code").value;
  const uncompressedData = new TextEncoder().encode(input);
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

  const encoded = url.pathname.split("/")[2];
  if (!encoded) return;

  if (url.pathname.startsWith("/b64/")) {
    const intarray = Uint8Array.fromBase64(encoded, {
      alphabet: "base64url",
    });
    const decoded = new TextDecoder().decode(intarray);
    setCode(decoded);
  } else if (url.pathname.startsWith("/lz/")) {
    const intarray = Uint8Array.fromBase64(encoded, {
      alphabet: "base64url",
    });
    const decompressedData = await decompress(intarray);
    const decoded = new TextDecoder().decode(decompressedData);
    setCode(decoded);
  } else if (url.pathname.startsWith("/br/")) {
    const brotli = await getBrotli();
    const intarray = Uint8Array.fromBase64(encoded, {
      alphabet: "base64url",
    });
    const decompressedData = brotli.decompress(intarray);
    const decoded = new TextDecoder().decode(decompressedData);
    setCode(decoded);
  }
});

// Color switcher
const colorScheme = document.querySelector('meta[name=color-scheme]');
localStorage.getItem("theme") === "dark" ? colorScheme.content = "dark" : colorScheme.content = "light";
document.getElementById("theme").addEventListener("click", () => {
  if (colorScheme.content === "light") {
    colorScheme.content = "dark";
  } else {
    colorScheme.content = "light";
  }
  localStorage.setItem("theme", colorScheme.content);
});
