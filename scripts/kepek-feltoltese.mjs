/**
 * Ételfotók és logók feltöltése a Supabase Storage-ba.
 *
 *   node scripts/kepek-feltoltese.mjs "Jimmy Gym"     egy stand ételfotói
 *   node scripts/kepek-feltoltese.mjs --mind          minden stand, aminek van új fotója
 *   node scripts/kepek-feltoltese.mjs --logok         logók a logok/ mappából
 *   node scripts/kepek-feltoltese.mjs --koteg <mappa> egy mappa, ételnév szerint szétosztva
 *   ... --koteg <mappa> --proba                      megmutatja, mit tenne, de nem tölt fel
 *
 * HONNAN OLVAS:
 *   ételfotó: etelfotok/<stand neve>/<étel neve>.png
 *   logó:     logok/<bármi, amiben szerepel a stand neve>.png
 *
 * MIT TESZ: 16:9-re vágja középre (logónál nem vág), WebP-be tömöríti,
 * feltölti <id>.webp néven, és az adatbázisba a publikus URL-t írja.
 *
 * AMI BIZONYTALAN, AZT NEM TÖLTI FEL. Kiírja, és te döntesz. Ez szándékos:
 * egy allergénes tétel mellé rossz képet tenni rosszabb, mint kép nélkül
 * hagyni.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  env,
  api,
  norm,
  editTavolsag,
  matchFiles,
  legfrissebbValtozatok,
  fajlAlapnev,
  compress,
  isImage,
  imageGlob,
  FOOD,
  LOGO,
} from './lib.mjs';

const arg = process.argv[2];
if (!arg) {
  console.error(
    'Használat: node scripts/kepek-feltoltese.mjs "<stand neve>" | --mind | --logok | --koteg <mappa>'
  );
  process.exit(1);
}

const e = env();
const db = api(e);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orsolya-'));

const exhibitors = await db.select('exhibitors', 'select=id,name,image&order=name');
const safe = (s) => s.replace(/[\\/:*?"<>|]/g, '-').trim();

let uploaded = 0;
let skipped = [];
let lecserelt = 0;

/**
 * Feltöltendő-e ez a kép?
 *
 * Akkor igen, ha még nincs kép, VAGY ha a gépen lévő fájl frissebb annál,
 * ami fent van. Ez teszi a cserét egyszerűvé: lecseréled a fájlt a mappában,
 * futtatsz, és csak az megy fel, amihez hozzányúltál.
 *
 * Korábban minden meglévő kép kimaradt, és cseréhez a FORCE=1 kellett — az
 * viszont mind a 162 fotót újratömörítette és újratöltötte.
 */
function kellFeltolteni(vanKep, forrasFajl, tarhelyIdo) {
  if (process.env.FORCE === '1') return true;
  if (!vanKep) return true;
  if (!tarhelyIdo) return false;
  try {
    return fs.statSync(forrasFajl).mtimeMs > new Date(tarhelyIdo).getTime();
  } catch {
    return false;
  }
}

/**
 * Kézi párosítás: `parositas.json` a képek mappájában.
 *
 * Akkor kell, amikor tippelni nem szabad. Két eset van rá:
 *   - rövidítés: a "NOE.png" logót semmilyen hasonlóság nem köti a
 *     "Nagycsaládosok Országos Egyesületének..." névhez
 *   - egy kép több tételhez: egy "italok.png" a kávéhoz, teához, üdítőhöz
 *
 *   { "NOE.png": "Nagycsaládosok Országos Egyesületének Kőszeg és Kőszeghegyalja Szervezete" }
 *   { "italok.png": ["Kávé", "Tea", "Üdítő"] }
 *
 * Amit itt megadsz, az pontos egyezés, nem tipp — a szkript nem bírálja felül.
 */
function readMapping(dir) {
  const f = path.join(dir, 'parositas.json');
  if (!fs.existsSync(f)) return {};
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (err) {
    console.error(`\n  Hibás parositas.json: ${f}\n  ${err.message}\n`);
    process.exit(1);
  }
}

