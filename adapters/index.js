// Реєстр адаптерів аптек. Кожен адаптер: { name, search(query, {signal}) → [{name, price, url, availability}] }
import { anc } from './anc.js';
import { apteka911 } from './apteka911.js';
import { podorozhnyk } from './podorozhnyk.js';
import { add } from './add.js';
import { aptekanet } from './aptekanet.js';
import { onlineapteka } from './onlineapteka.js';
import { ds } from './ds.js';

export const adapters = [anc, apteka911, podorozhnyk, add, aptekanet, onlineapteka, ds];
