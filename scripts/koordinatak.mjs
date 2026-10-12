/**
 * Stand-koordináták beírása a helyszínen mért pontokból.
 *
 *   node scripts/koordinatak.mjs pontok.txt            beírja
 *   node scripts/koordinatak.mjs pontok.txt --proba    csak megmutatja, mit tenne
 *
 * A bemenet egy szövegfájl, soronként egy stand. Pont ugyanúgy beilleszthető,
 * ahogy a telefon adja:
 *
 *   Hajnalcsillag: 47.38919270798614, 16.539153584867744
 *   KTSZE stand 47.38986871225532, 16.539555530929338
 *   # a kettőspont, a sorrend és a sorvégi vessző mindegy
 *
 * MIÉRT SZKRIPT: pénteken 14 pint kell helyre tenni, sátorépítés közben,
 * telefonról. Kézzel kattogtatva egy sor elcsúszik, és akkor a látogató a
 * rossz sátorhoz megy — pont azt veszítjük el, amiért az app készült.
 *
 * AMI BIZONYTALAN, AZT NEM ÍRJA BE. Három védelem van beépítve:
 *   1. kétértelmű standnév  -> kiírja, nem tippel
 *   2. Kőszegen kívüli pont -> elutasítja (ez fogja meg a felcserélt
 *      szélesség/hosszúságot, mert 16.53 nem érvényes szélességi fok)
 *   3. 2 méteren belüli másik stand -> figyelmeztet, mert a sátrak 3x3 m-esek,
 *      tehát két pin ennyire közel nem lehet helyes
 */
import fs from 'node:fs';
import { env, api, norm, lcs, metres, isRealGps } from './lib.mjs';

const file = process.argv[2];
const dryRun = process.argv.includes('--proba');
if (!file) {
  console.error('Használat: node scripts/koordinatak.mjs <pontok.txt> [--proba]');
  process.exit(1);
}

/** Kőszeg és környéke. Ami ezen kívül van, az elírás vagy felcserélt sorrend. */
const KOSZEG = { latMin: 47.36, latMax: 47.41, lonMin: 16.51, lonMax: 16.57 };
const inKoszeg = (lat, lon) =>
  lat >= KOSZEG.latMin && lat <= KOSZEG.latMax && lon >= KOSZEG.lonMin && lon <= KOSZEG.lonMax;

