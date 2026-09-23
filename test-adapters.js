// Тест адаптерів: node test-adapters.js [запит]
import { adapters } from './adapters/index.js';

const query = process.argv[2] || 'нурофен';
console.log(`Запит: "${query}"\n`);

await Promise.all(
  adapters.map(async (a) => {
    const t0 = Date.now();
    try {
      const items = await a.search(query, { signal: AbortSignal.timeout(15000) });
      const ms = Date.now() - t0;
      console.log(`✔ ${a.name}: ${items.length} позицій за ${ms} мс`);
      for (const it of items.slice(0, 3)) {
        console.log(`   ${it.price} грн | ${it.name} | ${it.availability}`);
      }
      const bad = items.filter((it) => !it.name || typeof it.price !== 'number');
      if (bad.length) console.log(`   ⚠ ${bad.length} позицій без назви/ціни`);
    } catch (err) {
      console.log(`✘ ${a.name}: ${err.message} (${Date.now() - t0} мс)`);
    }
  })
);
