# btoa.link

[btoa.link](https://btoa.link) is a simple way to share text snippets without having to save/share it to a server. Everything is encoded in the URL you share.

Currently supports encoding the text to:

- base64
- zlib (CompressionStream)
- brotli (currently via wasm/js; eventually CompressionStream)

## Ideas

- [ ] Other compression algorithms?
- [ ] Code highlighting / markdown rendering?
- [ ] Other file types e.g. images / audio?

## Requirements

- Node.js 20 or later

## Installation

1. Clone this repository
2. Run `npm install`
3. Run `npm run dev`

## Notes

Far from the first of its kind; haven't seen many that use good compression.

From brief testing of short notes in English / code (<16kb), Brotli seems to do the best out of the box due to included dictionary. Tested zstd, brotli, zlib, bbb, bsc-m03, and some other bwt-based JS implementation I forgot :(
