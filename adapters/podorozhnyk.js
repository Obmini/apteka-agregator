import { fetchJson } from './util.js';

// Подорожник — API каталогу; x-city = КОАТУУ Рівного.
// Ціна у списку пошуку — хабова (завищена); роздрібну тягнемо
// окремим запитом /api/projections?id= на кожен товар (паралельно).
const RIVNE_KOATUU = '5610100000';
const API = 'https://catalogue.l.podorozhnyk.com/api';
const HEADERS = { 'x-city': RIVNE_KOATUU };

export const podorozhnyk = {
  name: 'Подорожник',
  async search(query, { signal }) {
    const data = await fetchJson(
      `${API}/projections/search?query=${encodeURIComponent(query)}&page=1`,
      { signal, headers: HEADERS }
    );

    const found = (data.searchItems || []).slice(0, 12);
    const detailed = await Promise.allSettled(
      found.map((it) => fetchJson(`${API}/projections?id=${it.id}`, { signal, headers: HEADERS }))
    );

    return found.map((it, i) => {
      const detail = detailed[i].status === 'fulfilled' ? detailed[i].value?.[0] : null;
      const retail = detail?.retailPrice?.current;
      const price = retail ?? it.priceData?.current ?? it.price;
      const count = detail?.pharmaciesCount;
      const available = (detail?.status?.type ?? it.status?.type) === 'available';
      let availability;
      if (count) availability = `${count} аптек у Рівному`;
      else if (available) availability = 'в наявності (Подорожник)';
      else availability = it.status?.title || 'наявність невідома';
      if (retail == null) availability += '; ціна орієнтовна';
      return {
        name: it.title,
        price: typeof price === 'number' ? price : null,
        url: it.url ? `https://podorozhnyk.ua${it.url}` : null,
        availability,
      };
    });
  },
};
