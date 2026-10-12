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
import { env, api, norm, matchFiles, compress, FOOD, LOGO } from './lib.mjs';

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
    const mark = p.forced ? '  (kényszerű párosítás)' : '';
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
  const files = fs.readdirSync('logok').filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  const { plan, unmatchedFiles } = matchFiles(files, exhibitors);
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
    const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    if (!files.length) continue;

    const items = await db.select(
      'menu_items',
      `exhibitor_id=eq.${encodeURIComponent(stand.id)}&select=id,name,image&order=name`
    );
    const { plan, unmatchedFiles, unmatchedItems } = matchFiles(files, items);
    const fresh = plan.filter((p) => {
      const it = items.find((i) => i.id === p.id);
      return !it.image || process.env.FORCE === '1';
    });

    console.log(`\n  ${stand.name}`);
    console.log(`    ${files.length} fájl, ${plan.length} párosítva, ${fresh.length} feltöltendő`);

    if (fresh.length) {
      const outDir = path.join(tmp, safe(stand.id));
      compress(path.join(dir, '*'), outDir, FOOD);
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