/** A kézzel megadott párosításokat kivesszük a tippelésből. */
function applyMapping(mapping, files, items, label) {
  const manual = [];
  const consumed = new Set();

  for (const [file, targetsRaw] of Object.entries(mapping)) {
    if (!files.includes(file)) {
      skipped.push(`${label}: a parositas.json a(z) "${file}" fájlt említi, de az nincs a mappában`);
      continue;
    }
    const targets = Array.isArray(targetsRaw) ? targetsRaw : [targetsRaw];
    let hit = false;
    for (const t of targets) {
      const found = items.find((i) => norm(i.name) === norm(t));
      if (!found) {
        skipped.push(`${label}: a parositas.json "${t}" tételre hivatkozik, de ilyen nincs`);
        continue;
      }
      manual.push({ file, id: found.id, name: found.name, score: 2, forced: false, manual: true });
      hit = true;
    }
    if (hit) consumed.add(file);
  }

  return { manual, restFiles: files.filter((f) => !consumed.has(f)) };
}

/** Egy adag kép feldolgozása: tömörítés, feltöltés, URL beírása. */
async function send(plan, srcDir, outDir, table, bucket) {
  for (const p of plan) {
    const webp = path.join(outDir, path.basename(p.file, path.extname(p.file)) + '.webp');
    if (!fs.existsSync(webp)) {
      skipped.push(`${p.name} — a tömörítés nem állította elő: ${p.file}`);
      continue;
    }
    const buf = fs.readFileSync(webp);
    const url = await db.upload(bucket, `${p.id}.webp`, buf);
    await db.patch(table, p.id, { image: url });
    uploaded++;
    const mark = p.manual ? '  (kézi párosítás)' : p.forced ? '  (kényszerű párosítás)' : '';
    console.log(`    ${p.name.slice(0, 40).padEnd(42)}${String(Math.round(buf.length / 1024)).padStart(3)} kB${mark}`);
  }
}

