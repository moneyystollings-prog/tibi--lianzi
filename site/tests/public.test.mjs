import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { normalizeWriting, writingText } from '../public/writing-format.mjs';
import { readDays, validateHistory, body, workNames } from '../scripts/content.mjs';
import { dayPage } from '../src/template.mjs';
import { createSiteServer } from '../scripts/server.mjs';

test('device export contains paired lines and the current unsaved essay', async () => {
  const [day] = await readDays();
  const context = { id: day.id, day: day.day, date: day.date, title: day.title, ...day.writing };
  const text = writingText(context, { cloze1:'吻', cloze2:'迎', essay:'刚写下的文字。' });
  assert.match(text, /晨光吻书页，晚照迎归人。/);
  assert.match(text, /刚写下的文字。/);
  assert.doesNotMatch(text, /D:\\|C:\\/);
  assert.throws(() => normalizeWriting({cloze1:'照亮'}), /长度限制/);
  assert.throws(() => normalizeWriting({essay:'字'.repeat(6001)}), /长度限制/);
});

test('permanent archive prevents reuse even after an old daily file is removed', async () => {
  const [day] = await readDays();
  const history = { id: day.cycle, completed:[{ id:'archived-day', theme:day.title, works:workNames(day), topic:day.topic.work, textZh:body(day) }] };
  assert.throws(() => validateHistory([day],history), /permanent history/);
  history.completed[0].id = day.id;
  assert.doesNotThrow(() => validateHistory([day],history));
});

test('older edition keeps its own canonical URL after new editions are added', async () => {
  const [day] = await readDays();
  const next = {...day,id:'next',day:2,slug:'next-day'};
  const previous = process.env.TIBI_SITE_URL;
  process.env.TIBI_SITE_URL = 'https://example.com';
  try {
    const html = dayPage(day,[day,next]);
    assert.ok(html.includes(`rel="canonical" href="https://example.com/days/${day.slug}/"`));
    assert.match(html, /src="\/app.js" type="module"/);
    assert.match(html, /id="writing-context" type="application\/json"/);
  } finally {
    if (previous === undefined) delete process.env.TIBI_SITE_URL; else process.env.TIBI_SITE_URL = previous;
  }
});

test('normal preview serves modules and does not expose shared server writing', async () => {
  const server = createSiteServer({editions:[]});
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(origin+'/api/writing/2026-10-27-001')).status,404);
    const module = await fetch(origin+'/writing-device.mjs');
    assert.equal(module.status,200);
    assert.match(module.headers.get('content-type'),/text\/javascript/);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
