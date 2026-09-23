import { fetchJson } from './util.js';

// Аптека Доброго Дня — Evinent search API (макс. 10 позицій).
// Ціна онлайн єдина по країні; наявність у Рівному — на сторінці товару.
export const add = {
  name: 'Аптека Доброго Дня',
  async search(query, { signal }) {
    const data = await fetchJson(
      `https://add-api.evinent.site/api/search/autocomplete/1/1/${encodeURIComponent(query)}/true/`,
      { signal }
    );

    return (data.products || []).map((p) => ({
      name: p.title,
      price: typeof p.price === 'number' ? p.price : null,
      url: p.url || null,
      availability: p.isAvailable
        ? 'в наявності (мережі ADD та D.S., Рівне — 9 аптек)'
        : 'немає в наявності',
    }));
  },
};
