const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
};

export async function fetchText(url, { signal, headers = {}, method = 'GET', body } = {}) {
  const res = await fetch(url, {
    method,
    body,
    signal,
    headers: { ...BROWSER_HEADERS, ...headers },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function fetchJson(url, opts = {}) {
  const text = await fetchText(url, {
    ...opts,
    headers: { Accept: 'application/json, text/plain, */*', ...(opts.headers || {}) },
  });
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('невалідний JSON у відповіді');
  }
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Прибирає теги та декодує базові HTML-entities */
export function stripTags(s) {
  return String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

/** "1 234,50 грн" / "234.5" → number або null */
export function parsePrice(raw) {
  if (typeof raw === 'number') return isFinite(raw) ? raw : null;
  if (!raw) return null;
  const cleaned = String(raw)
    .replace(/\s|&nbsp;|грн|₴/gi, '')
    .replace(',', '.');
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : null;
}
