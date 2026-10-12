/**
 * Standleírások frissítése a szervezőtől kapott szövegből.
 *
 *   node scripts/stand-leirasok.mjs leirasok.json --proba
 *   node scripts/stand-leirasok.mjs leirasok.json
 *
 * A JSON a stand NEVÉT köti a leíráshoz:
 *
 *   { "Kőszegi Birkózók": "Az 1974-ben indult kőszegi birkózó szakosztály..." }
 *
 * A szöveg a `story` mezőbe kerül — ezt mutatja a standkártya, a részletek
 * ablak és a térkép kiválasztott standja. `null` törli.
 *
 * PONTOS NÉVEGYEZÉST kér, nem tippel. Két „Dr. Nagy László EGYMI" és három
 * „Kőszegfalvi" stand van: egy hasonlóságra hagyatkozó párosítás itt rossz
 * standhoz írná a bemutatkozást.
 */
import fs from 'node:fs';
import { env, api, norm } from './lib.mjs';

const file = process.argv[2];
const dryRun = process.argv.includes('--proba');
if (!file) {
  console.error('Használat: node scripts/stand-leirasok.mjs <leirasok.json> [--proba]');
  process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
const db = api(env());
const exhibitors = await db.select('exhibitors', 'select=id,name,story&order=name');

const plan = [];
const unknown = [];

for (const [name, leiras] of Object.entries(mapping)) {
  const hits = exhibitors.filter((x) => norm(x.name) === norm(name));
  if (hits.length === 0) {
    unknown.push(name);
    continue;
  }
  if (hits.length > 1) {
    unknown.push(`${name}  (${hits.length} standra illik, nem írom be)`);
    continue;
  }
  const value = leiras === null || leiras === '' ? null : leiras;
  plan.push({ ex: hits[0], story: value });
}

const untouched = exhibitors.filter((x) => !plan.some((p) => p.ex.id === x.id));

console.log('');
console.log(`  ${exhibitors.length} stand, ${plan.length} kap leírást`);
console.log('');

for (const p of plan) {
  const same = (p.ex.story || null) === p.story;
  const jel = same ? 'változatlan' : p.story === null ? 'TÖRLÉS' : p.ex.story ? 'FELÜLÍRÁS' : 'új';
  console.log(`    ${p.ex.name}   [${jel}]`);
  if (!same && p.ex.story) console.log(`        eddig:     "${p.ex.story}"`);
  if (!same && p.story !== null) console.log(`        mostantól: "${p.story}"`);
}

if (unknown.length) {
  console.log('');
  console.log('  Ezekhez a nevekhez NINCS stand, nem írtam be semmit:');
  unknown.forEach((t) => console.log(`    - ${t}`));
}

if (untouched.length) {
  console.log('');
  console.log(`  Leírás nélkül maradt ${untouched.length} stand:`);
  untouched.forEach((x) => console.log(`    - ${x.name}${x.story ? '   (van korábbi szövege)' : ''}`));
}

if (dryRun) {
  console.log('');
  console.log('  Próba volt, semmit nem írtam be.');
  console.log('');
} else {
  let n = 0;
  for (const p of plan) {
    if ((p.ex.story || null) === p.story) continue;
    await db.patch('exhibitors', p.ex.id, { story: p.story });
    n++;
  }
  console.log('');
  console.log(`  Frissítve: ${n} leírás`);
  console.log('');
}
