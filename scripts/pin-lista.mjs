/**
 * A kiállítói PIN-lista és a koordináta-állapot újragenerálása.
 *
 *   node scripts/pin-lista.mjs
 *
 * Két fájlt ír, mindkettő gitignore-olt és csak a gépen marad:
 *   KIALLITO_PIN_KODOK.txt         a standosoknak kiosztandó kódok
 *   KOORDINATAK_ELLENORIZENDO.txt  mely térkép-pin valódi, melyik becsült
 *
 * A PIN kódok éles belépési adatok. Ez a szkript FÁJLBA írja őket, nem a
 * képernyőre, hogy ne kerüljenek bele naplókba, képernyőképekbe vagy egy
 * beszélgetés előzményébe.
 */
import fs from 'node:fs';
import { env, api, isRealGps, ORGANIZER_PIN } from './lib.mjs';

const e = env();
const db = api(e);
const ex = await db.select('exhibitors', 'select=name,location,pin,coordinates&order=name');

const pad = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s).padEnd(n));
const L = '-'.repeat(90);
const now = new Date().toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' });

// --- PIN lista ---
let t = '='.repeat(90) + '\n';
t += '          ORSOLYA-NAPI VÁSÁR - KIÁLLÍTÓI BELÉPÉSI PIN KÓDOK\n';
t += '                 CIVIL ÍZEK UTCÁJA • VISITKOSZEG\n';
t += '='.repeat(90) + '\n\n';
t += 'BELÉPÉS A STAND KEZELŐ FELÜLETRE\n';
t += '1. Nyisd meg az appot mobilon vagy gépen.\n';
t += '2. Tartsd lenyomva a fejlécben a VISITKOSZEG logót 5 másodpercig.\n';
t += '   (Ez az EGYETLEN bejárat, máshonnan nem elérhető.)\n';
t += '3. Írd be a csapat 4 jegyű PIN kódját. Felhasználónév nem kell.\n\n';
t += L + '\n   Ssz. | ' + pad('Kiállító', 52) + ' | PIN  | Helyszín\n' + L + '\n';
ex.forEach((x, i) => {
  t += '   ' + String(i + 1).padStart(2) + '.  | ' + pad(x.name, 52) + ' | ' + x.pin + ' | ' + (x.location || '-') + '\n';
});
t += L + '\n\n';
t += 'SZERVEZŐI BELÉPÉS (csak a szervezőnek)\n' + L + '\n';
t += `PIN: ${ORGANIZER_PIN}\n`;
t += 'Ezzel nem egy standba lépsz be, hanem megnyílik a csapat- és PIN-jegyzék,\n';
t += 'ahonnan bármelyik stand felülete elérhető. Ezt a kódot senki másnak ne add meg.\n\n';
t += 'EGYÉB\n' + L + '\n';
t += `• ${ex.length} stand, minden kód egyedi.\n`;
t += '• Ez a fájl NINCS a git repóban, csak ezen a gépen.\n';
t += '• Elvesztés esetén újragenerálható: node scripts/pin-lista.mjs\n';
t += `\nFrissítve: ${now}\n`;
fs.writeFileSync('KIALLITO_PIN_KODOK.txt', t, 'utf8');

// --- Koordináta-állapot ---
const exact = ex.filter((x) => isRealGps(x.coordinates));
const est = ex.filter((x) => !isRealGps(x.coordinates));

let c = '='.repeat(70) + '\n   TERKEP-KOORDINATAK ALLAPOTA\n' + '='.repeat(70) + '\n\n';
c += 'A telefonos GPS-meresek sok tizedesjegyuek, a becslesek pontosan\n';
c += 'otjegyuek. A lista ez alapjan valik ketté, tehat magatol frissul,\n';
c += 'ahogy a helyszini koron megadod az igazi pontokat.\n\n';
c += '-'.repeat(70) + `\n  MAR PONTOS (${exact.length})\n` + '-'.repeat(70) + '\n';
exact.forEach((x) => {
  c += '  OK  ' + x.name + '\n      ' + x.coordinates.join(', ') + '\n';
});
c += '\n' + '-'.repeat(70) + `\n  HELYSZINEN ELLENORIZENDO (${est.length})\n` + '-'.repeat(70) + '\n';
est.forEach((x, i) => {
  c += '  [' + String(i + 1).padStart(2) + '] ' + x.name + '\n       ' + x.coordinates.join(', ') + '\n';
});
c += `\nFrissitve: ${now}\n`;
fs.writeFileSync('KOORDINATAK_ELLENORIZENDO.txt', c, 'utf8');

console.log('');
console.log(`  KIALLITO_PIN_KODOK.txt         ${ex.length} stand`);
console.log(`  KOORDINATAK_ELLENORIZENDO.txt  ${exact.length} pontos + ${est.length} ellenőrizendő`);
console.log('');
console.log('  A kódok a fájlban vannak, szándékosan nem a képernyőn.');
console.log('');
