export const limits = { fill1: 80, fill2: 80, fill3: 80, cloze1: 1, cloze2: 1, cloze3: 1, cloze4: 1, cloze5: 1, cloze6: 1, essay: 6000, free: 6000 };

export function normalizeWriting(values = {}) {
  const checked = {};
  for (const [key, limit] of Object.entries(limits)) {
    const value = values[key] ?? '';
    if (typeof value !== 'string' || value.length > limit) throw Error('文字超过长度限制 / A writing field is too long');
    checked[key] = value.replace(/\r\n/g, '\n');
  }
  return checked;
}

export function writingText(day, values) {
  const checked = normalizeWriting(values);
  const legacy = (day.fills || []).map((fill, index) => fill.before + (checked[`fill${index + 1}`] || '______') + fill.after);
  const lines = day.couplets ? day.couplets.map(couplet => couplet.lines.map(line => line.before + (checked[line.field] || '□') + line.after).join('')) : legacy;
  const prior = day.couplets && ['fill1', 'fill2', 'fill3'].some(key => checked[key]) ? ['以前的填词记录 / Earlier writing', ...legacy, ''] : [];
  return [`提笔--练字｜第${day.day}天｜${day.title.zh}`, day.title.en, day.date, '', '炼字填空 / One word, a different mood', ...lines, '', ...prior,
    '由今天，写自己的几句话 / Inspired by today', day.question.zh, day.question.en, checked.essay, '',
    '自由手记 / Free writing', checked.free, ''].join('\n');
}
