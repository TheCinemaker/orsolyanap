/**
 * Állapot-ellenőrzés. Minden adatmódosítás UTÁN futtasd le.
 *
 *   node scripts/ellenorzes.mjs
 *
 * Azt mondja meg, hogy a vásár adatai kiállítás-készek-e: van-e stand PIN
 * nélkül, kép nélkül, egymásra csúszott térkép-pin, elromlott hivatkozás.
 * Nem javít semmit, csak jelez.
 */
import { env, api, isRealGps, metres, ORGANIZER_PIN } from './lib.mjs';

const e = env();
const db = api(e);

const ex = await db.select('exhibitors', 'select=id,name,pin,image,coordinates,location&order=name');
const it = await db.select('menu_items', 'select=id,name,image,exhibitor_id,is_hidden');

const problems = [];
const note = (msg) => problems.push(msg);

// --- PIN ---
const pins = ex.map((x) => x.pin).filter(Boolean);
ex.filter((x) => !/^[0-9]{4}$/.test(x.pin || '')).forEach((x) => note(`PIN hiányzik vagy hibás: ${x.name}`));
const dupPins = pins.filter((p, i) => pins.indexOf(p) !== i);
[...new Set(dupPins)].forEach((p) => {
  const who = ex.filter((x) => x.pin === p).map((x) => x.name).join(' | ');
  note(`DUPLIKÁLT PIN — ezek egymás felületére lépnének be: ${who}`);
});
ex.filter((x) => x.pin === ORGANIZER_PIN).forEach((x) =>
  note(`${x.name} a szervezői kódot kapta — ez elveszi a jegyzék-hozzáférést`)
);

// --- Képek ---
ex.filter((x) => !x.image).forEach((x) => note(`logó nélkül: ${x.name}`));
it.filter((i) => !i.image).forEach((i) => note(`ételfotó nélkül: ${i.name}`));
const badUrl = [...ex, ...it].filter((r) => r.image && !r.image.includes('/storage/v1/object/public/'));
badUrl.forEach((r) =>
  note(`a kép nem Storage-ból jön (${r.image.slice(0, 44)}…): ${r.name}`)
);

// --- Térkép ---
ex.filter((x) => !Array.isArray(x.coordinates)).forEach((x) => note(`koordináta nélkül: ${x.name}`));
const withCoords = ex.filter((x) => Array.isArray(x.coordinates));
for (let i = 0; i < withCoords.length; i++) {
  for (let j = i + 1; j < withCoords.length; j++) {
    if (metres(withCoords[i].coordinates, withCoords[j].coordinates) < 0.5) {
      note(`EGY PONTON áll: ${withCoords[i].name} és ${withCoords[j].name}`);
    }
  }
}

// --- Kínálat ---
ex.filter((x) => !it.some((i) => i.exhibitor_id === x.id)).forEach((x) =>
  note(`nincs egyetlen étele sem, így a katalógusban nem jelenik meg: ${x.name}`)
);
it.filter((i) => i.is_hidden).forEach((i) => note(`rejtett étel (a látogató nem látja): ${i.name}`));

// --- Összegzés ---
const realGps = withCoords.filter((x) => isRealGps(x.coordinates)).length;
console.log('');
console.log(`  standok:          ${ex.length}`);
console.log(`  ételek:           ${it.length}`);
console.log(`  valódi GPS-pont:  ${realGps}/${ex.length}  (a többi becsült, helyszínen pontosítandó)`);
console.log('');

if (problems.length === 0) {
  console.log('  Minden rendben: nincs hiányzó PIN, kép, koordináta vagy üres stand.');
} else {
  console.log(`  ${problems.length} dolog igényel figyelmet:`);
  problems.forEach((p) => console.log(`    - ${p}`));
}
console.log('');
