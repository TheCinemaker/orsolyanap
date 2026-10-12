/**
 * A vásár helyszínei: színpadok, mosdók, parkolók, versenyhelyszínek.
 *
 * Ezek NEM standok. A standok a Supabase-ben élnek, mert változnak: jön egy új
 * szervezet, lemond egy másik, módosul az étlap. A helyszínek viszont a
 * rendezvény fix infrastruktúrája, a szervező méri be őket egyszer — ezért
 * elég, ha a kódban vannak, és nem kell hozzá adatbázis.
 *
 * Minden pont a szervezőtől érkezett, bemért koordinátával. Pont nélküli
 * helyszín ide NEM kerül be: a térképen egy rossz helyre tett mosdó vagy
 * parkoló rosszabb a semminél, mert a látogató elhiszi és odamegy.
 *
 * Új helyszín: egy sor a POINTS_OF_INTEREST-be. A térkép, a jelmagyarázat és
 * a tájékoztató magától átveszi.
 */

/** A Diáksétány közepe — ehhez mérjük a távolságokat. */
export const FESTIVAL_CENTRE = [47.38936, 16.53894];

/**
 * Pin-típusok. Szándékosan csak három, nem hétféle szín: a térképen már van
 * amber (stand) és rózsaszín (kedvenc), egy szivárvány olvashatatlan lenne.
 */
export const POI_KINDS = {
  parkolo: {
    legend: 'Ingyenes parkoló',
    pill: 'bg-sky-800 hover:bg-sky-700',
    swatch: 'bg-sky-800 border-sky-900',
  },
  mosdo: {
    legend: 'Mosdó',
    pill: 'bg-slate-600 hover:bg-slate-500',
    swatch: 'bg-slate-600 border-slate-700',
  },
  programhelyszin: {
    legend: 'Programhelyszín',
    pill: 'bg-emerald-800 hover:bg-emerald-700',
    swatch: 'bg-emerald-800 border-emerald-900',
  },
};

export const POINTS_OF_INTEREST = [
  // --- Programhelyszínek ---
  {
    id: 'szinpad-diaksetany',
    kind: 'programhelyszin',
    label: 'Színpad',
    title: 'Szabadtéri színpad',
    hint: 'A Civil Ízek Utcájánál, a Diáksétányon',
    coordinates: [47.38928050659723, 16.538614960597947],
  },
  {
    id: 'szinpad-belvaros',
    kind: 'programhelyszin',
    label: 'Színpad',
    title: 'Szabadtéri színpad',
    hint: 'A belvárosi vásár területén',
    coordinates: [47.38808501655745, 16.541760006147694],
  },
  {
    id: 'fozoverseny',
    kind: 'programhelyszin',
    label: 'Főzőverseny',
    title: 'Civil főzőverseny',
    hint: 'A Diákközben, mindkét nap, délidőben kóstolóval',
    coordinates: [47.389267589304914, 16.539074473391306],
  },
  {
    id: 'koszegi-csemege',
    kind: 'programhelyszin',
    label: 'Kőszegi Csemege',
    title: 'Kőszegi Csemege verseny',
    hint: 'Szombat: nevezés 9:00-11:00, kóstoló 12:30-tól',
    coordinates: [47.389566386935066, 16.539153347587437],
  },
  {
    id: 'kezmuves-1',
    kind: 'programhelyszin',
    label: 'Kézműves',
    title: 'Helyi kézműves termékek',
    hint: 'A Diáksétány mentén',
    coordinates: [47.38959302851926, 16.539080691848174],
  },
  {
    id: 'kezmuves-2',
    kind: 'programhelyszin',
    label: 'Kézműves',
    title: 'Helyi kézműves termékek',
    hint: 'A Diáksétány mentén',
    coordinates: [47.38945738947611, 16.538512880672695],
  },
  {
    id: 'gasztro-kezmuves-vasar',
    kind: 'programhelyszin',
    label: 'Gasztro & kézműves',
    title: 'Gasztronómiai és kézműves vásár',
    hint: 'A belvárosi vásár területén',
    coordinates: [47.388268096763575, 16.54210846846198],
  },

  // --- Mosdók ---
  { id: 'wc-1', kind: 'mosdo', label: 'WC', title: 'Mosdó', coordinates: [47.38986609705391, 16.541004739294507] },
  { id: 'wc-2', kind: 'mosdo', label: 'WC', title: 'Mosdó', coordinates: [47.39035607952998, 16.53867515271092] },
  { id: 'wc-3', kind: 'mosdo', label: 'WC', title: 'Mosdó', coordinates: [47.3895487532115, 16.53893049112871] },
  { id: 'wc-4', kind: 'mosdo', label: 'WC', title: 'Mosdó', coordinates: [47.388353736785874, 16.542930263356133] },

  // --- Parkolók ---
  // A szervező a pontokat név nélkül adta meg, ezért a pin csak "P". A
  // popupban viszont ott a Diáksétánytól mért távolság: a látogatónak nem a
  // parkoló neve a kérdése, hanem hogy mennyit kell onnan gyalogolnia.
  { id: 'p-1', kind: 'parkolo', label: 'P', title: 'Ingyenes parkoló', coordinates: [47.38836640489909, 16.54362299171189] },
  { id: 'p-2', kind: 'parkolo', label: 'P', title: 'Ingyenes parkoló', coordinates: [47.39018029469979, 16.538265835908277] },
  { id: 'p-3', kind: 'parkolo', label: 'P', title: 'Ingyenes parkoló', coordinates: [47.39047451735447, 16.5484055499806] },
  { id: 'p-4', kind: 'parkolo', label: 'P', title: 'Ingyenes parkoló', coordinates: [47.38656629257321, 16.54791765154688] },
  { id: 'p-5', kind: 'parkolo', label: 'P', title: 'Ingyenes parkoló', coordinates: [47.38589023088786, 16.544062193404173] },
  { id: 'p-6', kind: 'parkolo', label: 'P', title: 'Ingyenes parkoló', coordinates: [47.385998421945224, 16.542923842045642] },
  { id: 'p-7', kind: 'parkolo', label: 'P', title: 'Ingyenes parkoló', coordinates: [47.38157449569936, 16.54469077512198] },
  { id: 'p-8', kind: 'parkolo', label: 'P', title: 'Ingyenes parkoló', coordinates: [47.380297577149314, 16.553839407313436] },
];

