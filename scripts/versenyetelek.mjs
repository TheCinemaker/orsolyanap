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
  ['Kőszegi Turisztikai Szövetség Egyesület', 'Áfonyás szarvaspörkölt szalvétagombóccal', SZO],
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
  ['Kőszegi Turisztikai Szövetség Egyesület', 'Vadas vargányás szalvétagombóccal', VAS],
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

/**
 * Ahol a stand MÁS NÉVEN vette fel az ételt, mint ahogy nevezett.
 *
 * Nem hasonlóságra bízzuk: a "Székelykáposzta" és a "Töltött káposzta" két
 * különböző étel, mégis ugyanazt a tételt takarja — ezt csak a szervező tudja
 * megmondani, algoritmus nem. Ami itt áll, az megkérdezett és megerősített.
 *
 *   'stand neve|nevezési név' -> ahogy most az étlapon szerepel
 */
const ATNEVEZES = new Map([
  ['Balog Iskola|Betyáros húsgombóc házi galuskával', 'Vargányás betyárgombóc házi galuskával'],
  ['Dance Jam Kőszeg|Káposztába göngyölt jókedv', 'Töltött káposzta'],
  ['Dance Jam Kőszeg|Csülökpörkölt táncos körítéssel', 'Csülökpörkölt nokedlivel'],
  ['Kőszeg Város Fúvószenekara és jubileumi sátra|Burgundi sertésragu', 'Burgundi sertéspörkölt'],
  ['Hajnalcsillag Néptáncegyüttes|Fordított lacipecsenye, sült paprika ágyon', 'Fordított élvezet'],
  ['Dr. Nagy László EGYMI|Székelykáposzta', 'Töltött káposzta'],
]);

/**
 * A nevezési listán vegyes a kis- és nagybetű: van "Pejsli" és "gulyásleves"
 * is. A szöveget szó szerint átvesszük, de a kezdőbetűt nagyítjuk — a listán
 * ez elgépelés, nem szándék, és kisbetűvel kezdődő ételnév rendetlennek
 * látszik a kártyán.
 */
const etelNevre = (sz) => sz.charAt(0).toUpperCase() + sz.slice(1);

/**
 * Ahol az ÉTLAPON pontosabb a név, ott nem nevezünk át.
 *
 * A nevezési lapokon néhol rövidítve írták a fogást: "marhapörkölt" ott,
 * ahol az étlapon "Vörösboros marhapörkölt káposztasalátával" áll. A cél az
 * volt, hogy a stand által adott különleges név jelenjen meg — nem az, hogy
 * információt vegyünk el a vendégtől.
 *
 * Két esetben hagyjuk békén:
 *   - a két név csak írásmódban tér el (vessző, kötőjel, nagybetű)
 *   - az étlap neve magában foglalja a nevezésit, tehát bővebb nála
 */
const MARAD_AZ_ETLAP_NEVE = new Set([
  // "Vadpörkölt nokedlival, uborkával" -- a nevezésen lemaradt az uborka,
  // de a vendégnek az is információ, főleg ha válogatós.
  'Bersek Iskola|vadpörkölt nokedlivel',
]);

const atnevezendo = (item, nevezes, standNev) => {
  const ujNev = etelNevre(nevezes);
  if (item.name === ujNev) return null;
  if (MARAD_AZ_ETLAP_NEVE.has(`${standNev}|${nevezes}`)) return null;
  const a = norm(item.name);
  const b = norm(nevezes);
  if (a === b) return null; // csak írásmód
  if (a.includes(b)) return null; // az étlap neve bővebb
  return ujNev;
};

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
  const alias = ATNEVEZES.get(`${standNev}|${etelNev}`);

  /* Először a NEVEZÉSI nevet keressük, csak utána a régit.
     Az első futtatás átnevezte az ételeket a nevezési lap szerint, tehát a
     régi név már nem létezik. Fordított sorrendben az alias nem talált volna
     semmit, és a szkript levette volna a versenyjelölést hat ételről —
     pont azokról, amelyeket korábban ő maga rakott rendbe. */
  const kulcs = norm(etelNev);
  let pontos = sajat.find((i) => norm(i.name) === kulcs);
  if (!pontos && alias) pontos = sajat.find((i) => norm(i.name) === norm(alias));
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
const atnevez = [...talalt.values()]
  .map((t) => ({ ...t, ujNev: atnevezendo(t.item, t.nevezes, t.stand) }))
  .filter((t) => t.ujNev);
const levesz = items.filter((i) => i.is_competition && !talalt.has(i.id));

console.log('');
console.log(`  ${NEVEZESEK.length} nevezés, ${talalt.size} megtalálva, ${hianyzo.length} nem`);
console.log(`  jelölést kap: ${felvesz.length} | átnevezés: ${atnevez.length} | jelölés lekerül: ${levesz.length}`);

if (atnevez.length) {
  console.log('');
  console.log('  Átnevezés a nevezési lap szerint:');
  atnevez.forEach((t) =>
    console.log(`    ${t.stand}
       eddig:     "${t.item.name}"
       mostantól: "${t.ujNev}"`)
  );
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
  for (const t of talalt.values()) {
    const valtozas = {};
    if (!t.item.is_competition) valtozas.is_competition = true;
    const ujNev = atnevezendo(t.item, t.nevezes, t.stand);
    if (ujNev) valtozas.name = ujNev;
    if (Object.keys(valtozas).length) await db.patch('menu_items', t.item.id, valtozas);
  }
  console.log('');
  console.log(`  Kész: ${felvesz.length} megjelölve, ${atnevez.length} átnevezve, ${levesz.length} jelölés levéve.`);
  console.log('  Következő: node scripts/ellenorzes.mjs');
  console.log('');
}
