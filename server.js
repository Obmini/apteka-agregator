import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { adapters } from './adapters/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const SEARCH_TIMEOUT_MS = 15000;

async function handleSearch(query) {
  const started = Date.now();
  const settled = await Promise.allSettled(
    adapters.map(async (adapter) => {
      const items = await adapter.search(query, {
        signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
      });
      return { source: adapter.name, items };
    })
  );

  const results = [];
  const errors = [];
  settled.forEach((outcome, i) => {
    if (outcome.status === 'fulfilled') {
      results.push(...outcome.value.items.map((item) => ({ source: adapters[i].name, ...item })));
    } else {
      const reason = outcome.reason;
      errors.push({
        source: adapters[i].name,
        message: reason?.name === 'TimeoutError' ? 'таймаут' : String(reason?.message || reason),
      });
    }
  });

  return { query, tookMs: Date.now() - started, count: results.length, results, errors };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  try {
    if (url.pathname === '/api/search') {
      const q = (url.searchParams.get('q') || '').trim();
      if (q.length < 2) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Запит закороткий (мінімум 2 символи)' }));
        return;
      }
      const payload = await handleSearch(q);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(payload));
      return;
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = await readFile(path.join(__dirname, 'public', 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: String(err?.message || err) }));
  }
});

server.listen(PORT, () => {
  console.log(`Аптечний агрегатор працює: http://localhost:${PORT}`);
  console.log(`Джерела: ${adapters.map((a) => a.name).join(', ')}`);
});
