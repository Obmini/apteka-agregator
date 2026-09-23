import { fetchText, parsePrice, stripTags } from './util.js';

// online-apteka.com.ua (MODX): спершу сесія (PHPSESSID + hash зі сторінки),
// потім AJAX-пошук, який повертає HTML-фрагмент карток.
const BASE = 'https://online-apteka.com.ua';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function bootstrap(signal) {
  const res = await fetch(`${BASE}/ua/`, {
    signal,
    headers: { 'User-Agent': UA, 'Accept-Language': 'uk-UA,uk;q=0.9' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const cookies = (res.headers.getSetCookie?.() || [])
    .map((c) => c.split(';')[0])
    .join('; ');
  const html = await res.text();
  const hash = html.match(/"hash":"([a-f0-9]{32})"/)?.[1];
  if (!hash) throw new Error('не знайдено сесійний hash');
  return { cookies, hash };
}

export const onlineapteka = {
  name: 'Online-Apteka',
  async search(query, { signal }) {
    const { cookies, hash } = await bootstrap(signal);

    const params = new URLSearchParams({
      query, type: 'full', action: 'productMultiSearch',
      hash, hash_dynamic: hash, context: 'ua', page_id: '3', page_url: '/ua/',
    });
    const raw = await fetchText(`${BASE}/assets/components/ajaxfrontend/action.php`, {
      signal,
      method: 'POST',
      headers: {
        Cookie: cookies,
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = JSON.parse(raw);
    if (!data.success || !data.text) return [];

    const items = [];
    const cards = data.text.split(/class="[^"]*product-item(?![\w-])/).slice(1);
    for (const card of cards.slice(0, 12)) {
      const nameMatch = card.match(/product-name[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      const priceMatch = card.match(/price-current[^>]*>[\s\S]*?amount[^>]*>([\s\S]*?)<\/span>/);
      if (!nameMatch) continue;
      items.push({
        name: stripTags(nameMatch[2]),
        price: priceMatch ? parsePrice(stripTags(priceMatch[1])) : null,
        url: nameMatch[1].startsWith('http') ? nameMatch[1] : BASE + nameMatch[1],
        availability: 'ціна «від» (онлайн); аптеки Рівного — на сторінці товару',
      });
    }
    return items;
  },
};
