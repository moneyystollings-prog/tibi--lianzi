import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { root, readJson, readDays, validateDays, validateHistory, body, workNames, sections, dayStats } from './content.mjs';
const id = process.argv[2];
if (!id) throw Error('Usage: node scripts/record.mjs <completed-day-id>');
const days = validateDays(await readDays());
const day = days.find(item => item.id === id);
if (!day || day.status !== 'completed') throw Error('Only a completed edition can enter the used-content archive.');
const file = path.join(root, 'data', 'cycle.json');
const cycle = await readJson(file);
validateHistory(days, cycle);
if (cycle.id !== day.cycle) throw Error('Edition does not belong to the active cycle. No reset performed.');
const record = {
  id: day.id, day: day.day, date: day.date, theme: day.title, works: workNames(day), topic: day.topic.work,
  textZh: body(day), textEn: sections(day).flatMap(section => section.lines.map(line => line.en)),
  sources: sections(day).flatMap(section => section.sources || []), images: day.images,
  count: dayStats(day).total, status: 'completed', updatedAt: new Date().toISOString()
};
const index = cycle.completed.findIndex(item => item.id === id);
if (index < 0) cycle.completed.push(record); else cycle.completed[index] = record;
cycle.completed.sort((a, b) => a.day - b.day);
const temporary = `${file}.${randomUUID()}.tmp`;
try {
  await writeFile(temporary, JSON.stringify(cycle, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
  await rename(temporary, file);
} catch (error) { await unlink(temporary).catch(() => {}); throw error; }
console.log(`Recorded day ${day.day}. Next ordinal: ${Math.max(...cycle.completed.map(item => item.day)) + 1}.`);
