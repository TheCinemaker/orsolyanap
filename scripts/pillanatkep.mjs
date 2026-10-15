/**
 * Vészhelyzeti pillanatkép: az app adata és képei a Netlify-ra.
 *
 *   node scripts/pillanatkep.mjs
 *
 * MIÉRT: minden adat és minden kép a Supabase-ből jön. Ha az elérhetetlen —
 * elfogy a havi forgalmi keret, leáll a szolgáltatás, vagy csak gyenge a
 * mobilnet a tömegben —, az app jelenleg ÜRESEN tölt be. A látogató azt
 * látja, hogy nincs egyetlen stand sem, és bezárja.
 *
 * Ez a szkript kimenti az egészet a `public/` mappába, ahonnan a Netlify
 * szolgálja ki. Ha a Supabase nem válaszol, az app ebből dolgozik tovább:
 * standok, ételek, leírások, fotók, program — minden megvan. Csak az élő
 * dolgok esnek ki: szavazás, kedvelés, új fotó, a standosok szerkesztése.
 *
 * A mentett képeket a böngésző CSAK akkor tölti le, ha tényleg vészüzemre
 * vált. Normál működésben nem kerül semmibe.
 *
 * MIKOR FUTTASD: minden nagyobb adatváltozás után, és mindenképp a
 * rendezvény előtti utolsó körben. A pillanatkép annyit ér, amennyire friss.
 * Utána `git push`, különben nem kerül ki a Netlify-ra.
 */
import fs from 'node:fs';
import path from 'node:path';
import { env, api } from './lib.mjs';

const KIMENET = 'public/pillanatkep.json';
const JEGYZEK = 'public/mentett-kepek.json';
const KEPEK = 'public/mentett-kepek';

const e = env();
const db = api(e);

const [exhibitors, menuItems, events] = await Promise.all([
  db.select('exhibitors', 'select=*&order=name'),
  db.select('menu_items', 'select=*&order=name'),
  db.select('events', 'select=*&order=event_date,start_time'),
]);

fs.mkdirSync(KEPEK, { recursive: true });

/**
 * Egy kép letöltése a Storage-ból a buildbe.
 *
 * A fájlnév a Storage-beli útvonalból jön, nem a tételnévből: így ugyanaz a
 * kép nem töltődik le kétszer, ha több ételhez tartozik.
 */
const letoltve = new Map();
let ujLetoltes = 0;
let kihagyva = 0;
let frissitve = 0;

/* Mikor került a Storage-ba az egyes képek mostani változata.
   Ez azért kell, mert a kép CÍME nem változik cserénél: ugyanaz az
   `<id>.webp`. Ha csak a fájl létezését néznénk, a lecserélt fotóhoz örökre
   a régi helyi másolat maradna -- és mivel normál működésben is a helyi
   másolatot szolgáljuk ki, a vendég a RÉGI képet látná, miközben a
   Supabase-ben már az új van. Ez egyszer már megtörtént két fotóval. */
const tarhelyIdok = new Map();
const tarhelyIdo = async (bucket, objektum) => {
  if (!tarhelyIdok.has(bucket)) {
    try {
      tarhelyIdok.set(bucket, await db.listBucket(bucket));
    } catch (err) {
      console.warn(`  nem tudom lekerdezni a ${bucket} bucket idopontjait (${err.message})`);
      tarhelyIdok.set(bucket, new Map());
    }
  }
  return tarhelyIdok.get(bucket).get(objektum) || null;
};

async function helyire(url) {
  if (!url || !url.startsWith('http')) return url;
  if (letoltve.has(url)) return letoltve.get(url);

  const jel = url.split('/storage/v1/object/public/')[1];
  if (!jel) return url; // nem Storage-kép, hagyjuk békén
  const nev = jel.replace(/[^A-Za-z0-9._-]/g, '_');
  const cel = path.join(KEPEK, nev);
  const helyiUt = `/${KEPEK.replace(/^public\//, '')}/${nev}`;

  if (fs.existsSync(cel)) {
    const [bucket, ...tobbi] = jel.split('/');
    const tarhely = await tarhelyIdo(bucket, tobbi.join('/'));
    const helyiIdo = fs.statSync(cel).mtimeMs;
    const elavult = tarhely && new Date(tarhely).getTime() > helyiIdo;
    if (!elavult) {
      kihagyva++;
      letoltve.set(url, helyiUt);
      return helyiUt;
    }
    // Lecserélték a Storage-ban: a helyi másolat is cserélődik.
    fs.rmSync(cel);
    frissitve++;
  }

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    fs.writeFileSync(cel, Buffer.from(await r.arrayBuffer()));
    ujLetoltes++;
    letoltve.set(url, helyiUt);
    return helyiUt;
  } catch (err) {
    console.warn(`  nem sikerult letolteni: ${nev} (${err.message})`);
    // Marad a Supabase-cim: rosszabb, mint a helyi, de jobb, mint a semmi.
    letoltve.set(url, url);
    return url;
  }
}

for (const x of exhibitors) x.image = await helyire(x.image);
for (const i of menuItems) i.image = await helyire(i.image);

const pillanatkep = {
  keszult: new Date().toISOString(),
  exhibitors,
  menuItems,
  events,
};

fs.writeFileSync(KIMENET, JSON.stringify(pillanatkep), 'utf8');

/* A mentett képek jegyzéke.
   Ebből tudja az app normál működésben is, hogy egy Supabase-képnek van-e
   helyi másolata — ha igen, azt használja, és a Supabase forgalmi kerete nem
   fogy. Amihez nincs másolat (például egy helyszínen feltöltött új fotó),
   az továbbra is a Supabase-ből jön. */
fs.writeFileSync(JEGYZEK, JSON.stringify(fs.readdirSync(KEPEK)), 'utf8');

const jsonKb = Math.round(fs.statSync(KIMENET).size / 1024);
const kepekMb =
  fs
    .readdirSync(KEPEK)
    .reduce((n, f) => n + fs.statSync(path.join(KEPEK, f)).size, 0) /
  1024 /
  1024;

console.log('');
console.log(`  ${exhibitors.length} stand, ${menuItems.length} étel, ${events.length} program`);
console.log(`  ${KIMENET}  ${jsonKb} kB`);
console.log(`  ${KEPEK}/  ${fs.readdirSync(KEPEK).length} kép, ${kepekMb.toFixed(1)} MB` +
  `  (${ujLetoltes - frissitve} új, ${frissitve} lecserélt, ${kihagyva} változatlan)`);
console.log('');
console.log('  Ezt most fel kell tolni, különben nem kerül ki:');
console.log('    git add -A public && git commit -m "pillanatkep" && git push');
console.log('');
