export function normalizeBasePath(value = '') {
  if (!value || value === '/') return '';
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\/?$/.test(value)) {
    throw Error('BASE_PATH must be an absolute path of letters, numbers, hyphens or underscores');
  }
  return value.replace(/\/$/, '');
}

export function prefixLocalUrls(html, basePath = '') {
  const base = normalizeBasePath(basePath);
  if (!base) return html;
  const prefix = url => /^\/(?!\/)/.test(url) ? base + url : url;
  return html.replace(/\b(href|src|srcset)="([^"]*)"/g, (attribute, name, value) => {
    const rewritten = name === 'srcset'
      ? value.replace(/(^|,\s*)(\/(?!\/)[^\s,]+)/g, (_, separator, url) => separator + prefix(url))
      : prefix(value);
    return `${name}="${rewritten}"`;
  });
}
