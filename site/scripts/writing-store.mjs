import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const fieldLimits = { fill1: 80, fill2: 80, fill3: 80, cloze1: 1, cloze2: 1, cloze3: 1, cloze4: 1, cloze5: 1, cloze6: 1, essay: 6000, free: 6000 };
export const emptyValues = () => Object.fromEntries(Object.keys(fieldLimits).map(key => [key, '']));
export class StoreError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function validateValues(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new StoreError(400, 'Invalid writing fields.');
  if (Object.keys(values).some(key => !Object.hasOwn(fieldLimits, key))) throw new StoreError(400, 'Unknown writing field.');
  const checked = {};
  for (const [key, limit] of Object.entries(fieldLimits)) {
    const value = values[key] ?? '';
    if (typeof value !== 'string' || value.length > limit) throw new StoreError(400, `Invalid or oversized ${key}.`);
    checked[key] = value.replace(/\r\n/g, '\n');
  }
  return checked;
}

export function createWritingStore(directory, editions) {
  const known = new Map(editions.map(day => [day.id, day]));
  const queues = new Map();
  function edition(id) {
    if (!/^[a-z0-9-]+$/.test(id) || !known.has(id)) throw new StoreError(404, 'Unknown edition.');
    return known.get(id);
  }
  function file(id) { edition(id); return path.join(directory, 'writing', `${id}.json`); }
  async function read(id) {
    try { return JSON.parse(await readFile(file(id), 'utf8')); }
    catch (error) {
      if (error.code === 'ENOENT') return { id, revision: 0, values: emptyValues(), savedAt: null };
      throw error;
    }
  }
  function serialize(id, operation) {
    const previous = queues.get(id) || Promise.resolve();
    const next = previous.catch(() => {}).then(operation);
    queues.set(id, next);
    next.finally(() => { if (queues.get(id) === next) queues.delete(id); }).catch(() => {});
    return next;
  }
  async function save(id, input) {
    edition(id);
    if (!Number.isSafeInteger(input?.revision) || input.revision < 0) throw new StoreError(400, 'Invalid revision.');
    const values = validateValues(input.values);
    return serialize(id, async () => {
      const current = await read(id);
      if (current.revision !== input.revision) throw new StoreError(409, 'Writing changed in another page.');
      const result = { id, cycle: edition(id).cycle, revision: current.revision + 1, savedAt: new Date().toISOString(), values };
      const target = file(id);
      await mkdir(path.dirname(target), { recursive: true });
      const temporary = `${target}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, JSON.stringify(result, null, 2), { encoding: 'utf8', flag: 'wx' });
        await rename(temporary, target);
      } catch (error) { await unlink(temporary).catch(() => {}); throw error; }
      return result;
    });
  }
  async function exportText(id, revision) {
    const day = edition(id);
    return serialize(id, async () => {
      const current = await read(id);
      if (!Number.isSafeInteger(revision) || current.revision !== revision) throw new StoreError(409, 'Writing changed before export.');
      const legacyLines = day.writing.fills.map((fill, index) => fill.before + (current.values[`fill${index + 1}`] || '______') + fill.after);
      const fillLines = day.writing.couplets ? day.writing.couplets.map(couplet => couplet.lines.map(line => line.before + (current.values[line.field] || '□') + line.after).join('')) : legacyLines;
      const legacy = day.writing.couplets && ['fill1', 'fill2', 'fill3'].some(key => current.values[key]) ? ['以前的填词记录 / Earlier writing', ...legacyLines, ''] : [];
      const text = [`字间｜第${day.day}天｜${day.title.zh}`, day.title.en, day.date, '', '炼字填空 / One word, a different mood',
        ...fillLines, '', ...legacy,
        '由今天，写自己的几句话 / Inspired by today', day.writing.question.zh, day.writing.question.en, current.values.essay, '',
        '自由手记 / Free writing', current.values.free, ''].join('\n');
      const exports = path.join(directory, 'exports');
      await mkdir(exports, { recursive: true });
      const output = path.join(exports, `${id}-${Date.now()}-${randomUUID().slice(0, 8)}.txt`);
      await writeFile(output, '\uFEFF' + text, { encoding: 'utf8', flag: 'wx' });
      return { path: output, revision: current.revision };
    });
  }
  return { read, save, exportText };
}
