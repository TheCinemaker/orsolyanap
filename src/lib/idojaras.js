/**
 * Kőszegi időjárás: mostani állapot és a vásár két napja.
 *
 * MIÉRT AZ OPEN-METEO ÉS NEM A KŐSZEGI MÉRŐÁLLOMÁS:
 * a kiemet.hu a `api2.smartmixin.io` állomást is használja, de a SAJÁT
 * Netlify-függvényén keresztül. Az állomás ugyanis egyetlen CORS-fejlécet sem
 * küld — sem a mi címünkre, sem a kiemet.hu-ra —, tehát böngészőből nem
 * hívható: a kérés elindul, és a böngésző dobja el a választ. Ez az app
 * statikus hosting, szerveroldali kód nélkül, tehát nincs mibe proxyt tenni.
 *
 * Az Open-Meteo `access-control-allow-origin: *`-ot küld, kulcsot nem kér, és
 * ugyanarra a koordinátára (47.3971, 16.546) ad adatot. Egy kérésben jön a
 * mostani érték és a napi előrejelzés is.
 *
 * MIÉRT NEM TALÁLUNK KI SEMMIT: ha a kérés nem sikerül, a kártya nem jelenik
 * meg. Egy szabadtéri vásáron a téves „ma nem esik" rosszabb, mint a hiányzó
 * adat — a vendég esőkabát nélkül indul el.
 *
 * MIÉRT VAN GYORSÍTÓTÁR: egy forgalmas napon ezer telefon nyitja az appot.
 * Tíz percig a munkamenet tárolójából dolgozunk.
 */
const URL_IDOJARAS =
  'https://api.open-meteo.com/v1/forecast?latitude=47.3971&longitude=16.546' +
  '&current=temperature_2m,relative_humidity_2m,precipitation,weather_code' +
  '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum' +
  '&timezone=Europe%2FBerlin';

const TAROLO = 'orsolya_idojaras';
const FRISS_MP = 10 * 60 * 1000;

/** Hat másodperc után elvágjuk: a vendég ne várjon egy akadó kérésre. */
async function keres(url) {
  const abort = new AbortController();
  const ido = setTimeout(() => abort.abort(), 6000);
  try {
    const r = await fetch(url, { signal: abort.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(ido);
  }
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

/** A mostani állapot két szóban. Az eső erősebb jel, mint a felhőzet. */
function mostSzoveg(c) {
  if ((c.precipitation ?? 0) > 1) return 'esik';
  if ((c.precipitation ?? 0) > 0.1) return 'szemerkél';
  return kodSzerint(c.weather_code).szoveg.toLowerCase();
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

  const d = await keres(URL_IDOJARAS);

  let most = null;
  if (typeof d?.current?.temperature_2m === 'number') {
    most = { fok: Math.round(d.current.temperature_2m), szoveg: mostSzoveg(d.current) };
  }

  const lista = [];
  const n = d?.daily;
  if (n?.time) {
    for (const nap of napok) {
      const i = n.time.indexOf(nap);
      if (i < 0) continue;
      lista.push({
        nap,
        kod: n.weathercode?.[i],
        max: Math.round(n.temperature_2m_max?.[i]),
        min: Math.round(n.temperature_2m_min?.[i]),
        csapadek: n.precipitation_sum?.[i] ?? 0,
      });
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
