/**
 * Parkolás a vásár két napján.
 *
 * A szervezők kiemelt kérése, szó szerint: a parkolás ingyenes, de a belváros
 * tele lesz, ezért a város peremén kell hagyni az autót. A látogató ezt még
 * INDULÁS ELŐTT akarja tudni, nem akkor, amikor már harmadszor körözi a Fő teret.
 *
 * A `coordinates` addig null, amíg a szervezőtől meg nem jön a pontos pont.
 * Koordináta nélküli parkoló a térképen NEM jelenik meg — csak a szöveges
 * listában. Ez szándékos: egy rossz helyre tett parkoló-pin rosszabb, mint a
 * semmi, mert a látogató elhiszi és odamegy.
 *
 * Új parkoló felvétele: egy sor ide, [szélesség, hosszúság] formában, ahogy a
 * telefon adja. A térkép és a tájékoztató magától átveszi.
 */

/** A szervezők saját megfogalmazása. Ezt nem írjuk át, csak idézzük. */
export const PARKING_NOTICE =
  'A parkolás szombaton és vasárnap ingyenes, de a megnövekedett ' +
  'vendégforgalom miatt kérjük, használják a város peremterületén található ' +
  'bevásárlóközpontok parkolóit és a volt strand (Strandsétány vége) előtti ' +
  'parkolót.';

export const PARKING_LOTS = [
  {
    id: 'volt-strand',
    name: 'Volt strand előtti parkoló',
    hint: 'A Strandsétány végén',
    coordinates: null,
  },
  {
    id: 'bevasarlokozpontok',
    name: 'Bevásárlóközpontok parkolói',
    hint: 'A város peremterületén',
    coordinates: null,
  },
];

/** Csak azok, amiknek van valódi pontjuk — ezek kerülnek a térképre. */
export const mappedParkingLots = () =>
  PARKING_LOTS.filter((p) => Array.isArray(p.coordinates) && p.coordinates.length === 2);

/**
 * Útvonaltervező link. A telefon a saját navigációs appjában nyitja meg, így a
 * látogató egy koppintással elindul — nem kell címet másolnia.
 */
export const directionsUrl = (coordinates) =>
  `https://www.google.com/maps/dir/?api=1&destination=${coordinates[0]},${coordinates[1]}`;
