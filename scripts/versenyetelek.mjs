/**
 * A főzőversenyre nevezett ételek megjelölése.
 *
 *   node scripts/versenyetelek.mjs --proba
 *   node scripts/versenyetelek.mjs
 *
 * A szervező nevezési listája lentebb, szó szerint, ahogy megkaptuk:
 * 32 csapat szombaton, 26 vasárnap. A szkript ezeket keresi meg a standok
 * étlapjában, és beállítja rájuk az `is_competition` jelzőt.
 *
 * AMIT NEM TALÁL, AZT KIÍRJA. Két oka lehet: vagy nincs felvéve az étel a
 * standhoz, vagy másként hívják az étlapon, mint a nevezési listán. Mindkettő
 * döntést igényel, tippelni nem szabad — egy rossz helyre tett versenyjelölés
 * azt állítaná egy standról, hogy nevezett, holott nem.
 *
 * A jelzőt előbb MINDENHOL törli, aztán teszi fel: így ha egy csapat visszalép,
 * az újrafuttatás levesz\i róla a jelölést, nem csak hozzáad.
 */
import { env, api, norm, lcs } from './lib.mjs';

const dryRun = process.argv.includes('--proba');

const SZO = 'saturday';
const VAS = 'sunday';

/** [stand neve az appban, étel a nevezési listán, nap] */
const NEVEZESEK = [
  ['Kőszegfalvi SE', 'Pejsli', SZO],
  ['Árpád-házi Szent Margit Óvoda', 'Pásztortarhonya', SZO],
  ['Balog Iskola', 'Betyáros húsgombóc házi galuskával', SZO],
  ['Cák Község Önkormányzata', 'Csülkös pacal cipóban', SZO],
  ['Kőszegi Református Egyházközség', 'Szarvaspörkölt', SZO],
  ['Kőszegi Baptista Gyülekezet', 'Húsleves gazdagon, laktóz- és tojásmentesen', SZO],
  ['Bersek Iskola', 'vadpörkölt nokedlivel', SZO],
  ['Dance Jam Kőszeg', 'Káposztába göngyölt jókedv', SZO],
  ['Dr. Nagy László EGYMI', 'Székelykáposzta', SZO],
  ['Dr. Nagy László EGYMI Szakiskola', 'Tárkonyos tejszínes gombás sertéspörkölt galuskával', SZO],
  ['Kőszeg Meseváros Felsővárosi Tagóvodája', 'Harcsapaprikás sztrapacskával', SZO],
  ['Fitt-Box Egyesület', 'Vasi Kamra Kincsei', SZO],
  ['Hajnalcsillag Néptáncegyüttes', 'Cifra rotyogós – Pörkölt nokedlivel', SZO],
  ['IPA Kőszeg', 'Hagymásbab gazdagon', SZO],
  ['Jézus Szíve Karitász Csoport', 'Magyaros gulyásleves', SZO],
  ['Jimmy Gym', 'Harcsapaprikás túrós csuszával', SZO],
  ['Kőszeg Város Fúvószenekara és jubileumi sátra', 'Burgundi sertésragu', SZO],
  ['Kőszegfalvi Baráti Kör', 'Bucinudli sváb módra', SZO],
  ['Kőszegfalvi Óvoda és Kőszegfalvi Gyermekekért Egyesület', 'vadas zsemlegombóccal', SZO],
  ['Kőszegi Atlétikai Club Sportegyesület', 'Gulyásleves', SZO],
  ['Kőszegi Ifjúsági Tűzoltók', 'Slambuc tűzoltó módra', SZO],
  ['Központi Óvoda', 'csülkös babos káposzta', SZO],
  ['Kőszegi Birkózók', 'vadas krumpligombóccal', SZO],
  ['Kőszegi Lóránt Gyula Futball Club', 'Bajnokok hentes tokánya tarhonyával', SZO],
  ['Nagycsaládosok Országos Egyesületének Kőszeg és Kőszeghegyalja Szervezete', 'Orsolya-napi szálkamentes harcsahalászlé Lujber módra', SZO],
  ['Tézsula Hagyományőrző Egyesület', 'ínyenc dióleves', SZO],
  ['Árpád-házi Szent Margit Általános Iskola SZM', 'Velős pacal', SZO],
  ['Kovács Miklós', 'Vaddisznópörkölt knédlivel', SZO],
  ['Tihany', 'Korhely halászlé', SZO],
  ['Kőszegi Ostromnapok Egyesület', 'Káposztás sonkás nokedli', SZO],
  ['Kőszegi Horvát Nemzetiségi Önkormányzat', 'Balkáni burger', SZO],
  ['Kőszegi Evangélikus Középiskola Tekis', 'Báránykapama babbal és gesztenyével', SZO],

  ['Kőszegfalvi SE', 'Zúzapörkölt tarhonyával', VAS],
  ['Árpád-házi Szent Margit Óvoda', 'Pásztorok húsos-babos káposztája', VAS],
  ['Balog Iskola', 'Vörösboros marhapörkölt házi galuskával', VAS],
  ['Cák Község Önkormányzata', 'Húsleves gazdagon', VAS],
  ['Bersek Iskola', 'Csülkös babgulyás', VAS],
  ['Dance Jam Kőszeg', 'Csülökpörkölt táncos körítéssel', VAS],
  ['Dr. Nagy László EGYMI', 'Hentesmester káposztája', VAS],
  ['Dr. Nagy László EGYMI Szakiskola', 'Módos gazda babos káposztája szarvaskolbásszal', VAS],
  ['Fitt-Box Egyesület', 'Őszi Ízek Harmóniája', VAS],
  ['Hajnalcsillag Néptáncegyüttes', 'Fordított lacipecsenye, sült paprika ágyon', VAS],
  ['IPA Kőszeg', 'Kőszeghegyaljai vadpörkölt', VAS],
  ['Jézus Szíve Karitász Csoport', 'Székelykáposzta', VAS],
  ['Kőszegfalvi Nemzetiségi Kórus', 'Részeges fasírt rizzsel', VAS],
  ['Kőszegi Atlétikai Club Sportegyesület', 'Szarvaspörkölt galuskával', VAS],
  ['Kőszegi Ifjúsági Tűzoltók', 'Töltött káposzta tűzoltó módra', VAS],
  ['Központi Óvoda', 'marhapörkölt', VAS],
  ['Kőszegi Birkózók', 'pejsli zsemlegombóccal', VAS],
  ['Kőszegi Lóránt Gyula Futball Club', 'Gólkirály gulyásleves', VAS],
  ['Nagycsaládosok Országos Egyesületének Kőszeg és Kőszeghegyalja Szervezete', 'Orsolya-napi lélekmelegítő csülkös káposzta nagycsaládos módra', VAS],
  ['Tézsula Hagyományőrző Egyesület', 'krumplis pacó', VAS],
  ['Árpád-házi Szent Margit Általános Iskola SZM', 'Gurulós húsos savanyúan', VAS],
  ['Borbarát Hölgyek Egyesülete', 'Füstölgő boszorkányleves', VAS],
  ['Kovács Miklós', 'Vaddisznópörkölt knédlivel', VAS],
  ['Kőszegi Iparosok', 'Bundás szelet', VAS],
  ['Kőszegi Ostromnapok Egyesület', 'Gombás sertésszelet', VAS],
  ['353. Chernel István Cserkészcsapat', 'Tábori császártekercs dödöllével', VAS],
];

