// Decode the existing Basis KTX2 textures without changing the source assets.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'ar-exports.local/decoded');
const sandbox = { module: { exports: {} }, exports: {}, require, __dirname: path.join(root, 'public/basis'), console, process, Buffer, TextDecoder, TextEncoder, WebAssembly, setTimeout, clearTimeout };
vm.runInNewContext(fs.readFileSync(path.join(root, 'public/basis/basis_transcoder.js'), 'utf8'), sandbox);

(async () => {
  const basis = await sandbox.module.exports({ wasmBinary: fs.readFileSync(path.join(root, 'public/basis/basis_transcoder.wasm')) });
  basis.initializeBasis();
  for (const material of ['lumbar_bone', 'lumbar_disk']) {
    for (const state of ['from', 'to']) {
      for (const semantic of ['basecolor', 'normal', 'orm']) {
        const source = path.join(root, 'public/projects/arthritis/textures', material, state, `${semantic}.ktx2`);
        const file = new basis.KTX2File(new Uint8Array(fs.readFileSync(source)));
        try {
          if (!file.isValid() || !file.startTranscoding()) throw new Error(`Invalid KTX2: ${source}`);
          const width = file.getWidth();
          const height = file.getHeight();
          const pixels = new Uint8Array(file.getImageTranscodedSizeInBytes(0, 0, 0, 13)); // RGBA32
          if (!file.transcodeImage(pixels, 0, 0, 0, 13, 0, -1, -1)) throw new Error(`Transcode failed: ${source}`);
          const destination = path.join(out, material, state);
          fs.mkdirSync(destination, { recursive: true });
          fs.writeFileSync(path.join(destination, `${semantic}.rgba`), pixels);
          fs.writeFileSync(path.join(destination, `${semantic}.json`), JSON.stringify({ width, height }));
          console.log(material, state, semantic, width, height);
        } finally {
          file.close();
          file.delete();
        }
      }
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
