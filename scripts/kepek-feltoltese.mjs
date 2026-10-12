/**
 * Ételfotók és logók feltöltése a Supabase Storage-ba.
 *
 *   node scripts/kepek-feltoltese.mjs "Jimmy Gym"     egy stand ételfotói
 *   node scripts/kepek-feltoltese.mjs --mind          minden stand, aminek van új fotója
 *   node scripts/kepek-feltoltese.mjs --logok         logók a logok/ mappából
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
import { env, api, norm, matchFiles, compress, isImage, imageGlob, FOOD, LOGO } from './lib.mjs';

const arg = process.argv[2];
if (!arg) {
  console.error('Használat: node scripts/kepek-feltoltese.mjs "<stand neve>" | --mind | --logok');
  process.exit(1);
}

const e = env();
const db = api(e);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orsolya-'));

const exhibitors = await db.select('exhibitors', 'select=id,name,image&order=name');
const safe = (s) => s.replace(/[\\/:*?"<>|]/g, '-').trim();

let uploaded = 0;
let skipped = [];

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
// Logók
// ---------------------------------------------------------------------------
if (arg === '--logok') {
  if (!fs.existsSync('logok')) {
    console.error('Nincs logok/ mappa.');
    process.exit(1);
  }
  const files = fs.readdirSync('logok').filter(isImage);
  const { manual, restFiles } = applyMapping(readMapping('logok'), files, exhibitors, 'logók');
  const rest = exhibitors.filter((x) => !manual.some((m) => m.id === x.id));
  const { plan: fuzzy, unmatchedFiles } = matchFiles(restFiles, rest);
  const plan = [...manual, ...fuzzy];
  const fresh = plan.filter((p) => {
    const ex = exhibitors.find((x) => x.id === p.id);
    return !ex.image || process.env.FORCE === '1';
  });

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
    const files = fs.readdirSync(dir).filter(isImage);
    if (!files.length) continue;

    const items = await db.select(
      'menu_items',
      `exhibitor_id=eq.${encodeURIComponent(stand.id)}&select=id,name,image&order=name`
    );
    const { manual, restFiles } = applyMapping(readMapping(dir), files, items, stand.name);
    const restItems = items.filter((i) => !manual.some((m) => m.id === i.id));
    const { plan: fuzzy, unmatchedFiles, unmatchedItems } = matchFiles(restFiles, restItems);
    const plan = [...manual, ...fuzzy];
    const fresh = plan.filter((p) => {
      const it = items.find((i) => i.id === p.id);
      return !it.image || process.env.FORCE === '1';
    });

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
  console.log(`  Feltöltve: ${uploaded} kép`);
  if (skipped.length) {
    console.log(`  Kimaradt ${skipped.length} — ezekhez döntés kell:`);
    skipped.forEach((s) => console.log(`    - ${s}`));
  }
  console.log('');
  console.log('  Következő: node scripts/ellenorzes.mjs');
  console.log('');
  fs.rmSync(tmp, { recursive: true, force: true });
}
