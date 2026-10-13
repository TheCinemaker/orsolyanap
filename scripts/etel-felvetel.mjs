/**
 * Ételek hozzáadása egy MÁR MEGLÉVŐ standhoz.
 *
 *   node scripts/etel-felvetel.mjs "Cák Község Önkormányzata" uj-etelek.json
 *   node scripts/etel-felvetel.mjs "Cák" uj-etelek.json --proba
 *
 * A JSON egy lista. A legegyszerűbb alak csak a nevet adja meg:
 *
 *   ["Rakott krumpli", "Véres és májas hurka"]
 *
 * Bővebben, ha a tipp nem jó vagy csak az egyik napon van:
 *
 *   [
 *     { "nev": "Rakott krumpli", "nap": "saturday" },
 *     { "nev": "Limonádé", "kategoria": "italok", "glutenmentes": true }
 *   ]
 *
 * Ezt a `stand-felvetel.mjs` csak ÚJ standnál tudta. A helyszínen viszont a
 * gyakoribb eset, hogy egy már bent lévő csapat szól, hogy "ezt is hozzuk" —
 * eddig ilyenkor kézzel kellett adatbázist írni, ami pont a rossz pillanatban
 * a legkockázatosabb.
 *
 * Ami már bent van, azt nem veszi fel újra, és árat nem kezel: a vásáron
 * adománygyűjtés folyik, a menu_items táblában nincs price oszlop.
 */
import fs from 'node:fs';
import { env, api, norm, guessCategory, CATEGORIES } from './lib.mjs';

const standArg = process.argv[2];
const file = process.argv[3];
const dryRun = process.argv.includes('--proba');

if (!standArg || !file) {
  console.error('Használat: node scripts/etel-felvetel.mjs "<stand neve>" <etelek.json> [--proba]');
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
const lista = Array.isArray(spec) ? spec : spec.etelek;
if (!Array.isArray(lista) || lista.length === 0) {
  console.error('A JSON egy nem üres lista legyen, vagy legyen benne "etelek" lista.');
  process.exit(1);
}

const db = api(env());
const exhibitors = await db.select('exhibitors', 'select=id,name&order=name');

// Stand keresése: előbb pontos név, aztán résznév. Több találatnál megállunk,
// mert két "Dr. Nagy László EGYMI" és három "Kőszegfalvi" van.
const kulcs = norm(standArg);
let talalat = exhibitors.filter((x) => norm(x.name) === kulcs);
if (talalat.length === 0) talalat = exhibitors.filter((x) => norm(x.name).includes(kulcs));

// A process.exit itt libuv-hibát dob Windowson, mert a hálózati kérés
// erőforrásai még nyitva vannak. Hibakódot állítunk és szabályosan végigfutunk.
let hiba = null;
if (talalat.length === 0) hiba = `Nincs ilyen stand: "${standArg}"`;
else if (talalat.length > 1)
  hiba =
    `Több standra illik: ${talalat.map((t) => t.name).join(' | ')}` +
    '\n  Add meg pontosabban.';

if (hiba) {
  console.error('\n  ' + hiba + '\n');
  process.exitCode = 1;
}

const stand = hiba ? null : talalat[0];

const meglevo = hiba
  ? []
  : await db.select(
      'menu_items',
      `exhibitor_id=eq.${encodeURIComponent(stand.id)}&select=id,name&order=name`
    );

const ujak = [];
const mar = [];

for (const be of hiba ? [] : lista) {
  const tetel = typeof be === 'string' ? { nev: be } : be;
  if (!tetel.nev) {
    console.error('Van egy tétel "nev" nélkül.');
    process.exit(1);
  }
  if (meglevo.some((i) => norm(i.name) === norm(tetel.nev))) {
    mar.push(tetel.nev);
    continue;
  }
  const kategoria = tetel.kategoria || guessCategory(tetel.nev);
  if (!CATEGORIES.includes(kategoria)) {
    console.error(`Ismeretlen kategória: "${kategoria}". Megengedett: ${CATEGORIES.join(', ')}`);
    process.exit(1);
  }
  ujak.push({
    id: `${stand.id}-${norm(tetel.nev).slice(0, 26) || 'etel' + ujak.length}`,
    exhibitor_id: stand.id,
    name: tetel.nev,
    description: tetel.leiras || null,
    category: kategoria,
    available_day: tetel.nap || 'both',
    tags: tetel.tagek || [],
    initial_stock: 30,
    stock: 30,
    status: 'ready',
    votes: 0,
    is_hidden: false,
    is_gluten_free: !!tetel.glutenmentes,
    is_lactose_free: !!tetel.laktozmentes,
    is_sugar_free: !!tetel.cukormentes,
    is_vegan: !!tetel.vegan,
    image: null,
    is_competition: false,
  });
}

const nap = { saturday: 'szombat', sunday: 'vasárnap', both: 'mindkét nap' };

if (!hiba) {
console.log('');
console.log(`  ${stand.name}`);
console.log(`  ${meglevo.length} meglévő tétel, ${ujak.length} új, ${mar.length} már bent volt`);
console.log('');
ujak.forEach((e) => console.log(`    ${e.category.padEnd(12)} ${nap[e.available_day].padEnd(12)} ${e.name}`));
if (mar.length) {
  console.log('');
  console.log('  Ezek már szerepelnek, nem vettem fel újra:');
  mar.forEach((n) => console.log(`    - ${n}`));
}

if (dryRun) {
  console.log('');
  console.log('  Próba volt, semmit nem írtam be.');
  console.log('');
} else if (ujak.length) {
  await db.insert('menu_items', ujak);
  const dir = 'etelfotok/' + stand.name.replace(/[\\/:*?"<>|]/g, '-').trim();
  fs.mkdirSync(dir, { recursive: true });
  console.log('');
  console.log(`  Felvéve: ${ujak.length} étel.`);
  console.log(`  Fotómappa: ${dir}/`);
  console.log('');
  console.log('  Következő: node scripts/mi-kell-meg.mjs');
  console.log('');
}
}