// ---------------------------------------------------------------------------
// Köteg: egy mappa, ételnév szerint szétosztva
//
// Amikor a képek egyszerre készülnek, egyetlen mappába érkeznek, és a fájlnév
// az étel neve. Nem kell 38 mappába szétpakolni őket: a név itt a kulcs.
//
// Ha egy nevet több stand is használ (a "Zsákbamacskát" négy), MINDEGYIK
// megkapja ugyanazt a képet. Ez szándékos: ugyanarról az ételről van szó.
// Ha külön képet akarsz nekik, a stand saját mappájába tedd — az erősebb.
// ---------------------------------------------------------------------------
if (arg === '--koteg') {
  const dir = process.argv[3];
  if (!dir || !fs.existsSync(dir)) {
    console.error('Add meg a mappát: node scripts/kepek-feltoltese.mjs --koteg <mappa>');
    process.exit(1);
  }

  const files = legfrissebbValtozatok(fs.readdirSync(dir).filter(isImage));
  const items = await db.select('menu_items', 'select=id,name,image,exhibitor_id&order=name');
  const standNev = new Map(exhibitors.map((x) => [x.id, x.name]));
  const tarhely = await db.listBucket('etelek');

  const plan = [];
  const nemTalalt = [];
  for (const f of files) {
    const alap = norm(fajlAlapnev(f));
    let egyezok = items.filter((i) => norm(i.name) === alap);

    // A generátor hosszú neveket LEVÁG: "Különböző édes és sós házi" a
    // "...házi sütemények"-ből. Ilyenkor a fájlnév az ételnév eleje. Csak
    // akkor fogadjuk el, ha EGYETLEN ételre illik és elég hosszú ahhoz, hogy
    // ne véletlenül találjon el valamit.
    if (egyezok.length === 0 && alap.length >= 12) {
      // Mindkét irány kell. A generátor hol LEVÁGJA a nevet
      // ("Különböző édes és sós házi"), hol HOZZÁÍR egy angol leírást
      // ("Káposztás sonkás nokedli dumplin...").
      const prefix = items.filter(
        (i) => norm(i.name).startsWith(alap) || (norm(i.name).length >= 12 && alap.startsWith(norm(i.name)))
      );
      const nevek = new Set(prefix.map((i) => norm(i.name)));
      if (nevek.size === 1) egyezok = prefix;
    }

    // Elgépelés: "sertépörkölt" a "sertéspörkölt" helyett. Engedünk néhány
    // betűnyi eltérést — egy 45 karakteres névnél egy hiányzó betű nem
    // kétséges —, de csak akkor, ha egyetlen ételre illik.
    if (egyezok.length === 0 && alap.length >= 12) {
      const hatar = Math.max(1, Math.round(alap.length * 0.06));
      const jok = items.filter((i) => editTavolsag(norm(i.name), alap) <= hatar);
      const nevek = new Set(jok.map((i) => norm(i.name)));
      if (nevek.size === 1) egyezok = jok;
    }

    if (egyezok.length === 0) {
      nemTalalt.push(f);
      continue;
    }
    for (const it of egyezok) {
      if (!kellFeltolteni(Boolean(it.image), path.join(dir, f), tarhely.get(`${it.id}.webp`))) continue;
      if (it.image) lecserelt++;
      plan.push({ file: f, id: it.id, name: `${it.name}  — ${standNev.get(it.exhibitor_id) || '?'}` });
    }
  }

  const proba = process.argv.includes('--proba');

  console.log(`
  ${files.length} fájl, ${plan.length} feltöltendő tétel`);

  // Több változat ugyanahhoz az ételhez: kiírjuk, melyiket választottuk.
  // A generátor `_1`, `_2`, `_3` végződéssel adja őket, és a legmagasabb
  // sorszámú nyer -- de ezt látni kell, nem kitalálni.
  const osszes = fs.readdirSync(dir).filter(isImage);
  if (osszes.length > files.length) {
    console.log(`  ${osszes.length - files.length} régebbi változatot hagytam ki (a magasabb sorszámú nyert)`);
  }

  nemTalalt.forEach((f) => skipped.push(`${f} — nincs ilyen nevű étel`));

  if (proba) {
    plan.forEach((x) => console.log(`    ${x.file.padEnd(44)} -> ${x.name}`));
    if (skipped.length) {
      console.log('');
      console.log(`  Nem kerülne fel ${skipped.length}:`);
      skipped.forEach((x) => console.log(`    - ${x}`));
    }
    console.log('');
    console.log('  Próba volt, semmit nem töltöttem fel.');
    console.log('');
    fs.rmSync(tmp, { recursive: true, force: true });
  } else {
    if (plan.length) {
      const outDir = path.join(tmp, 'koteg');
      compress(imageGlob(dir), outDir, FOOD);
      await send(plan, dir, outDir, 'menu_items', 'etelek');
    }
    report();
  }
}

// ---------------------------------------------------------------------------
// Logók
// ---------------------------------------------------------------------------
else if (arg === '--logok') {
  if (!fs.existsSync('logok')) {
    console.error('Nincs logok/ mappa.');
    process.exit(1);
  }
  const files = legfrissebbValtozatok(fs.readdirSync('logok').filter(isImage));
  const { manual, restFiles } = applyMapping(readMapping('logok'), files, exhibitors, 'logók');
  const rest = exhibitors.filter((x) => !manual.some((m) => m.id === x.id));
  const { plan: fuzzy, unmatchedFiles } = matchFiles(restFiles, rest);
  const plan = [...manual, ...fuzzy];
  const tarhely = await db.listBucket('logok');
  const fresh = plan.filter((p) => {
    const ex = exhibitors.find((x) => x.id === p.id);
    return kellFeltolteni(Boolean(ex.image), path.join('logok', p.file), tarhely.get(`${p.id}.webp`));
  });
  lecserelt += fresh.filter((p) => exhibitors.find((x) => x.id === p.id)?.image).length;

  console.log(`\n  ${files.length} fájl, ${plan.length} párosítva, ${fresh.length} feltöltendő`);
  if (fresh.length) {
    const outDir = path.join(tmp, 'logo');
    for (const p of fresh) {
      const one = path.join(tmp, 'in-' + p.id + path.extname(p.file));
      fs.copyFileSync(path.join('logok', p.file), one);
      compress(one, outDir, LOGO);
      fs.renameSync(
        path.join(outDir, path.basename(one, path.extname(one)) + '.webp'),
        path.join(outDir, path.basename(p.file, path.extname(p.file)) + '.webp')
      );
    }
    await send(fresh, 'logok', outDir, 'exhibitors', 'logok');
  }
  unmatchedFiles.forEach((f) => skipped.push(`${f} — nem tudom, melyik standhoz tartozik`));
  report();
}

