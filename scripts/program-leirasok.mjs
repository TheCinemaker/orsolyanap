/**
 * Programleírások frissítése a szervezőtől kapott szövegből.
 *
 *   node scripts/program-leirasok.mjs leirasok.json --proba
 *   node scripts/program-leirasok.mjs leirasok.json
 *
 * A JSON a program CÍMÉT köti a leíráshoz:
 *
 *   {
 *     "Ataru Taiko": "Magyar ütőegyüttes, amely a japán taiko dobművészetet...",
 *     "Bujtás Ervin": "Énekes-dalszerző, akusztikus műsorában..."
 *   }
 *
 * Ha egy cím mindkét napon szerepel (Orsolya-napi Vásár, Civil Ízek Utcája,
 * Örökbefogadó Nap), mindkettő megkapja ugyanazt a leírást.
 *
 * CSAK a leírást írja át. Az időpontot, a helyszínt, a címet és a kategóriát
 * nem bántja: azokat a szervező adta, és egy elcsúszott kezdés rosszabb, mint
 * egy hiányzó leírás.
 *
 * Ismeretlen címet nem talál ki és nem párosít tippből: kiírja, és te döntesz.
 */
import fs from 'node:fs';
import { env, api, norm } from './lib.mjs';

const file = process.argv[2];
const dryRun = process.argv.includes('--proba');
if (!file) {
  console.error('Használat: node scripts/program-leirasok.mjs <leirasok.json> [--proba]');
  process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
const db = api(env());
const events = await db.select('events', 'select=id,title,event_date,start_time,location,description&order=event_date,start_time');

const plan = [];
const unknown = [];

for (const [title, description] of Object.entries(mapping)) {
  const hits = events.filter((e) => norm(e.title) === norm(title));
  if (hits.length === 0) {
    unknown.push(title);
    continue;
  }
  for (const e of hits) plan.push({ e, description });
}

const untouched = events.filter((e) => !plan.some((p) => p.e.id === e.id));

console.log('');
console.log(`  ${events.length} program, ${plan.length} kap új leírást`);
console.log('');

for (const p of plan) {
  const same = (p.e.description || '') === p.description;
  const jel = same ? 'változatlan' : p.e.description ? 'felülírás' : 'új';
  console.log(`    ${p.e.event_date}  ${(p.e.start_time || '--:--').slice(0, 5)}  ${p.e.title}   [${jel}]`);
  if (!same && p.e.description) console.log(`        eddig: "${p.e.description}"`);
  if (!same) console.log(`        mostantól: "${p.description}"`);
}

if (unknown.length) {
  console.log('');
  console.log('  Ezekhez a címekhez NINCS program, nem írtam be semmit:');
  unknown.forEach((t) => console.log(`    - ${t}`));
}

if (untouched.length) {
  console.log('');
  console.log('  Ezek a programok nem kaptak új leírást:');
  untouched.forEach((e) => console.log(`    - ${e.event_date}  ${e.title}`));
}

if (dryRun) {
  console.log('');
  console.log('  Próba volt, semmit nem írtam be.');
  console.log('');
} else {
  let n = 0;
  for (const p of plan) {
    if ((p.e.description || '') === p.description) continue;
    await db.patch('events', p.e.id, { description: p.description });
    n++;
  }
  console.log('');
  console.log(`  Frissítve: ${n} leírás`);
  console.log('');
}
