import test from 'node:test';
import assert from 'node:assert/strict';
import { readDays, validateDays, countHan, dayStats, normalize } from '../scripts/content.mjs';
import { escape } from '../src/template.mjs';

test('counts only Chinese characters, not English or punctuation', () => {
  assert.equal(countHan('明月松间照，Hello 2026!'), 5);
  assert.equal(normalize('明月，松间照！'), normalize('明月松间照'));
});
test('all actual editions meet bilingual and character-count requirements', async () => {
  const days = await readDays();
  assert.ok(days.length > 0);
  assert.doesNotThrow(() => validateDays(days));
  for (const day of days) assert.ok(dayStats(day).total >= 150 && dayStats(day).total <= 220);
});
test('new-cycle content cannot reuse an existing work', async () => {
  const [first] = await readDays();
  const second = structuredClone(first);
  Object.assign(second, { id: 'test-second', slug: 'test-second', day: 2, title: { ...second.title, zh: '另一主题' } });
  assert.throws(() => validateDays([first, second]), /Repeated work/);
});
test('old cycles do not constrain the reset cycle', async () => {
  const [first] = await readDays();
  const second = structuredClone(first);
  Object.assign(second, { id: 'test-new-cycle', slug: 'test-new-cycle', cycle: 'different-cycle' });
  assert.doesNotThrow(() => validateDays([first, second]));
});
test('a missing English translation cannot pass validation', async () => {
  const [first] = await readDays();
  first.poem.lines[0].en = '';
  assert.throws(() => validateDays([first]), /missing bilingual pair/);
});
test('a changed title cannot disguise a repeated sentence', async () => {
  const [first] = await readDays();
  const second = structuredClone(first);
  Object.assign(second, { id: 'test-near', slug: 'test-near', day: 2, title: { ...second.title, zh: '另一个主题' } });
  for (const section of [...second.films, second.poem, second.prose, second.modern, second.topic]) section.work += '另一作品';
  second.films[0].lines[0].zh += '！';
  assert.throws(() => validateDays([first, second]), /near-duplicate sentence/);
});
test('HTML escapes user-facing strings instead of interpreting markup', () => {
  assert.equal(escape('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
