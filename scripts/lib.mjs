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
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch(url, opts);
        const text = await r.text();
        if (!r.ok) throw new Error(`HTTP ${r.status} — ${text.slice(0, 200)}`);
        return text ? JSON.parse(text) : null;
      } catch (err) {
        lastErr = err;
        if (attempt < 2) await new Promise((res) => setTimeout(res, 600 * (attempt + 1)));
      }
    }
    throw lastErr;
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
    /**
     * Mi van most a tárhelyen és mikor került oda.
     * Ebből tudjuk eldönteni, hogy egy helyi fájl új-e a fentihez képest.
     */
    listBucket: async (bucket) => {
      const r = await fetch(`${U}/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 1000, prefix: '' }),
      });
      if (!r.ok) return new Map();
      const lista = await r.json();
      return new Map((Array.isArray(lista) ? lista : []).map((o) => [o.name, o.updated_at || o.created_at]));
    },

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
/**
 * Amit képnek tekintünk. EGY helyen, mert a baj abból lett, hogy a fájlszűrő
 * és a tömörítés mintája szétcsúszott: a szűrő csak a képeket vette fel, a
 * tömörítés viszont a mappa teljes tartalmát kapta, és egy ott felejtett
 * JSON-on elhasalt az egész stand feltöltése.
 */
const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'webp'];

export const isImage = (f) => new RegExp('\\.(' + IMAGE_EXT.join('|') + ')$', 'i').test(f);

/** Csak a képekre illeszkedő glob-minta egy mappához. */
export const imageGlob = (dir) => {
  const both = IMAGE_EXT.flatMap((e) => [e, e.toUpperCase()]);
  return dir.split('\\').join('/').replace(/\/$/, '') + '/*.{' + both.join(',') + '}';
};

export function compress(inputGlob, outDir, spec) {
  fs.mkdirSync(outDir, { recursive: true });

  // A sharp-cli a bemenetet glob-mintaként értelmezi, abban pedig a visszaperjel
  // ESCAPE-karakter, nem útvonalválasztó. Windowson a path.join visszaperjelet
  // ad, így a minta egyetlen fájlra sem illeszkedett: a szkript "No input
  // files"-t kapott, és egy egész stand fotói kimaradtak. Előre perjellel
  // mindkét rendszeren működik.
  const pattern = String(inputGlob).split('\\').join('/');

  const args = ['--yes', 'sharp-cli', '-i', pattern, '-o', outDir, '-f', 'webp', '-q', String(spec.q), 'resize', String(spec.w)];
  if (spec.h) args.push(String(spec.h), '--fit', 'cover', '--position', 'center');
  else args.push('--withoutEnlargement');

  // A shell:true kell, mert Windowson az npx egy .cmd, azt a Node mashogy nem
  // inditja el. Viszont ilyenkor a Node NEM idezojelezi az argumentumokat, es
  // a standok mappaneveben van szokoz ("Jimmy Gym", "Nagycsaladosok Orszagos
  // Egyesuletenek..."). Idezojel nelkul a sharp-cli az elso szokoznel elvagja
  // az utvonalat, es a tomorites eldobja az egesz standot.
  const quoted = args.map((a) =>
    /[\s&|<>^()]/.test(a) ? '"' + String(a).replace(/"/g, '\\"') + '"' : a
  );
  execFileSync('npx', quoted, { stdio: 'ignore', shell: true });
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
/**
 * Egy fájlnév és egy tételnév hasonlósága.
 *
 * A `score` a rövidebb szöveghez normalizál, hogy mindkét irány működjön: a
 * rövid fájlnév hosszú ételnévhez ("harcsa" -> "Orsolya-napi szálkamentes
 * harcsahalászlé"), és a bő fájlnév rövid standnévhez ("JIMMY GYM Kőszeg
 * erőemelő embléma" -> "Jimmy Gym").
 *
 * A `len` az egyező rész HOSSZA, és ez legalább olyan fontos. A puszta arány
 * ugyanis a rövid neveket felértékeli: "süteményválogatás" és "Tea" közös
 * része mindössze a "te", de mivel a "tea" három karakter, az arány 0,67 --
 * magasabb, mint a helyes "Különböző édes és sós házi sütemények" 0,47-e. Így
 * egy süteményfotó került a tea mellé. Két karakter nem egyezés, hanem zaj.
 */
const MIN_MATCH = 3;

function similarity(fileBase, itemName) {
  const nb = norm(itemName);
  if (fileBase === nb) return { score: 2, len: nb.length };
  const len = lcs(fileBase, nb);
  return { score: len / (Math.min(fileBase.length, nb.length) || 1), len };
}

/** Előbb arány, holtversenyben a hosszabb egyezés. */
const better = (a, b) => b.score - a.score || b.len - a.len;

/**
 * Újabb változat jelölése a fájlnévben: `harcsa_1.png`, `harcsa_2.png`.
 *
 * A cseréhez nem kell kitalálni, pontosan hogy hívták a régit: az új kép
 * ugyanazt a nevet kapja egy `_1` toldalékkal. A toldalék a párosításnál
 * levágódik, és ha több változat van ugyanahhoz az ételhez, A LEGMAGASABB
 * SORSZÁMÚ NYER. A régi fájl ott maradhat a mappában — nem kell törölni,
 * és megmarad belőle, mi volt korábban.
 */
const valtozatSzam = (fajl) => {
  const alap = path.basename(fajl, path.extname(fajl));
  const m = alap.match(/^(.*?)_(\d+)$/);
  return m ? { alap: m[1], szam: Number(m[2]) } : { alap, szam: 0 };
};

/** Minden névhez csak a legfrissebb változatot adja vissza. */
export function legfrissebbValtozatok(files) {
  const legjobb = new Map();
  for (const f of files) {
    const { alap, szam } = valtozatSzam(f);
    const kulcs = norm(alap);
    const eddigi = legjobb.get(kulcs);
    if (!eddigi || szam > eddigi.szam) legjobb.set(kulcs, { f, szam });
  }
  // Az eredeti sorrendet tartjuk, hogy a kimenet kiszámítható legyen.
  const nyertesek = new Set([...legjobb.values()].map((x) => x.f));
  return files.filter((f) => nyertesek.has(f));
}

export function matchFiles(files, items) {
  const plan = [];
  const used = new Set();

  for (const f of files) {
    const fb = norm(valtozatSzam(f).alap);
    // A MIN_MATCH alatti jelölteket itt dobjuk el, nem a végén: ha csak a
    // legjobbat vizsgálnánk, egy zajos jelölt (magas arány, két karakteres
    // egyezés) a RANGSOR ÉLÉRE kerülne, és azzal a helyes párosítást is
    // elrontaná -- sem fel nem kerül, sem a jót nem engedi.
    const scored = items
      .map((it) => ({ it, ...similarity(fb, it.name) }))
      .filter((c) => c.len >= MIN_MATCH)
      .sort(better);
    if (scored.length === 0) continue;
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
        const fb = norm(valtozatSzam(f).alap);
        const s = leftItems
          .map((it) => ({ it, ...similarity(fb, it.name) }))
          .filter((c) => c.len >= MIN_MATCH)
          .sort(better);
        return { f, best: s[0], second: s[1] };
      })
      .filter((c) => c.best)
      .sort((a, b) => better(a.best, b.best));

    // A "mar csak egy maradt" eset sem szabadit fel a MIN_MATCH alol: az
    // utolso fajlt sem szabad az utolso tetelre dobni, ha a kettonek semmi koze
    // egymashoz. Inkabb maradjon kep nelkul, mint rossz keppel.
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
  // A racs 3,3 meterenkent ad helyet, es 3,2 meteres tavolsagot ker. Eloszor 6
  // metert kert, de abbol a setany ket oldalan csak ~20 hely jott ki, es 40
  // kiallito van: a 21. standtol kezdve nem talalt volna helyet. A satrak 3x3
  // m-esek es szorosan allnak, szoval 3 meter a valosaghoz kozelebb is van.
  for (const lon of [16.53893, 16.53951]) {
    for (let lat = 47.38918; lat <= 47.39002; lat += 0.00003) {
      const v = Number(lat.toFixed(5));
      if (pts.every((c) => metres([v, lon], c) > 3.2)) return [v, lon];
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
