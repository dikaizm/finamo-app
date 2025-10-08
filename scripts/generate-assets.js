#!/usr/bin/env node
/**
 * Generate minimal but valid PNG files for required Expo assets.
 * We embed small base64 PNGs (transparent or simple color) and write them as binary.
 */
const fs = require('fs');
const path = require('path');

// Generate proper PNG assets using pngjs to avoid Jimp parsing issues during prebuild.
// Sizes chosen: icon/adaptive-icon 1024x1024, splash 1242x2436 (portrait), favicon 32x32.
const { PNG } = require('pngjs');

function createPng(width, height, fill) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = fill[0];
      png.data[idx + 1] = fill[1];
      png.data[idx + 2] = fill[2];
      png.data[idx + 3] = fill[3];
    }
  }
  return PNG.sync.write(png);
}

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

const files = [
  { name: 'icon.png', buf: createPng(1024, 1024, [91, 95, 255, 255]) }, // brand color
  { name: 'adaptive-icon.png', buf: createPng(1024, 1024, [255, 255, 255, 255]) },
  { name: 'splash.png', buf: createPng(1242, 2436, [91, 95, 255, 255]) },
  { name: 'favicon.png', buf: createPng(32, 32, [91, 95, 255, 255]) }
];

for (const f of files) {
  const filePath = path.join(assetsDir, f.name);
  fs.writeFileSync(filePath, f.buf);
  console.log('Wrote', f.name, `${f.buf.length} bytes`);
}

console.log('Placeholder assets generated. Replace with real images before release.');
