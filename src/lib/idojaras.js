/**
 * Kőszegi időjárás a kiemet.hu két adatforrásából.
 *
 * Mindkettő kulcs nélkül, böngészőből hívható, ahogy a kiemet.hu is teszi:
 *   - a mostani érték a kőszegi mérőállomásról (smartmixin),
 *   - az előrejelzés az Open-Meteo-ból, a város koordinátáira.
 *
 * MIÉRT NEM TALÁLUNK KI SEMMIT: ha egy forrás nem válaszol, az a rész
 * egyszerűen kimarad. Egy szabadtéri vásáron a „ma nem esik" téves állítás
 * rosszabb, mint a hiányzó adat — a vendég esőkabát nélkül indul el.
 *
 * MIÉRT VAN GYORSÍTÓTÁR: egy forgalmas napon ezer telefon nyitja az appot.
 * Tíz percig a munkamenet tárolójából dolgozunk, így sem az állomást, sem az
 * Open-Meteót nem terheljük, és a vendég is azonnal látja az adatot.
 */
const ALLOMAS = 'https://api2.smartmixin.io/api/stations/72461/?refresh=1';
const ELOREJELZES =
  'https://api.open-meteo.com/v1/forecast?latitude=47.3971&longitude=16.546' +
  '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum' +
  '&timezone=Europe%2FBerlin';

const TAROLO = 'orsolya_idojaras';
const FRISS_MP = 10 * 60 * 1000;

/** Hat másodperc után elvágjuk: a vendég ne várjon egy akadó kérésre. */
async function keres(url, fejek) {
  const abort = new AbortController();
  const ido = setTimeout(() => abort.abort(), 6000);
  try {
    const r = await fetch(url, { headers: fejek, signal: abort.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(ido);
  }
}

/**
 * A mostani állapot szöveggel.
 *
 * Ugyanaz a logika, mint a kiemet.hu-ban: a mért csapadék és a páratartalom
 * alapján, mert az állomás nem ad leírást, csak számokat.
 */
function mostSzoveg(m) {
  const rr = m.RR_1H ?? m.RR ?? 0;
  const u = m.U ?? 50;
  if (rr > 1) return 'esik';
  if (rr > 0.1) return 'szemerkél';
  if (u > 90) return 'párás, ködös';
  if (u > 80) return 'borús';
  if (u > 60) return 'változóan felhős';
  if (u > 40) return 'kevés felhő';
  return 'tiszta idő';
}

/** WMO-kód -> rövid magyar szöveg és egy jelkulcs az ikonhoz. */
export function kodSzerint(kod) {
  if (kod === 0) return { szoveg: 'Tiszta', jel: 'nap' };
  if (kod === 1 || kod === 2) return { szoveg: 'Napos, kevés felhő', jel: 'napos' };
  if (kod === 3) return { szoveg: 'Felhős', jel: 'felho' };
  if (kod === 45 || kod === 48) return { szoveg: 'Ködös', jel: 'kod' };
  if (kod >= 51 && kod <= 57) return { szoveg: 'Szemerkélő eső', jel: 'szemerkel' };
  if (kod >= 61 && kod <= 67) return { szoveg: 'Esős', jel: 'eso' };
  if (kod >= 71 && kod <= 77) return { szoveg: 'Havazás', jel: 'ho' };
  if (kod >= 80 && kod <= 82) return { szoveg: 'Záporos', jel: 'eso' };
  if (kod >= 95) return { szoveg: 'Zivatar', jel: 'zivatar' };
  return { szoveg: '', jel: 'felho' };
}

/**
 * @param {string[]} napok a keresett napok ISO dátummal (a vásár két napja)
 * @returns {Promise<{most: object|null, napok: object[]}>}
 */
export async function idojaras(napok) {
  try {
    const mentett = JSON.parse(sessionStorage.getItem(TAROLO) || 'null');
    if (mentett && Date.now() - mentett.ido < FRISS_MP) return mentett.adat;
  } catch {
    // Nincs tároló: egyszerűen újra lekérjük.
  }

  // Egymástól függetlenül: ha az egyik elhasal, a másik megmarad.
  const [allomas, elore] = await Promise.allSettled([
    keres(ALLOMAS, { Accept: 'application/json', 'X-SmartMixin-Context': 'UI' }),
    keres(ELOREJELZES),
  ]);

  let most = null;
  if (allomas.status === 'fulfilled') {
    const m = allomas.value?.last_measure;
    if (m && typeof m.T === 'number') {
      most = { fok: Math.round(m.T), szoveg: mostSzoveg(m) };
    }
  }

  const lista = [];
  if (elore.status === 'fulfilled') {
    const d = elore.value?.daily;
    if (d?.time) {
      for (const nap of napok) {
        const i = d.time.indexOf(nap);
        if (i < 0) continue;
        lista.push({
          nap,
          kod: d.weathercode?.[i],
          max: Math.round(d.temperature_2m_max?.[i]),
          min: Math.round(d.temperature_2m_min?.[i]),
          csapadek: d.precipitation_sum?.[i] ?? 0,
        });
      }
    }
  }

  const adat = { most, napok: lista };
  try {
    sessionStorage.setItem(TAROLO, JSON.stringify({ ido: Date.now(), adat }));
  } catch {
    // Privát ablakban nincs tároló; működik nélküle is.
  }
  return adat;
}
