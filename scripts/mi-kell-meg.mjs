/**
 * Mihez kell még kép? Standonként, mappanévvel, kész fájlnévlistával.
 *
 *   node scripts/mi-kell-meg.mjs
 *
 * Az `ellenorzes.mjs` azt mondja meg, mi hiányzik. Ez azt, hogy MIT KELL
 * LEGYÁRTANI hozzá: melyik mappába, milyen néven. A fájlnév nem kötelező
 * pontosan ez — a párosító elnézi a rövidítést és az elírást —, de így biztos,
 * hogy minden tételhez jut kép, és egy sem marad ki.
 */
import fs from 'node:fs';
import { env, api, isImage } from './lib.mjs';

const db = api(env());
const exhibitors = await db.select('exhibitors', 'select=id,name,image,days&order=name');
const items = await db.select('menu_items', 'select=id,name,image,exhibitor_id,available_day&order=name');
const safe = (s) => s.replace(/[\\/:*?"<>|]/g, '-').trim();

const logoFiles = fs.existsSync('logok') ? fs.readdirSync('logok').filter(isImage) : [];

let kellLogo = 0;
let kellFoto = 0;
const sorok = [];

for (const stand of exhibitors) {
  const mine = items.filter((i) => i.exhibitor_id === stand.id);
  const fotoNelkul = mine.filter((i) => !i.image);
  const logoNelkul = !stand.image;
  if (!logoNelkul && fotoNelkul.length === 0) continue;

  const dir = 'etelfotok/' + safe(stand.name);
  const vanMappa = fs.existsSync(dir);
  sorok.push('');
  sorok.push(`  ${stand.name}`);
  if (logoNelkul) {
    kellLogo++;
    sorok.push(`     LOGÓ  ->  logok/   (a fájlnévben legyen benne a stand neve)`);
  }
  if (fotoNelkul.length > 0) {
    kellFoto += fotoNelkul.length;
    sorok.push(`     ${fotoNelkul.length} ÉTELFOTÓ  ->  ${dir}/${vanMappa ? '' : '   (a mappa még nincs meg!)'}`);
    for (const i of fotoNelkul) {
      const nap = i.available_day === 'both' ? '' : `  [csak ${i.available_day === 'saturday' ? 'szombat' : 'vasárnap'}]`;
      sorok.push(`        ${i.name}.png${nap}`);
    }
  }
}

console.log('');
console.log(`  ${exhibitors.length} stand, ${items.length} étel`);
console.log(`  Hiányzik: ${kellLogo} logó és ${kellFoto} ételfotó`);
console.log(`  A logok/ mappában most ${logoFiles.length} fájl van.`);
console.log(sorok.join('\n'));
console.log('');
console.log('  Ha megvannak a fájlok:');
console.log('    node scripts/kepek-feltoltese.mjs --mind');
console.log('    node scripts/kepek-feltoltese.mjs --logok');
console.log('');
