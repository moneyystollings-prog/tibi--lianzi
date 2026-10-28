import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const countHan = text => (text.match(/\p{Script=Han}/gu) || []).length;
export const normalize = text => text.normalize('NFKC').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
export const sections = day => [...day.films, day.poem, day.prose, day.modern, day.topic, day.original];
export const body = day => sections(day).flatMap(section => section.lines.map(line => line.zh));
export const workNames = day => [...day.films, day.poem, day.prose, day.modern].map(section => section.work);
export const dayUrl = day => `/days/${day.slug}/`;
export const readJson = async file => JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));

export async function readDays(directory = path.join(root, 'content', 'days')) {
  const files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
  return Promise.all(files.map(file => readJson(path.join(directory, file))));
}

function similarity(a, b) {
  const grams = text => new Set(Array.from({ length: Math.max(0, text.length - 1) }, (_, i) => text.slice(i, i + 2)));
  const left = grams(normalize(a));
  const right = grams(normalize(b));
  if (!left.size || !right.size) return normalize(a) === normalize(b) ? 1 : 0;
  const overlap = [...left].filter(part => right.has(part)).length;
  return (2 * overlap) / (left.size + right.size);
}

export function validateDays(days) {
  const ids = new Set();
  const slugs = new Set();
  const ordinals = new Set();
  for (const day of days) {
    if (!/^[a-z0-9-]+$/.test(day.id) || !/^[a-z0-9-]+$/.test(day.slug)) throw Error('Invalid day id or slug');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || Number.isNaN(Date.parse(day.date))) throw Error(`${day.id}: invalid date`);
    if (new Date(`${day.date}T12:00:00Z`).toISOString().slice(0, 10) !== day.date) throw Error(`${day.id}: invalid calendar date`);
    if (!Number.isInteger(day.day) || day.day < 1) throw Error(`${day.id}: invalid ordinal`);
    if (!['draft', 'completed'].includes(day.status)) throw Error(`${day.id}: invalid status`);
    const ordinal = `${day.cycle}:${day.day}`;
    if (ids.has(day.id) || slugs.has(day.slug) || ordinals.has(ordinal)) throw Error('Duplicate id, URL or cycle/day');
    ids.add(day.id); slugs.add(day.slug); ordinals.add(ordinal);
    if (day.films.length !== 3) throw Error(`${day.id}: expected three film selections`);
    const count = countHan(body(day).join(''));
    if (count < 150 || count > 220) throw Error(`${day.id}: Chinese body has ${count} characters; expected 150–220`);
    if (day.focus.length < 8 || day.focus.length > 12) throw Error(`${day.id}: expected 8–12 practice characters`);
    for (const item of day.focus) {
      if (!body(day).join('').includes(item.char)) throw Error(`${day.id}: practice character ${item.char} is not in body`);
    }
    for (const section of sections(day)) {
      if (!section.lines.length) throw Error(`${day.id}: empty section`);
      for (const line of section.lines) {
        if (typeof line.zh !== 'string' || !line.zh.trim() || typeof line.en !== 'string' || !line.en.trim()) throw Error(`${day.id}: missing bilingual pair`);
      }
      for (const source of section.sources || []) {
        if (!/^https:\/\//.test(source.url)) throw Error(`${day.id}: source must be an HTTPS URL`);
      }
    }
  }
  for (let i = 0; i < days.length; i++) {
    for (let j = i + 1; j < days.length; j++) {
      const a = days[i], b = days[j];
      if (a.cycle !== b.cycle) continue;
      if (normalize(a.title.zh) === normalize(b.title.zh)) throw Error(`Repeated theme: ${a.title.zh}`);
      const priorWorks = new Set(workNames(a).map(normalize));
      if (workNames(b).some(work => priorWorks.has(normalize(work)))) throw Error('Repeated work in active cycle');
      if (normalize(a.topic.work) === normalize(b.topic.work)) throw Error('Repeated topic in active cycle');
      for (const previous of body(a)) {
        if (body(b).some(next => similarity(previous, next) >= 0.86)) throw Error('Repeated or near-duplicate sentence');
      }
    }
  }
  return days;
}

export function dayStats(day) {
  const counts = [day.films.flatMap(f => f.lines), day.poem.lines, day.prose.lines, day.modern.lines, day.topic.lines, day.original.lines]
    .map(lines => countHan(lines.map(line => line.zh).join('')));
  const total = counts.reduce((sum, count) => sum + count, 0);
  return { total, counts, percentages: counts.map(count => Math.round(count / total * 100)) };
}

export function validateHistory(days, history) {
  for (const day of days) {
    if (day.cycle !== history.id) continue;
    for (const used of history.completed || []) {
      if (used.id === day.id) continue;
      if (normalize(used.theme.zh) === normalize(day.title.zh)) throw Error('Theme repeats permanent history');
      if (workNames(day).some(work => used.works.map(normalize).includes(normalize(work)))) throw Error('Work repeats permanent history');
      if (normalize(used.topic) === normalize(day.topic.work)) throw Error('Topic repeats permanent history');
      if (body(day).some(line => used.textZh.some(prior => similarity(line, prior) >= .86))) throw Error('Sentence repeats permanent history');
    }
  }
  return days;
}

export function toReadingText(day) {
  return [`第${day.day}天｜${day.title.zh}`, day.title.en, day.date, '',
    ...sections(day).flatMap(section => [section.work || '今日原创 / Original', section.translation.zh, ...section.lines.flatMap(line => [line.zh, line.en]), ...(section.note ? [section.note.zh, section.note.en] : []), ...(section.verification ? [section.verification.zh, section.verification.en] : []), '', ...(section.sources || []).map(source => `${source.label}: ${source.url}`), '']),
    '七、今日练字重点 / Characters to practise',
    ...day.focus.map(item => `${item.char} — ${item.zh} / ${item.en}`), '',
    '八、自由书写 / Your own words',
    ...(day.writing.couplets ? day.writing.couplets.flatMap(couplet => [...couplet.lines.map(line => line.before + '（　）' + line.after), couplet.en]) : day.writing.fills.flatMap(fill => [fill.before + '______' + fill.after, fill.en])),
    day.writing.question.zh, day.writing.question.en, '',
    '九、去重记录 / Edition record',
    `${day.date}｜第${day.day}天｜${day.title.zh}｜${workNames(day).join('｜')}｜${day.topic.work}`, ''
  ].join('\n');
}
