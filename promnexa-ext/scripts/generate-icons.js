import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.resolve(__dirname, '../public/promnexa-icon.svg');
const iconDir = path.resolve(__dirname, '../public/icon');

const svg = fs.readFileSync(svgPath, 'utf8');

const sizes = [16, 32, 48, 96, 128];

for (const size of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const destPath = path.join(iconDir, `${size}.png`);
  fs.writeFileSync(destPath, pngBuffer);
  console.log(`Generated ${destPath} (${size}x${size})`);
}
console.log('All Promnexa branded icons generated successfully!');
