/**
 * Új stand felvétele a vásárba.
 *
 *   node scripts/stand-felvetel.mjs uj-stand.json
 *
 * A JSON fájl (a kötelező mezők a név és az ételek, a többi elhagyható):
 *
 *   {
 *     "nev": "Jimmy Gym",
 *     "etelek": ["Harcsa paprikás túrós csuszával", "Frissen sült lángos"],
 *     "gps": [47.38992583549108, 16.539408011205357],
 *     "helyszin": "Diáksétány",
 *     "mottó": "Várunk mindenkit szeretettel!",
 *     "uzenet": "Szombaton 17:00-kor zenélünk a vár udvarán!",
 *     "napok": "both"
 *   }
 *
 * Az ételek megadhatók bővebben is, ha a tipp nem jó:
 *   { "nev": "Tea", "kategoria": "italok", "nap": "saturday" }
 *
 * A szkript gondoskodik róla, hogy a stand EGYEDI PIN-t kapjon, legyen
 * térkép-pinje, és ne ütközzön a szervezői kóddal. Árat nem kezel: a
 * vásáron adománygyűjtés folyik, a menu_items táblában nincs price oszlop.
 */
import fs from 'node:fs';
import { env, api, norm, newPin, guessCategory, CATEGORIES, freeEstimatedSpot, isRealGps, metres } from './lib.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Használat: node scripts/stand-felvetel.mjs <leiras.json>');
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!spec.nev || !Array.isArray(spec.etelek) || spec.etelek.length === 0) {
  console.error('A JSON-ban kötelező a "nev" és a legalább egy elemű "etelek" lista.');
  process.exit(1);
}

const e = env();
const db = api(e);

const ex = await db.select('exhibitors', 'select=id,name,pin,coordinates');

// --- Van már ilyen stand? ---
const key = norm(spec.nev);
const exists = ex.find((x) => norm(x.name) === key || norm(x.name).includes(key) || key.includes(norm(x.name)));
if (exists) {
  console.error(`Már van hasonló stand: "${exists.name}". Ha mégis új, adj eltérő nevet.`);
  process.exit(1);
}

// --- Azonosító a névből ---
const id = 'ex-' + norm(spec.nev).slice(0, 36);
if (ex.some((x) => x.id === id)) {
  console.error(`Az azonosító már foglalt: ${id}`);
  process.exit(1);
}

// --- Koordináta ---
let coords = Array.isArray(spec.gps) ? spec.gps : null;
let coordKind = 'valódi GPS';
if (!coords) {
  coords = freeEstimatedSpot(ex.map((x) => x.coordinates));
  coordKind = 'BECSÜLT — a helyszínen pontosítani kell';
  if (!coords) {
    console.error('Nem találtam szabad becsült helyet. Adj meg "gps" értéket.');
    process.exit(1);
  }
}

// --- PIN ---
const pin = newPin(ex.map((x) => x.pin));

// --- Ételek ---
const dishes = spec.etelek.map((d, n) => {
  const item = typeof d === 'string' ? { nev: d } : d;
  const category = item.kategoria || guessCategory(item.nev);
  if (!CATEGORIES.includes(category)) {
    console.error(`Ismeretlen kategória: "${category}". Megengedett: ${CATEGORIES.join(', ')}`);
    process.exit(1);
  }
  return {
    id: `${id}-${norm(item.nev).slice(0, 24) || 'etel' + n}`,
    exhibitor_id: id,
    name: item.nev,
    description: item.leiras || null,
    category,
    available_day: item.nap || spec.napok || 'both',
    tags: item.tagek || [],
    initial_stock: 30,
    stock: 30,
    status: 'ready',
    votes: 0,
    is_hidden: false,
    is_gluten_free: !!item.glutenmentes,
    is_lactose_free: !!item.laktozmentes,
    is_sugar_free: !!item.cukormentes,
    is_vegan: !!item.vegan,
    image: null,
  };
});

const hasDrinks = dishes.some((d) => d.category === 'italok');

const stand = {
  id,
  name: spec.nev,
  location: spec.helyszin || 'Diáksétány',
  coordinates: coords,
  pin,
  category: dishes[0].category,
  has_drinks: hasDrinks,
  days: spec.napok || 'both',
  is_open: true,
  offerings: spec.kinalat || dishes.map((d) => d.name).join(', ') + '.',
  story: spec['mottó'] || spec.motto || null,
  notice: spec.uzenet || null,
};

await db.insert('exhibitors', [stand]);
await db.insert('menu_items', dishes);

// --- Fotómappa ---
const dir = 'etelfotok/' + spec.nev.replace(/[\\/:*?"<>|]/g, '-').trim();
fs.mkdirSync(dir, { recursive: true });

// --- Mi lett belőle ---
const near = ex
  .filter((x) => Array.isArray(x.coordinates))
  .map((x) => ({ name: x.name, d: metres(coords, x.coordinates) }))
  .sort((a, b) => a.d - b.d)[0];

console.log('');
console.log(`  Felvéve: ${spec.nev}`);
console.log(`  azonosító:   ${id}`);
console.log(`  koordináta:  ${coords.join(', ')}   (${coordKind})`);
if (near) console.log(`  legközelebbi stand: ${near.d.toFixed(1)} m — ${near.name}`);
console.log(`  italt is ad:  ${hasDrinks ? 'igen' : 'nem'}`);
console.log('');
console.log('  Ételek:');
dishes.forEach((d) => console.log(`    ${d.category.padEnd(12)} ${d.name}`));
console.log('');
console.log(`  A PIN kódot NEM írom ki ide. Futtasd: node scripts/pin-lista.mjs`);
console.log(`  Fotómappa: ${dir}/`);
console.log('');
if (!isRealGps(coords)) {
  console.log('  FIGYELEM: a térkép-pin becsült. A helyszíni körön pontosítsd,');
  console.log('  különben a látogató rossz sátorhoz megy.');
  console.log('');
}
console.log('  Következő: node scripts/ellenorzes.mjs');
console.log('');
