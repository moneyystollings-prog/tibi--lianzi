import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBasePath, prefixLocalUrls } from '../src/urls.mjs';
import { homePage, archivePage, dayPage, aboutPage, notFoundPage } from '../src/template.mjs';
import { readDays } from '../scripts/content.mjs';

test('base paths reject traversal, URLs and attribute injection', () => {
  assert.equal(normalizeBasePath('/'), '');
  assert.equal(normalizeBasePath('/tibi--lianzi/'), '/tibi--lianzi');
  for (const invalid of ['../escape', '/a/../b', '//example.com', '/a?b', '/a"b', '/a%2fb']) {
    assert.throws(() => normalizeBasePath(invalid), /BASE_PATH/);
  }
});

test('prefixes local URLs and responsive images while preserving external links and anchors', () => {
  const html = '<a href="/">Home</a><a href="/archive/#first">Archive</a><img src="/a.webp" srcset="/small.webp 768w, /large.webp 1600w"><a href="#writing">Write</a><a href="https://example.com/">Source</a><img src="//example.com/a.png">';
  const output = prefixLocalUrls(html, '/tibi--lianzi');
  assert.ok(output.includes('href="/tibi--lianzi/"'));
  assert.ok(output.includes('href="/tibi--lianzi/archive/#first"'));
  assert.ok(output.includes('srcset="/tibi--lianzi/small.webp 768w, /tibi--lianzi/large.webp 1600w"'));
  assert.ok(output.includes('href="#writing"'));
  assert.ok(output.includes('href="https://example.com/"'));
  assert.ok(output.includes('src="//example.com/a.png"'));
  assert.equal(prefixLocalUrls(html), html);
});

test('all page types use the project prefix, including canonical and sharing images', async () => {
  const days = await readDays();
  const previousBase = process.env.TIBI_BASE_PATH;
  const previousUrl = process.env.TIBI_SITE_URL;
  process.env.TIBI_BASE_PATH = '/tibi--lianzi';
  process.env.TIBI_SITE_URL = 'https://example.github.io/tibi--lianzi';
  try {
    const pages = [homePage(days), archivePage(days), dayPage(days[0],days), aboutPage(days), notFoundPage(days.at(-1))];
    for (const html of pages) {
      for (const match of html.matchAll(/(?:href|src)="(\/(?!\/)[^"]*)"/g)) {
        assert.ok(match[1].startsWith('/tibi--lianzi/'), match[1]);
      }
      assert.ok(html.includes('src="/tibi--lianzi/app.js"'));
    }
    assert.ok(pages[0].includes('rel="canonical" href="https://example.github.io/tibi--lianzi/"'));
    assert.ok(pages[0].includes('property="og:image" content="https://example.github.io/tibi--lianzi/assets/'));
    assert.ok(pages[2].includes(`href="/tibi--lianzi/reading/${days[0].id}.txt"`));
  } finally {
    if (previousBase === undefined) delete process.env.TIBI_BASE_PATH; else process.env.TIBI_BASE_PATH = previousBase;
    if (previousUrl === undefined) delete process.env.TIBI_SITE_URL; else process.env.TIBI_SITE_URL = previousUrl;
  }
});
