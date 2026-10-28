import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { once } from 'node:events';
import { root } from '../scripts/content.mjs';
import { createSiteServer } from '../scripts/server.mjs';
import { emptyValues } from '../scripts/writing-store.mjs';

test('local HTTP persistence, conflict protection, export and request boundaries', async t => {
  const runtime = path.join(root, '.runtime');
  await mkdir(runtime, { recursive: true });
  const temporary = await mkdtemp(path.join(runtime, 'test-'));
  assert.ok(path.resolve(temporary).startsWith(path.resolve(runtime) + path.sep));
  const dist = path.join(temporary, 'dist');
  await mkdir(dist);
  await writeFile(path.join(dist, 'index.html'), '<h1>字间</h1>');
  await writeFile(path.join(dist, '404.html'), '<h1>Not found</h1>');
  const edition = { id: 'test-edition', cycle: 'test-cycle', day: 1, date: '2026-10-27', title: { zh: '测试', en: 'Test' }, writing: { fills: [{ before: '光落在', after: '。' }], question: { zh: '你看见什么？', en: 'What did you see?' } } };
  const server = createSiteServer({ staticDirectory: dist, dataDirectory: path.join(temporary, 'data'), editions: [edition], localWriting: true });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const post = (route, value, headers = {}) => fetch(origin + route, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...headers }, body: JSON.stringify(value) });
  try {
    await t.test('serves pages and returns real 404 responses', async () => {
      const response = await fetch(origin);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
      assert.equal((await fetch(origin + '/missing')).status, 404);
    });
    await t.test('rejects unknown days and cross-origin writes', async () => {
      assert.equal((await fetch(origin + '/api/writing/unknown')).status, 404);
      assert.equal((await post('/api/writing/test-edition', {}, { Origin: 'https://evil.example' })).status, 403);
      assert.equal((await fetch(origin + '/..%5cdata%5csecret.json')).status, 403);
    });
    await t.test('new day is empty, and saves survive a subsequent request', async () => {
      const initial = await (await fetch(origin + '/api/writing/test-edition')).json();
      assert.equal(initial.revision, 0);
      const response = await post('/api/writing/test-edition', { revision: 0, values: { ...emptyValues(), fill1: '窗边', essay: '今天的光很好。\nI noticed the light.', free: '<script>not executable</script>' } });
      assert.equal(response.status, 200);
      const restored = await (await fetch(origin + '/api/writing/test-edition')).json();
      assert.equal(restored.revision, 1);
      assert.equal(restored.values.fill1, '窗边');
      const persisted = JSON.parse(await readFile(path.join(temporary, 'data', 'writing', 'test-edition.json'), 'utf8'));
      assert.equal(persisted.values.essay, restored.values.essay);
    });
    await t.test('stale tab cannot overwrite a newer save', async () => {
      assert.equal((await post('/api/writing/test-edition', { revision: 0, values: emptyValues() })).status, 409);
      const current = await (await fetch(origin + '/api/writing/test-edition')).json();
      assert.equal(current.values.fill1, '窗边');
    });
    await t.test('validates field length and rejects unexpected fields', async () => {
      assert.equal((await post('/api/writing/test-edition', { revision: 1, values: { ...emptyValues(), essay: '字'.repeat(6001) } })).status, 400);
      assert.equal((await post('/api/writing/test-edition', { revision: 1, values: { ...emptyValues(), pathname: '../' } })).status, 400);
    });
    await t.test('simultaneous saves with the same revision allow only one winner', async () => {
      const results = await Promise.all([1, 2].map(n => post('/api/writing/test-edition', { revision: 1, values: { ...emptyValues(), fill1: `窗边${n}` } })));
      assert.deepEqual(results.map(response => response.status).sort(), [200, 409]);
    });
    await t.test('exports a real UTF-8 file inside the D-drive project', async () => {
      const current = await (await fetch(origin + '/api/writing/test-edition')).json();
      const response = await post('/api/export/test-edition', { revision: current.revision });
      assert.equal(response.status, 200);
      const exported = await response.json();
      assert.ok(exported.path.startsWith(path.join(temporary, 'data', 'exports') + path.sep));
      assert.match(await readFile(exported.path, 'utf8'), /光落在窗边[12]。/);
      assert.equal((await post('/api/export/test-edition', { revision: 0 })).status, 409);
    });
    await t.test('paired blanks preserve earlier writing and export complete lines', async () => {
      edition.writing.couplets = [
        { lines: [{ before: '晨光', after: '书页，', field: 'cloze1' }, { before: '晚照', after: '归人。', field: 'cloze2' }] },
        { lines: [{ before: '清泉', after: '石径，', field: 'cloze3' }, { before: '明月', after: '柴门。', field: 'cloze4' }] },
        { lines: [{ before: '薄雪', after: '远岫，', field: 'cloze5' }, { before: '微灯', after: '小窗。', field: 'cloze6' }] }
      ];
      const earlier = await (await fetch(origin + '/api/writing/test-edition')).json();
      const values = { ...earlier.values, cloze1: '吻', cloze2: '迎', cloze3: '绕', cloze4: '叩', cloze5: '覆', cloze6: '暖' };
      assert.equal((await post('/api/writing/test-edition', { revision: earlier.revision, values: { ...values, cloze1: '照亮' } })).status, 400);
      assert.equal((await post('/api/writing/test-edition', { revision: earlier.revision, values })).status, 200);
      const restored = await (await fetch(origin + '/api/writing/test-edition')).json();
      assert.deepEqual(restored.values, values);
      const exported = await (await post('/api/export/test-edition', { revision: restored.revision })).json();
      const text = await readFile(exported.path, 'utf8');
      assert.match(text, /晨光吻书页，晚照迎归人。/);
      assert.match(text, /清泉绕石径，明月叩柴门。/);
      assert.match(text, /薄雪覆远岫，微灯暖小窗。/);
      assert.match(text, /以前的填词记录/);
      assert.match(text, /光落在窗边[12]。/);
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
    // This is the unique directory created by this test under the verified workspace runtime root.
    await rm(temporary, { recursive: true, force: true });
  }
});
