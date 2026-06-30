import fs from 'fs';
import path from 'path';

const mdPath = process.argv[2] || 'docs/Finanzas-Grupo-4.md';
const outDir = process.argv[3] || 'docs/assets';

const md = fs.readFileSync(mdPath, 'utf8');
fs.mkdirSync(outDir, { recursive: true });

const regex = /!\[([^\]]*)\]\(data:image\/([^;]+);base64,([^)]+)\)/g;
let match;
let count = 0;

while ((match = regex.exec(md)) !== null) {
  count += 1;
  const [, alt, ext, b64] = match;
  const name = (alt || `image-${count}`).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60) || `image-${count}`;
  const filename = `${name}.${ext === 'jpeg' ? 'jpg' : ext}`;
  fs.writeFileSync(path.join(outDir, filename), Buffer.from(b64, 'base64'));
  console.log(`Extracted: ${filename}`);
}

console.log(count ? `Done: ${count} image(s)` : 'No base64 images found in MD');