/** A szervezők saját megfogalmazása a parkolásról. Ezt nem írjuk át, idézzük. */
export const PARKING_NOTICE =
  'A parkolás szombaton és vasárnap ingyenes, de a megnövekedett ' +
  'vendégforgalom miatt kérjük, használják a város peremterületén található ' +
  'bevásárlóközpontok parkolóit és a volt strand (Strandsétány vége) előtti ' +
  'parkolót.';

/** Légvonalbeli távolság méterben. A gyaloglás ennél hosszabb, de a sorrend jó. */
export const metresFromCentre = (coordinates) => {
  const [lat, lon] = coordinates;
  const [clat, clon] = FESTIVAL_CENTRE;
  const dLat = ((lat - clat) * Math.PI * 6371000) / 180;
  const dLon = ((lon - clon) * Math.PI * 6371000 * Math.cos((clat * Math.PI) / 180)) / 180;
  return Math.sqrt(dLat * dLat + dLon * dLon);
};

/** "450 m" vagy "1,6 km" — ahogy egy ember mondaná. */
export const humanDistance = (metres) =>
  metres < 950
    ? Math.round(metres / 10) * 10 + ' m'
    : (metres / 1000).toFixed(1).replace('.', ',') + ' km';

export const poisOfKind = (kind) => POINTS_OF_INTEREST.filter((p) => p.kind === kind);

/**
 * A helyszínek összegzése a tájékoztatóhoz, cím szerint csoportosítva.
 *
 * Szándékosan számolt érték és nem kézzel írt lista: ha egy pont bejön vagy
 * kiesik, a tájékoztató magatól követi. Kézzel írt szám előbb-utóbb hazudna,
 * és egy hibás szám miatt joggal kérnék számon minket.
 */
export const poiSummary = () => {
  const order = [];
  const byTitle = new Map();
  for (const poi of POINTS_OF_INTEREST) {
    if (!byTitle.has(poi.title)) {
      byTitle.set(poi.title, { title: poi.title, kind: poi.kind, count: 0, hints: [] });
      order.push(poi.title);
    }
    const row = byTitle.get(poi.title);
    row.count += 1;
    if (poi.hint && !row.hints.includes(poi.hint)) row.hints.push(poi.hint);
  }
  return order.map((t) => byTitle.get(t));
};

/** A legközelebbi és a legtávolabbi parkoló távolsága — ezt írjuk a tájékoztatóba. */
export const parkingRange = () => {
  const d = poisOfKind('parkolo').map((p) => metresFromCentre(p.coordinates));
  if (d.length === 0) return null;
  return { count: d.length, nearest: Math.min(...d), farthest: Math.max(...d) };
};

/**
 * Útvonaltervező link. A telefon a saját navigációs appjában nyitja meg, így a
 * látogató egy koppintással elindul — nem kell címet másolnia.
 */
export const directionsUrl = (coordinates) =>
  'https://www.google.com/maps/dir/?api=1&destination=' + coordinates[0] + ',' + coordinates[1];
