import { normalizeWriting, writingText } from './writing-format.mjs';
import { openWritingDatabase, readDeviceWriting, saveDeviceWriting } from './writing-device.mjs';

(() => {
  const one = selector => document.querySelector(selector);
  const toast = message => {
    const element = one('.toast');
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { element.hidden = true; }, 4500);
  };
  one('[data-reading]')?.addEventListener('click', event => {
    const active = document.body.classList.toggle('focus-mode');
    event.currentTarget.setAttribute('aria-pressed', String(active));
    event.currentTarget.textContent = active ? '图文 / Illustrated' : '专注 / Focus';
    one('#cinema')?.scrollIntoView({ block: 'start' });
  });
  one('[data-english]')?.addEventListener('click', event => {
    const hidden = document.body.classList.toggle('hide-english');
    event.currentTarget.setAttribute('aria-pressed', String(hidden));
    event.currentTarget.textContent = hidden ? '显示英文 / Show English' : '隐藏英文 / Hide English';
  });
  one('[data-print]')?.addEventListener('click', () => window.print());
  one('#archive-search')?.addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('[data-search]').forEach(row => {
      row.hidden = !row.dataset.search.includes(query);
      if (!row.hidden) visible++;
    });
    one('.empty-search').hidden = visible > 0;
  });

  const form = one('#writing-form');
  if (!form) return;
  const context = JSON.parse(one('#writing-context').textContent);
  const key = `${context.cycle}:${context.id}`;
  const fields = [...form.querySelectorAll('input[name], textarea[name]')].map(input => input.name);
  const status = one('.writing-status');
  const submit = form.querySelector('[type=submit]');
  const exportButton = form.querySelector('[data-export]');
  const exportResult = one('.export-result');
  let db;
  let revision = 0;
  let dirty = false;
  let busy = false;
  let loading = true;
  const values = () => normalizeWriting(Object.fromEntries(fields.map(name => [name, form.elements[name].value])));
  const updateStatus = (message, state = '') => { status.textContent = message; status.dataset.state = state; };
  const updateCouplets = () => {
    form.querySelectorAll('.couplet-card').forEach(card => {
      card.querySelector('.couplet-result').textContent = [...card.querySelectorAll('input')].map(input => input.dataset.before + (input.value || '□') + input.dataset.after).join('');
    });
  };
  form.addEventListener('input', () => {
    dirty = true;
    updateCouplets();
    updateStatus(db ? '有未保存的文字 / Unsaved changes' : '文字尚未保存，可直接导出 / Not saved; you can export your writing');
  });
  form.addEventListener('reset', () => {
    dirty = true;
    setTimeout(updateCouplets, 0);
    exportResult.hidden = true;
    updateStatus('输入已清空，保存后才会替换本机手记 / Fields cleared; save to replace the writing on this device');
  });
  window.addEventListener('beforeunload', event => {
    if (dirty) { event.preventDefault(); event.returnValue = ''; }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || loading) return;
    if (!db) return updateStatus('浏览器保存不可用，请导出文字备份 / Browser storage unavailable; export a backup', 'error');
    busy = true;
    submit.disabled = true;
    form.querySelector('[type=reset]').disabled = true;
    try {
      const sent = values();
      const result = await saveDeviceWriting(db, key, revision, sent);
      revision = result.revision;
      dirty = fields.some(name => form.elements[name].value !== sent[name]);
      updateStatus(dirty ? '已保存上一版本，仍有新修改 / Saved; newer edits remain' : '已保存在此设备的浏览器中 / Saved in this browser on this device', dirty ? '' : 'saved');
      toast('手记已保存 / Your writing is saved');
    } catch (error) {
      updateStatus(error.message || '保存失败，可先导出文字 / Could not save; export your writing', 'error');
    } finally {
      busy = false;
      submit.disabled = false;
      form.querySelector('[type=reset]').disabled = false;
    }
  });
  exportButton.addEventListener('click', () => {
    try {
      const blob = new Blob(['\uFEFF' + writingText(context, values())], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tibi-${context.id}.txt`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      exportResult.textContent = '已请求下载文字文件，请查看浏览器下载列表 / Download requested. Check your browser’s downloads.';
      exportResult.hidden = false;
      toast('文字已交给浏览器下载 / Your text is ready to download');
    } catch (error) { updateStatus(error.message, 'error'); }
  });

  submit.disabled = true;
  openWritingDatabase().then(async database => {
    db = database;
    const entry = await readDeviceWriting(db, key);
    revision = entry.revision;
    if (!dirty) {
      const restored = normalizeWriting(entry.values);
      for (const name of fields) form.elements[name].value = restored[name] || '';
      updateCouplets();
      const legacy = one('.legacy-writing');
      if (legacy) legacy.hidden = !['fill1','fill2','fill3'].some(name => restored[name]);
      updateStatus(revision ? '已恢复此设备的手记 / Writing restored from this device' : '空白的一页，等你落笔 / A blank page, ready for your words', revision ? 'saved' : '');
    }
  }).catch(error => {
    db = null;
    updateStatus(error.message || '浏览器保存不可用，可直接导出文字 / Storage unavailable; export your writing instead', 'error');
  }).finally(() => { loading = false; submit.disabled = !db; });
})();
