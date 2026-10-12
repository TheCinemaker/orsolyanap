/**
 * A közönségszavazás valódi állása, a naplóból.
 *
 *   node scripts/szavazatok.mjs                 állás és ellenőrzés
 *   node scripts/szavazatok.mjs --ujraszamol    a votes oszlop javítása
 *
 * MIÉRT A NAPLÓBÓL: a `menu_items.votes` oszlop csak gyorsítótár. A standok
 * szerkesztő felülete az anon kulccsal írja a táblát, tehát a szám elvileg
 * elállítható. Az `item_votes` napló viszont csak a `vote_for_item` függvényen
 * keresztül változik, és a böngészőből nem írható — a végeredményt ezért
 * mindig ebből kell megállapítani.
 *
 * Az --ujraszamol a naplóhoz igazítja a számlálót. Csak a service_role
 * kulccsal fut, a látogatók nem hívhatják.
 */
import { env, api } from './lib.mjs';

const ujraszamol = process.argv.includes('--ujraszamol');
const e = env();
const db = api(e);

const items = await db.select('menu_items', 'select=id,name,votes,exhibitor_id&order=votes.desc');
const log = await db.select('item_votes', 'select=item_id,device_id');
const exhibitors = await db.select('exhibitors', 'select=id,name');
const standName = new Map(exhibitors.map((x) => [x.id, x.name]));

const naplo = new Map();
for (const r of log) naplo.set(r.item_id, (naplo.get(r.item_id) || 0) + 1);
const eszkozok = new Set(log.map((r) => r.device_id));

const elcsuszott = items.filter((i) => (i.votes || 0) !== (naplo.get(i.id) || 0));
const szavazott = items
  .map((i) => ({ ...i, naplo: naplo.get(i.id) || 0 }))
  .filter((i) => i.naplo > 0)
  .sort((a, b) => b.naplo - a.naplo);

console.log('');
console.log(`  ${log.length} szavazat, ${eszkozok.size} különböző készülékről`);
console.log('');

if (szavazott.length === 0) {
  console.log('  Még nem szavazott senki.');
} else {
  console.log('  Állás a napló szerint:');
  szavazott.slice(0, 25).forEach((i, n) => {
    const stand = standName.get(i.exhibitor_id) || '?';
    console.log(
      `   ${String(n + 1).padStart(3)}. ${String(i.naplo).padStart(5)}  ${i.name.slice(0, 44).padEnd(46)} ${stand.slice(0, 30)}`
    );
  });
  if (szavazott.length > 25) console.log(`        ... és még ${szavazott.length - 25} étel`);
}

console.log('');
if (elcsuszott.length === 0) {
  console.log('  A votes oszlop mindenhol egyezik a naplóval.');
} else {
  console.log(`  ${elcsuszott.length} ételnél a votes oszlop NEM egyezik a naplóval:`);
  elcsuszott.slice(0, 20).forEach((i) =>
    console.log(`    ${i.name.slice(0, 44).padEnd(46)} oszlop: ${i.votes || 0}  napló: ${naplo.get(i.id) || 0}`)
  );
  if (!ujraszamol) {
    console.log('');
    console.log('  Javítás: node scripts/szavazatok.mjs --ujraszamol');
  }
}

if (ujraszamol && elcsuszott.length > 0) {
  for (const i of elcsuszott) {
    await db.patch('menu_items', i.id, { votes: naplo.get(i.id) || 0 });
  }
  console.log('');
  console.log(`  Javítva: ${elcsuszott.length} étel szavazatszáma a naplóhoz igazítva.`);
}

console.log('');