const db = api(env());
const exhibitors = await db.select('exhibitors', 'select=id,name');
const items = await db.select('menu_items', 'select=id,name,exhibitor_id,available_day,is_competition');

const talalt = new Map();
const hianyzo = [];

for (const [standNev, etelNev, nap] of NEVEZESEK) {
  const stand = exhibitors.find((x) => x.name === standNev);
  if (!stand) {
    hianyzo.push(`${standNev} — ilyen nevű stand nincs`);
    continue;
  }
  const sajat = items.filter((i) => i.exhibitor_id === stand.id);
  const kulcs = norm(etelNev);
  const pontos = sajat.find((i) => norm(i.name) === kulcs);
  const kozeli =
    pontos ||
    sajat.find((i) => {
      const n = norm(i.name);
      return lcs(n, kulcs) / (Math.min(n.length, kulcs.length) || 1) > 0.8;
    });

  if (!kozeli) {
    hianyzo.push(`${standNev}: "${etelNev}" (${nap === SZO ? 'szo' : 'vas'}) — nincs ilyen étel az étlapon`);
    continue;
  }
  talalt.set(kozeli.id, { item: kozeli, stand: standNev, nevezes: etelNev, pontos: !!pontos });
}

const felvesz = [...talalt.values()].filter((t) => !t.item.is_competition);
const levesz = items.filter((i) => i.is_competition && !talalt.has(i.id));

console.log('');
console.log(`  ${NEVEZESEK.length} nevezés, ${talalt.size} megtalálva, ${hianyzo.length} nem`);
console.log(`  jelölést kap: ${felvesz.length} | jelölés lekerül: ${levesz.length}`);

const kozelitok = [...talalt.values()].filter((t) => !t.pontos);
if (kozelitok.length) {
  console.log('');
  console.log('  Nem szó szerint egyezik, de párosítottam:');
  kozelitok.forEach((t) => console.log(`    ${t.stand}\n       nevezés: "${t.nevezes}"\n       étlapon: "${t.item.name}"`));
}

if (hianyzo.length) {
  console.log('');
  console.log('  NEM talált nevezések — ezekhez döntés kell:');
  hianyzo.forEach((h) => console.log(`    - ${h}`));
}

if (levesz.length) {
  console.log('');
  console.log('  Ezekről lekerül a jelölés (nincsenek a nevezési listán):');
  levesz.forEach((i) => console.log(`    - ${i.name}`));
}

if (dryRun) {
  console.log('');
  console.log('  Próba volt, semmit nem írtam be.');
  console.log('');
} else {
  for (const i of levesz) await db.patch('menu_items', i.id, { is_competition: false });
  for (const t of felvesz) await db.patch('menu_items', t.item.id, { is_competition: true });
  console.log('');
  console.log(`  Kész: ${felvesz.length} étel megjelölve, ${levesz.length} jelölés levéve.`);
  console.log('  Következő: node scripts/ellenorzes.mjs');
  console.log('');
}
