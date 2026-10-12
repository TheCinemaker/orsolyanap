/**
 * Közös könyvtár az adatkezelő szkriptekhez.
 *
 * MIÉRT VAN EZ: a stand-felvétel és a képfeltöltés konvenciói nem
 * nyilvánvalóak (16:9 vágás, WebP tömörítés, <id>.webp fájlnév, Storage
 * URL az adatbázisban, PIN-ütközések kerülése). Ha mindenki újra kitalálja
 * őket, más lesz az eredmény -- ez egyszer már megtörtént: 2,8 MB-os PNG-k
 * kerültek a Storage-ba és 36 MB a buildbe.
 *
 * Ezért a konvenciók KÓDBAN vannak, nem leírásban.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Környezet
// ---------------------------------------------------------------------------

/** A .env beolvasása. A fájl gitignore-olt: új gépen létre kell hozni. */
export function env() {
  if (!fs.existsSync('.env')) {
    throw new Error(
      'Nincs .env fájl. Másold le a .env.example-t, és írd bele a\n' +
        'SUPABASE_SERVICE_ROLE_KEY-t (Supabase → Project Settings → API → service_role).'
    );
  }
  const e = Object.fromEntries(
    fs
      .readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
  if (!e.VITE_SUPABASE_URL) throw new Error('A .env-ből hiányzik a VITE_SUPABASE_URL.');
  if (!e.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'A .env-ből hiányzik a SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Az anon kulcs nem elég: a Storage-ba írás és a táblák módosítása\n' +
        'service_role kulcsot igényel.'
    );
  }
  return e;
}

/** REST és Storage hívások. */
export function api(e) {
  const U = e.VITE_SUPABASE_URL;
  const key = e.SUPABASE_SERVICE_ROLE_KEY;
  const H = { apikey: key, Authorization: `Bearer ${key}` };
  const HJ = { ...H, 'Content-Type': 'application/json' };

  const req = async (url, opts = {}) => {
    const r = await fetch(url, opts);
    const text = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status} — ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : null;
  };

  return {
    url: U,
    select: (table, query = '') => req(`${U}/rest/v1/${table}?${query}`, { headers: H }),
    insert: (table, rows) =>
      req(`${U}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...HJ, Prefer: 'return=minimal' },
        body: JSON.stringify(rows),
      }),
    patch: (table, id, data) =>
      req(`${U}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { ...HJ, Prefer: 'return=minimal' },
        body: JSON.stringify(data),
      }),
    /** Fájl feltöltése, majd a publikus URL visszaadása. */
    upload: async (bucket, objectPath, buffer) => {
      await req(`${U}/storage/v1/object/${bucket}/${objectPath}`, {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'image/webp', 'x-upsert': 'true' },
        body: buffer,
      });
      return `${U}/storage/v1/object/public/${bucket}/${objectPath}`;
    },
  };
}

// ---------------------------------------------------------------------------
// Képtömörítés
//
// A képek SOHA nem kerülnek a public/ mappába: a Vite onnan változtatás
// nélkül átmásol mindent a dist/-be, és a deploy kiszállítja. A képek helye
// a Supabase Storage.
// ---------------------------------------------------------------------------

/** Ételfotó: 16:9, középre vágva. A katalógus is ebben az arányban mutatja. */
export const FOOD = { w: 600, h: 338, q: 62 };

/** Logó: nem vágunk, a teljes kép látszik a kártyán (object-contain). */
export const LOGO = { w: 400, q: 68 };

/**
 * Tömörítés WebP-be a sharp-cli-vel (npx tölti le, nem kell telepíteni).
 *
 * @param {string} inputGlob bemeneti fájl vagy glob
 * @param {string} outDir kimeneti könyvtár
 * @param {{w:number,h?:number,q:number}} spec FOOD vagy LOGO
 */
export function compress(inputGlob, outDir, spec) {
  fs.mkdirSync(outDir, { recursive: true });
  const args = ['--yes', 'sharp-cli', '-i', inputGlob, '-o', outDir, '-f', 'webp', '-q', String(spec.q), 'resize', String(spec.w)];
  if (spec.h) args.push(String(spec.h), '--fit', 'cover', '--position', 'center');
  else args.push('--withoutEnlargement');
  execFileSync('npx', args, { stdio: 'ignore', shell: process.platform === 'win32' });
}

// ---------------------------------------------------------------------------
// Névpárosítás
//
// A fájlneveket emberek adják, az ételneveket is: "hentesmesetr.png" ->
// "Hentesmester káposztája". Ékezet, kis/nagybetű, szóköz és elírás nem
// akadály, de AMI BIZONYTALAN, AZT NEM TIPPELJÜK MEG -- inkább megkérdezzük.
// ---------------------------------------------------------------------------

export const norm = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Leghosszabb közös részstring hossza. Ez bizonyult a legjobb mérőszámnak. */
export function lcs(a, b) {
  let best = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + best + 1; j <= a.length; j++) {
      if (b.includes(a.slice(i, j))) best = j - i;
      else break;
    }
  }
  return best;
}

/**
 * Fájlok párosítása tételekhez.
 *
 * Két körben megy. Először a BIZTOS találatok (a fájlnév a tétel nevének
 * legalább 90%-át lefedi, és a második helyezettnél érdemben jobb).
 * Utána a maradékból azokat, ahol a megfeleltetés kényszerű -- ha egy fájl
 * és egy tétel marad, az nem tippelés.
 *
 * @returns {{plan: Array, unmatchedFiles: string[], unmatchedItems: Array}}
 */
