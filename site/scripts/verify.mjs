import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { root, readJson, readDays, validateDays, validateHistory, dayStats } from './content.mjs';
const days = validateDays(await readDays());
validateHistory(days, await readJson(path.join(root, 'data/cycle.json')));
for (const day of days) {
  const assets = [...Object.values(day.images).map(image => image.src), ...day.films.map(film => film.poster.src)];
  for (const asset of assets) {
    if (!asset.startsWith('/assets/')) throw Error(`Invalid project asset: ${asset}`);
    const file = path.join(root, 'public', asset);
    if (!(await stat(file)).isFile()) throw Error(`Missing image: ${file}`);
    const bytes = await readFile(file);
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
    const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
    const svg = file.endsWith('.svg') && bytes.toString().startsWith('<svg ') && !/<script|foreignObject|\bon\w+=|(?:href|src)=["']https?:/i.test(bytes.toString());
    if (!png && !jpeg && !webp && !svg) throw Error(`Unexpected image format: ${file}`);
  }
  console.log(`${day.id}: ${dayStats(day).total} Chinese characters; ${assets.length} actual images.`);
}
async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(file));
    else if (entry.name.endsWith('.html')) result.push(file);
  }
  return result;
}
for (const file of await walk(path.join(root, 'dist'))) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
    const url = match[1].split('#')[0];
    const target = path.join(root, 'dist', url, url.endsWith('/') ? 'index.html' : '');
    if (!(await stat(target)).isFile()) throw Error(`Broken local link: ${url} in ${file}`);
  }
  if (!html.includes('<html lang="zh-CN">') || !html.includes('lang="en"')) throw Error(`Missing language labels: ${file}`);
  if (/保存到本机 D|Saved on this computer’s D|local personal commentary/.test(html)) throw Error('Outdated local-only copy remains in public pages');
}
console.log('Bilingual content, actual image signatures and local page links verified.');
