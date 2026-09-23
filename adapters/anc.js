import { fetchJson } from './util.js';

// АНЦ (+ аптеки «Копійка» — та сама група). Рівне = city 69.
const CITY = 69;
const SEARCH_URL = 'https://anc.ua/productbrowser/v3/ua/search/products';
const TAGS_URL = `https://anc.ua/productbrowser/v2/ua/tags/products?city=${CITY}&warehouse=true`;

function body(q) {
  return JSON.stringify({
    markdown: false, city: CITY, q, p: 0, s: 15,
    show_filter: true, filters: {}, min_price: 0, max_price: 100000,
    price_sorting: null, source: 'webApp', pharmacyPrice: true, warehouse: true,
  });
}

function mapProducts(products) {
  return (products || []).slice(0, 12).map((p) => {
    const price = p.cityPrice ?? p.price;
    let availability;
    if (p.pharmacyMinPrice) {
      availability = `в аптеках Рівного: ${p.pharmacyMinPrice}–${p.pharmacyMaxPrice} грн` +
        (p.count ? `, ${p.count} уп.` : '');
    } else if (p.count) {
      availability = `${p.count} уп. в наявності (Рівне)`;
    } else {
      availability = 'онлайн-замовлення';
    }
    return {
      name: p.name,
      price: typeof price === 'number' ? price : null,
      url: p.link ? `https://anc.ua/item/${p.link}` : null,
      availability,
    };
  });
}

export const anc = {
  name: 'АНЦ / Копійка',
  async search(query, { signal }) {
    const opts = { signal, method: 'POST', headers: { 'Content-Type': 'application/json' } };
    const data = await fetchJson(SEARCH_URL, { ...opts, body: body(query) });
    if (data.products?.length) return mapProducts(data.products);

    // Точна назва препарату → редірект на бренд-сторінку
    const slug = data.redirectToBrand || data.redirectToCategory;
    if (slug) {
      const tagData = await fetchJson(TAGS_URL, { ...opts, body: body(slug) });
      return mapProducts(tagData.products);
    }
    return [];
  },
};
