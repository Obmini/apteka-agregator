import { fetchJson } from './util.js';

// Аптека D.S. — відкритий JSON API. Пошук всеукраїнський;
// для перших 4 позицій тягнемо наявність по Рівному з адресами філій.
const API = 'https://api-azure-prod.apteka-ds.com.ua/api/v1';
const RIVNE_QS = 'lat=50.6199&lng=26.251617&city=%D0%A0%D1%96%D0%B2%D0%BD%D0%B5&user=';

export const ds = {
  name: 'Аптека D.S.',
  async search(query, { signal }) {
    const data = await fetchJson(
      `${API}/search-products?query=${encodeURIComponent(query)}&page=1&sku_ids=all&sort_by=position_sort`,
      { signal }
    );

    const items = (data.products || []).slice(0, 12).map((p) => {
      const hasDiscount = typeof p.price_discount === 'number' && p.price_discount > 0 && p.price_discount < p.price;
      return {
        name: p.name,
        price: hasDiscount ? p.price_discount : (typeof p.price === 'number' ? p.price : null),
        url: p.slug ? `https://apteka-ds.com.ua/product/${p.slug}` : null,
        availability: 'мережа D.S.',
        _slug: p.slug,
      };
    });

    // Адреси філій у Рівному для перших 4 товарів (паралельно, помилки не фатальні)
    await Promise.all(
      items.slice(0, 4).map(async (item) => {
        if (!item._slug) return;
        try {
          const remains = await fetchJson(`${API}/product-remains/${item._slug}?${RIVNE_QS}`, { signal });
          const branches = (remains.all_list || []).filter((b) => b.address?.includes('Рівне'));
          if (!branches.length) {
            item.availability = 'немає в аптеках Рівного';
            return;
          }
          const cheapest = branches.reduce((a, b) => ((a.price_discount || a.price) <= (b.price_discount || b.price) ? a : b));
          const branchPrice = cheapest.price_discount || cheapest.price;
          item.availability = `${cheapest.address} — ${branchPrice} грн (${cheapest.quantity} шт)` +
            (branches.length > 1 ? `; ще ${branches.length - 1} аптек` : '');
        } catch {
          // залишаємо загальний підпис
        }
      })
    );

    items.forEach((item) => delete item._slug);
    return items;
  },
};