// ---------------------------------------------------------------------------
// Ételfotók
// ---------------------------------------------------------------------------
else {
  const targets =
    arg === '--mind'
      ? exhibitors
      : exhibitors.filter((x) => {
          const a = norm(x.name);
          const b = norm(arg);
          return a === b || a.includes(b) || b.includes(a);
        });

  if (targets.length === 0) {
    console.error(`Nincs ilyen stand: "${arg}"`);
    process.exit(1);
  }
  if (targets.length > 1 && arg !== '--mind') {
    console.error(`Több standra illik: ${targets.map((t) => t.name).join(' | ')}`);
    process.exit(1);
  }

  for (const stand of targets) {
    const dir = 'etelfotok/' + safe(stand.name);
    if (!fs.existsSync(dir)) continue;
    const files = legfrissebbValtozatok(fs.readdirSync(dir).filter(isImage));
    if (!files.length) continue;

    const items = await db.select(
      'menu_items',
      `exhibitor_id=eq.${encodeURIComponent(stand.id)}&select=id,name,image&order=name`
    );
    const { manual, restFiles } = applyMapping(readMapping(dir), files, items, stand.name);
    const restItems = items.filter((i) => !manual.some((m) => m.id === i.id));
    const { plan: fuzzy, unmatchedFiles, unmatchedItems } = matchFiles(restFiles, restItems);
    const plan = [...manual, ...fuzzy];
    const tarhely = await db.listBucket('etelek');
    const fresh = plan.filter((p) => {
      const it = items.find((i) => i.id === p.id);
      return kellFeltolteni(Boolean(it.image), path.join(dir, p.file), tarhely.get(`${p.id}.webp`));
    });
    lecserelt += fresh.filter((p) => items.find((i) => i.id === p.id)?.image).length;

    console.log(`\n  ${stand.name}`);
    console.log(`    ${files.length} fájl, ${plan.length} párosítva, ${fresh.length} feltöltendő`);

    if (fresh.length) {
      const outDir = path.join(tmp, safe(stand.id));
      compress(imageGlob(dir), outDir, FOOD);
      await send(fresh, dir, outDir, 'menu_items', 'etelek');
    }
    unmatchedFiles.forEach((f) => skipped.push(`${stand.name}: ${f} — nem tudom, melyik ételhez tartozik`));
    unmatchedItems
      .filter((i) => !i.image)
      .forEach((i) => skipped.push(`${stand.name}: "${i.name}" — nincs hozzá fájl`));
  }
  report();
}

function report() {
  console.log('');
  console.log(`  Feltöltve: ${uploaded} kép` + (lecserelt ? `, ebből ${lecserelt} csere` : ''));
  if (skipped.length) {
    console.log(`  Kimaradt ${skipped.length} — ezekhez döntés kell:`);
    skipped.forEach((s) => console.log(`    - ${s}`));
  }
  console.log('');
  console.log('  Következő: node scripts/ellenorzes.mjs');
  console.log('');
  fs.rmSync(tmp, { recursive: true, force: true });
}