// --- Bemenet beolvasása ---
const lines = fs
  .readFileSync(file, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

const parsed = [];
const unparsed = [];
for (const line of lines) {
  const nums = line.match(/-?\d+\.\d{3,}/g);
  const name = line.replace(/-?\d+\.\d{3,}/g, '').replace(/[:,;]+\s*$/g, '').replace(/[:,;]/g, ' ').trim();
  if (!nums || nums.length < 2 || !name) {
    unparsed.push(line);
    continue;
  }
  if (nums.length > 2) {
    unparsed.push(`${line}   (${nums.length} szám van a sorban, egy standhoz kettő tartozik)`);
    continue;
  }
  parsed.push({ line, name, lat: parseFloat(nums[0]), lon: parseFloat(nums[1]) });
}

const e = env();
const db = api(e);
const exhibitors = await db.select('exhibitors', 'select=id,name,coordinates&order=name');

// --- Párosítás a standnévvel ---
const refused = [];
const plan = [];
const takenIds = new Set();

for (const row of parsed) {
  // A telefon GPS-e 7-15 tizedesjegyet ad. Kevesebb azt jelenti, hogy a szam
  // csonkult a masolasnal: 5 tizedesjegy mar ~1 meteres bizonytalansag, 3 pedig
  // 100 meteres -- egy 3x3 m-es satorhoz hasznalhatatlan.
  const tizedes = Math.min(
    (String(row.lat).split('.')[1] || '').length,
    (String(row.lon).split('.')[1] || '').length
  );
  if (tizedes < 6) {
    refused.push(
      `${row.name} — a pont csak ${tizedes} tizedesjegy pontos, ez a sátorhoz kevés. ` +
        'Másold be a teljes számot, ahogy a telefon adja.'
    );
    continue;
  }

  if (!inKoszeg(row.lat, row.lon)) {
    const swapped = inKoszeg(row.lon, row.lat);
    refused.push(
      `${row.name} — a pont nem Kőszegen van: ${row.lat}, ${row.lon}` +
        (swapped ? '  (fel van cserélve a szélesség és a hosszúság?)' : '')
    );
    continue;
  }

  const key = norm(row.name);
  const scored = exhibitors
    .map((ex) => {
      const nb = norm(ex.name);
      const base = Math.min(key.length, nb.length) || 1;
      return { ex, score: key === nb ? 2 : lcs(key, nb) / base };
    })
    .sort((a, b) => b.score - a.score);

  const [first, second] = scored;
  const clear = first.score >= 0.75 && (!second || first.score - second.score >= 0.15);
  if (!clear) {
    const kozel = scored
      .slice(0, 3)
      .map((s) => `${s.ex.name} (${s.score.toFixed(2)})`)
      .join(' | ');
    refused.push(`"${row.name}" — nem tudom, melyik stand. Hasonlók: ${kozel}`);
    continue;
  }
  if (takenIds.has(first.ex.id)) {
    refused.push(`"${row.name}" — ehhez a standhoz már van egy pont ebben a fájlban`);
    continue;
  }

  takenIds.add(first.ex.id);
  plan.push({ ex: first.ex, lat: row.lat, lon: row.lon, score: first.score });
}

// --- Egymásra csúszó pinek ---
// A sátrak 3x3 méteresek, szorosan egymás mellett. Két pin 2 méteren belül
// tehát nem lehet helyes: vagy ugyanazt a pontot kaptuk kétszer, vagy elírás.
const after = exhibitors.map((ex) => {
  const hit = plan.find((p) => p.ex.id === ex.id);
  return { id: ex.id, name: ex.name, coords: hit ? [hit.lat, hit.lon] : ex.coordinates };
});
const warnings = [];
for (let i = plan.length - 1; i >= 0; i--) {
  const p = plan[i];
  for (const other of after) {
    if (other.id === p.ex.id || !Array.isArray(other.coords)) continue;
    const d = metres([p.lat, p.lon], other.coords);
    if (d > 2) continue;
    if (d < 0.5) {
      // Fel méteren belül két sátor nem állhat: ez ugyanannak a pontnak a
      // kétszeri beillesztése. Nem írjuk be, mert az egyik stand pinje biztosan
      // rossz helyre kerülne.
      refused.push(
        `${p.ex.name} — ez a pont ${d.toFixed(1)} m-re van ${other.name} pinjétől, ` +
          'vagyis ugyanazt a pontot kaptam kétszer. Melyik standhoz tartozik?'
      );
      plan.splice(i, 1);
      break;
    }
    warnings.push(`${p.ex.name} és ${other.name} ${d.toFixed(1)} m-re van egymástól`);
  }
}

// --- Mi fog történni ---
console.log('');
console.log(`  ${lines.length} sor, ${plan.length} beírható, ${refused.length} elutasítva`);
console.log('');
for (const p of plan) {
  const volt = p.ex.coordinates;
  const moved = Array.isArray(volt) ? metres([p.lat, p.lon], volt) : null;
  const honnan = !Array.isArray(volt)
    ? 'nem volt pontja'
    : isRealGps(volt)
      ? `korábbi mért pontjától ${moved.toFixed(0)} m`
      : `a becsült helyétől ${moved.toFixed(0)} m`;
  console.log(`    ${p.ex.name.slice(0, 44).padEnd(46)} ${p.lat}, ${p.lon}`);
  console.log(`    ${''.padEnd(46)} ${honnan}`);
}

if (warnings.length) {
  console.log('');
  console.log('  FIGYELEM, túl közeli pinek:');
  warnings.forEach((w) => console.log(`    - ${w}`));
  console.log('    A sátrak 3x3 m-esek, ennyire közel két pin nem lehet helyes.');
}

if (unparsed.length) {
  console.log('');
  console.log('  Ezeket a sorokat nem értettem:');
  unparsed.forEach((u) => console.log(`    - ${u}`));
}

if (refused.length) {
  console.log('');
  console.log('  Ezeket NEM írom be, döntés kell hozzájuk:');
  refused.forEach((r) => console.log(`    - ${r}`));
}

if (dryRun) {
  console.log('');
  console.log('  Próba volt, semmit nem írtam be. Éles futtatás: hagyd le a --proba kapcsolót.');
  console.log('');
} else {
  for (const p of plan) {
    await db.patch('exhibitors', p.ex.id, { coordinates: [p.lat, p.lon] });
  }

  console.log('');
  console.log(`  Beírva: ${plan.length} koordináta`);
  console.log('');
  console.log('  Következő: node scripts/ellenorzes.mjs');
  console.log('');
}
