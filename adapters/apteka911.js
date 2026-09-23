import { fetchText, parsePrice, stripTags } from './util.js';

// apteka911.ua — HTML-пошук (сервер-рендер). Браузерний UA обов'язковий:
// без нього сайт віддає інший шаблон і селектори не збігаються.

export const apteka911 = {
  name: 'Apteka911',
  async search(query, { signal }) {
    const html = await fetchText(
      `https://apteka911.ua/shop/search?query=${encodeURIComponent(query)}`,
      { signal }
    );

    const items = [];
    const cards = html.split(/class="[^"]*block-prod-full/).slice(1);
    for (const card of cards.slice(0, 12)) {
      const nameMatch = card.match(/prod__header[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      const priceMatch = card.match(/price-new[^>]*>([\s\S]*?)<\/(?:div|span)>/);
      if (!nameMatch) continue;
      items.push({
        name: stripTags(nameMatch[2]),
        price: priceMatch ? parsePrice(stripTags(priceMatch[1]).replace(/^от|^від/i, '')) : null,
        url: nameMatch[1].startsWith('http') ? nameMatch[1] : `https://apteka911.ua${nameMatch[1]}`,
        availability: 'ціна «від» (онлайн); наявність у Рівному — на сторінці товару',
      });
    }
    return items;
  },
};
