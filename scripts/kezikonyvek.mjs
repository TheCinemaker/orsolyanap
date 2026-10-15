/**
 * Standonkénti útmutató, a stand nevével és PIN kódjával kitöltve.
 *
 *   node scripts/kezikonyvek.mjs              # mind a 38 stand
 *   node scripts/kezikonyvek.mjs "Hajnal"     # csak egy stand
 *
 * A STANDOS_KEZIKONYV.txt az üres, nyomtatható alap: abban a stand neve és
 * a PIN helyén pontozott vonal van, mert a repó publikus. Ez a szkript abból
 * készít személyre szabott példányokat a `kezikonyvek/` mappába, amit a
 * szervező egyenként átküld a csapatoknak — így nem kell senkinek a teljes
 * PIN-listát megkapnia, csak a sajátját.
 *
 * A `kezikonyvek/` MAPPA GITIGNORE-OLT. Éles belépési adat van benne.
 */
import fs from 'node:fs';
import path from 'node:path';
import { env, api } from './lib.mjs';

const ALAP = 'STANDOS_KEZIKONYV.txt';
const CEL = 'kezikonyvek';

const szuro = process.argv[2];
const e = env();
const db = api(e);

const ex = await db.select('exhibitors', 'select=name,pin&order=name');
const minta = fs.readFileSync(ALAP, 'utf8');

/* A kitöltendő két sor az alapfájlból. Ha ott változik a szöveg, itt is
   változnia kell — ezért ellenőrizzük, nem csendben hagyjuk kitöltetlenül. */
const NEV_SOR = /^ {2}A STANDOD NEVE: +\.+$/m;
const PIN_SOR = /^ {2}A PIN KÓDOD: +\. \. \. \..*$/m;

for (const [jel, re] of [['név', NEV_SOR], ['PIN', PIN_SOR]]) {
  if (!re.test(minta)) {
    console.error(`\n  A ${ALAP}-ban nem találom a ${jel} sorát.`);
    console.error('  Ha átírtad a fejlécet, igazítsd ehhez a szkripthez is.\n');
    process.exitCode = 1;
  }
}
if (process.exitCode) {
  // Üres helyet hagyó kézikönyvet nem küldünk ki.
} else {
  const lista = szuro
    ? ex.filter((x) => x.name.toLowerCase().includes(szuro.toLowerCase()))
    : ex;

  if (!lista.length) {
    console.error(`\n  Nincs stand erre: "${szuro}"\n`);
    process.exitCode = 1;
  } else {
    fs.mkdirSync(CEL, { recursive: true });

    // A fájlnév a stand neve, csak amit minden telefon és levelezo elvisz.
    const fajlNev = (nev) =>
      nev
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Za-z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '-') + '.txt';

    console.log('');
    for (const x of lista) {
      const szoveg = minta
        .replace(NEV_SOR, `  A STANDOD NEVE:       ${x.name}`)
        // A PIN kód a fájlba kerül, a kimenetre SOHA.
        .replace(PIN_SOR, `  A PIN KÓDOD:          ${x.pin}`);
      const ut = path.join(CEL, fajlNev(x.name));
      fs.writeFileSync(ut, szoveg, 'utf8');
      console.log('   ' + ut);
    }
    console.log(`\n  ${lista.length} útmutató. A PIN benne van, ezért a mappa gitignore-olt.`);
    console.log('  Ezt küldd át a csapatnak — mindenki csak a sajátját kapja.\n');
  }
}