export function matchFiles(files, items) {
  const plan = [];
  const used = new Set();

  for (const f of files) {
    const fb = norm(path.basename(f, path.extname(f)));
    const scored = items
      .map((it) => {
        const nb = norm(it.name);
        // A rövidebb szöveghez normalizálunk: így mindkét irány működik --
        // a rövid fájlnév hosszú ételnévhez, és a bő fájlnév rövid standnévhez.
        const base = Math.min(fb.length, nb.length) || 1;
        return { it, score: fb === nb ? 2 : lcs(fb, nb) / base };
      })
      .sort((a, b) => b.score - a.score);
    const [first, second] = scored;
    if (first.score >= 0.9 && first.score - (second?.score ?? 0) >= 0.15 && !used.has(first.it.id)) {
      plan.push({ file: f, id: first.it.id, name: first.it.name, score: first.score, forced: false });
      used.add(first.it.id);
    }
  }

  let leftItems = items.filter((i) => !used.has(i.id));
  let leftFiles = files.filter((f) => !plan.some((p) => p.file === f));

  while (leftItems.length && leftFiles.length) {
    const ranked = leftFiles
      .map((f) => {
        const fb = norm(path.basename(f, path.extname(f)));
        const s = leftItems
          .map((it) => {
            const nb = norm(it.name);
            return { it, score: lcs(fb, nb) / (Math.min(fb.length, nb.length) || 1) };
          })
          .sort((a, b) => b.score - a.score);
        return { f, best: s[0], second: s[1] };
      })
      .sort((a, b) => b.best.score - a.best.score);

    const ok = (c) =>
      (leftFiles.length === 1 && leftItems.length === 1) ||
      (c.best.score >= 0.4 && (!c.second || c.best.score - c.second.score >= 0.15));

    const top = ranked.find(ok);
    // Nincs több egyértelműen elhelyezhető fájl: a maradék döntést igényel.
    if (!top) break;

    plan.push({ file: top.f, id: top.best.it.id, name: top.best.it.name, score: top.best.score, forced: true });
    leftItems = leftItems.filter((i) => i.id !== top.best.it.id);
    leftFiles = leftFiles.filter((f) => f !== top.f);
  }

  return { plan, unmatchedFiles: leftFiles, unmatchedItems: leftItems };
}

// ---------------------------------------------------------------------------
// PIN
// ---------------------------------------------------------------------------

/** A szervezői kód. Standnak SOHA nem adható ki. */
export const ORGANIZER_PIN = '0169';

const BANNED = new Set([
  ORGANIZER_PIN, '9999', '0000', '1234', '4321',
  '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888',
]);

/**
 * Egyedi, nem kitalálható 4 jegyű PIN.
 *
 * A belépés CSAK a PIN-t nézi, és az első találatot adja vissza: két
 * egyező kód esetén a standok egymás felületére lépnének be. Ezért az
 * egyediség nem szépségkérdés.
 */
export function newPin(existingPins) {
  const taken = new Set([...existingPins.filter(Boolean), ...BANNED]);
  for (;;) {
    const p = String(crypto.randomInt(1000, 10000));
    if (!taken.has(p)) return p;
  }
}

// ---------------------------------------------------------------------------
// Koordináták
// ---------------------------------------------------------------------------

const decimals = (n) => {
  const s = String(n);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

/**
 * Valódi GPS-mérés vagy becslés?
 *
 * A telefonos mérések sok tizedesjegyűek, a becsléseket 5 jegyre
 * kerekítjük. Így a két halmaz szétválogatása magától működik, és a
 * helyszíni kör után nem kell listát vezetni.
 */
export const isRealGps = (coords) =>
  Array.isArray(coords) && Math.max(decimals(coords[0]), decimals(coords[1])) > 6;

/** Méter két koordináta között (Kőszeg szélességén). */
export function metres(a, b) {
  const k = 111320;
  const dy = (a[0] - b[0]) * k;
  const dx = (a[1] - b[1]) * k * Math.cos((47.389 * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

/**
 * Szabad becsült hely a Diáksétány mentén, két sorban.
 *
 * Csak akkor használd, ha NINCS valódi GPS-pont. A valódi mérésekre nem
 * alkalmazunk távolságminimumot: a sátrak 3x3 méteresek, tehát a szomszédok
 * tényleg pár méterre vannak egymástól.
 */
export function freeEstimatedSpot(existing) {
  const pts = existing.filter(Array.isArray);
  for (const lon of [16.53893, 16.53951]) {
    for (let lat = 47.38922; lat <= 47.38996; lat += 0.00003) {
      const v = Number(lat.toFixed(5));
      if (pts.every((c) => metres([v, lon], c) > 6)) return [v, lon];
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Kategóriák
// ---------------------------------------------------------------------------

/** A menu_items.category megengedett értékei. Ez dönti el a katalógus-szekciót. */
export const CATEGORIES = ['meleg_etel', 'street_food', 'sutemeny', 'italok', 'egyeb'];

/** Egyszerű tipp a kategóriára az étel nevéből. Mindig ellenőrizd! */
export function guessCategory(name) {
  const n = norm(name);
  if (/(tea|puncs|forralt|limonade|szorp|kave|must|frocs|cola|udito|ital)/.test(n)) return 'italok';
  if (/(sutemeny|torta|palacsinta|kremes|somloi|brownie|desszert|fank|gesztenyepure|morzsa|retes)/.test(n)) return 'sutemeny';
  if (/(langos|szendvics|pizza|hotdog|hamburger|kurtos|tocsi|cicege)/.test(n)) return 'street_food';
  if (/(lekvar|kezmuves|zsakbamacska|termek)/.test(n)) return 'egyeb';
  return 'meleg_etel';
}
