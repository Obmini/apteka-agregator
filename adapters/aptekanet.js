import { fetchJson } from './util.js';

// «Бажаємо здоров'я» (apteka.net.ua). Два кроки:
// 1) пошук (ціни «від», всеукраїнські); 2) batch-запит цін по Рівному (місто 22500/118).
const RIVNE = { my_city: '22500', my_city_id: '118', com_id: '' };

export const aptekanet = {
  name: "Бажаємо здоров'я",
  async search(query, { signal }) {
    const searchData = await fetchJson('https://apteka.net.ua/api/search_result', {
      signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'load', q: query, page: 0, isSp: 0, mode: 'teaser',
        sort: 'relevance|DESC', pathname: '/search/result',
        query: `search=${query}`, isInitFilter: true,
      }),
    });

    const items = (searchData.pageItems || []).slice(0, 12);
    if (!items.length) return [];

    let rivnePrices = new Map();
    try {
      const priceData = await fetchJson('https://apteka.net.ua/api/apteka_core_price', {
        signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'info',
          ids: items.map((it) => ({ id: String(it.id_goods), ph: 0 })),
          ln: 'uk', spl_full: true, COOKIE: RIVNE,
        }),
      });
      rivnePrices = new Map((priceData.resInfo || []).map((r) => [String(r.id), r]));
    } catch {
      // ціни по Рівному не відповіли — покажемо всеукраїнські «від»
    }

    return items.map((it) => {
      const rivne = rivnePrices.get(String(it.id_goods));
      const qty = rivne?.in_stosk?.qty;
      let availability;
      if (it.is_receipt === 2) availability = 'лише за е-рецептом';
      else if (qty) availability = `${qty} аптек у Рівному`;
      else if (rivne) availability = 'немає в Рівному (онлайн-доставка)';
      else availability = 'ціна «від» (не Рівне)';
      return {
        name: it.name,
        price: rivne?.price ?? it.price ?? null,
        url: it.url ? `https://apteka.net.ua${it.url}` : null,
        availability,
      };
    });
  },
};
