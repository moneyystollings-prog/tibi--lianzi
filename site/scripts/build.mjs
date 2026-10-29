import { mkdir, copyFile, readdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { root, readJson, readDays, validateDays, validateHistory, toReadingText, dayStats } from './content.mjs';
import { homePage, archivePage, dayPage, aboutPage, notFoundPage } from '../src/template.mjs';
import { normalizeBasePath } from '../src/urls.mjs';

const preview = process.argv.includes('--preview');
const all = validateDays(await readDays());
validateHistory(all, await readJson(path.join(root, 'data/cycle.json')));
const config = await readJson(path.join(root, 'site.config.json'));
const siteUrl = process.env.SITE_URL || config.siteUrl || '';
if (siteUrl && !/^https:\/\/[^/]+\/?$/.test(siteUrl)) throw Error('SITE_URL must be an HTTPS origin');
if (siteUrl && new URL(siteUrl).origin !== siteUrl.replace(/\/$/, '')) throw Error('SITE_URL must not include credentials, a path, query or fragment');
const basePath = normalizeBasePath(process.env.BASE_PATH || config.basePath || '');
process.env.TIBI_BASE_PATH = basePath;
process.env.TIBI_SITE_URL = siteUrl ? siteUrl.replace(/\/$/, '') + basePath : '';
const days = all.filter(day => preview || day.status === 'completed').sort((a, b) => a.date.localeCompare(b.date) || a.day - b.day);
if (!days.length) throw Error('No completed editions. Use --preview to inspect a draft.');
const destination = path.join(root, 'dist');
if (path.resolve(destination) !== path.resolve(root, 'dist') || path.dirname(path.resolve(destination)) !== path.resolve(root)) throw Error('Unsafe build directory');
// This exact generated directory is rebuilt from sources; no user writing is stored here.
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
async function copyDirectory(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name), target = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDirectory(source, target);
    else if (entry.isFile()) await copyFile(source, target);
  }
}
async function writePage(relative, html) {
  const file = path.join(destination, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html, 'utf8');
}
await copyDirectory(path.join(root, 'public'), destination);
await writePage('.nojekyll', '');
const deployment = await readJson(path.join(root, '..', 'edgeone.json'));
await writePage('edgeone.json', JSON.stringify({ headers: deployment.headers }, null, 2));
await writePage('index.html', homePage(days));
await writePage('archive/index.html', archivePage(days));
await writePage('about/index.html', aboutPage(days));
await writePage('404.html', notFoundPage(days.at(-1)));
for (const day of days) {
  await writePage(`days/${day.slug}/index.html`, dayPage(day, days));
  await writePage(`reading/${day.id}.txt`, toReadingText(day));
}
await writePage('catalog.json', JSON.stringify(days.map(day => ({ id: day.id, cycle: day.cycle, day: day.day, date: day.date, slug: day.slug, title: day.title, status: day.status, chineseCharacters: dayStats(day).total })), null, 2));
await writePage('robots.txt', 'User-agent: *\nAllow: /\n' + (siteUrl ? `Sitemap: ${process.env.TIBI_SITE_URL}/sitemap.xml\n` : ''));
if (siteUrl) {
  const locations = ['/', '/archive/', '/about/', ...days.map(day => `/days/${day.slug}/`)];
  await writePage('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + locations.map(location => `<url><loc>${process.env.TIBI_SITE_URL + location}</loc></url>`).join('') + '</urlset>');
}
console.log(`Built ${days.length} ${preview ? 'preview' : 'completed'} edition(s) at ${destination}`);
