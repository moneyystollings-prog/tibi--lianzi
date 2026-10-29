import { normalizeWriting } from './writing-format.js';

const databaseName = 'tibi-writing-v1';
const storeName = 'entries';

export function openWritingDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(Error('此浏览器暂不能保存，可直接导出文字 / Browser storage is unavailable; export your writing instead'));
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore(storeName, { keyPath: 'key' }); };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(Error('请关闭此网站的其他页面后重试 / Close other tabs of this site and try again'));
  });
}

export function readDeviceWriting(db, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result || { key, revision: 0, values: normalizeWriting(), savedAt: null });
    request.onerror = () => reject(request.error);
  });
}

export function saveDeviceWriting(db, key, revision, values) {
  const checked = normalizeWriting(values);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    let result;
    let conflict = false;
    const request = store.get(key);
    request.onsuccess = () => {
      if ((request.result?.revision || 0) !== revision) {
        conflict = true;
        transaction.abort();
        return;
      }
      result = { key, revision: revision + 1, values: checked, savedAt: new Date().toISOString() };
      store.put(result);
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(conflict ? Error('另一页面已保存新内容，请先导出当前文字，再刷新 / Another tab saved newer writing. Export your changes before reloading') : transaction.error || Error('保存失败，请导出文字备份 / Could not save; export a backup'));
    transaction.onerror = () => {};
  });
}
