import React, { useEffect, useState } from 'react';
import { Crosshair, Check, X, MapPin, Loader2, Upload, AlertTriangle, Keyboard } from 'lucide-react';
import { useOrsolya } from '../../context/OrsolyaContext';
import { useScrollLock } from '../../hooks/useScrollLock';

/**
 * Koordináta-felvétel a helyszínen, a telefon GPS-éből.
 *
 * MIÉRT: 31 stand térkép-pinje becsült. Az eddigi út az volt, hogy valaki
 * sátortól sátorig megy, a Google Maps-ből kimásolja a koordinátát, beírja
 * egy jegyzetbe a stand nevével, a fájlt átviszi a gépre, és lefuttat egy
 * szkriptet. Ez 31-szer öt lépés, zajban, egy kézzel, fél szemmel.
 *
 * Itt egy lépés: odaállsz a sátorhoz, és rákoppintasz a nevére.
 *
 * MIÉRT NEM EGY MÉRÉS: a telefon első GPS-válasza gyakran 30-50 méteres
 * pontosságú, és utána javul. Ezért hat másodpercig figyelünk, a legjobb
 * pontosságú olvasatot tartjuk meg, és korán megállunk, ha már 8 méter
 * alatti. A 25 méternél pontatlanabbat nem írjuk be: az átvinné a látogatót
 * a szomszéd sátorhoz, és az rosszabb, mint a becsült pin.
 *
 * MIÉRT VAN VÁRÓLISTA: a vásárban szakadozik a mobilnet. A bemért pont
 * először a készülékre kerül, és onnan megy fel; ha nincs hálózat, megvár.
 * Enélkül a mérés elveszett volna, és oda kellene menni újra.
 */
const VARO = 'orsolya_koordinata_varolista';

/* Kőszeg határai. Ugyanaz, mint a koordinatak.mjs-ben: ez fogja meg a
   felcserélt szélesség/hosszúságot és a szemetet. */
const KOSZEG = { latMin: 47.36, latMax: 47.41, lonMin: 16.51, lonMax: 16.57 };
const koszegben = (lat, lon) =>
  lat >= KOSZEG.latMin && lat <= KOSZEG.latMax && lon >= KOSZEG.lonMin && lon <= KOSZEG.lonMax;

/** Bemért vagy becsült? A tizedesjegyek száma dönti el, mint a szkriptben. */
const valodiGps = (c) => {
  if (!Array.isArray(c) || c.length !== 2) return false;
  const jegyek = (n) => (String(n).split('.')[1] || '').length;
  return Math.min(jegyek(c[0]), jegyek(c[1])) >= 6;
};

const olvasVaro = () => {
  try {
    return JSON.parse(localStorage.getItem(VARO) || '[]');
  } catch {
    return [];
  }
};
const irVaro = (lista) => {
  try {
    localStorage.setItem(VARO, JSON.stringify(lista));
  } catch {
    // Tároló nélkül is működik, csak a hálózat nélküli mérés nem vár meg.
  }
};

export default function KoordinataFelvetel({ onClose }) {
  const { exhibitors, mentCoordinatat, showToast } = useOrsolya();
  const [meres, setMeres] = useState(null); // melyik stand mérése fut
  const [allapot, setAllapot] = useState(null); // { pontossag, masodperc }
  const [varo, setVaro] = useState(olvasVaro);
  const [kezi, setKezi] = useState(null); // melyik standhoz írunk kézzel
  const [keziSzoveg, setKeziSzoveg] = useState('');

  useScrollLock(true);

  /* A várólista ürítése, amint van hálózat. Minden mérés után is
     megpróbáljuk, mert akkor biztosan él a kapcsolat. */
  const uritVaro = React.useCallback(async () => {
    const lista = olvasVaro();
    if (lista.length === 0) return;
    const maradek = [];
    for (const t of lista) {
      const ok = await mentCoordinatat(t.id, t.coords);
      if (!ok) maradek.push(t);
    }
    irVaro(maradek);
    setVaro(maradek);
    if (maradek.length === 0 && lista.length > 0) {
      showToast(`${lista.length} várakozó pont feltöltve.`, 'success');
    }
  }, [mentCoordinatat, showToast]);

  useEffect(() => {
    uritVaro();
    window.addEventListener('online', uritVaro);
    return () => window.removeEventListener('online', uritVaro);
  }, [uritVaro]);

  /** Hat másodperc figyelés, a legjobb olvasat nyer. */
  const mer = (stand) => {
    if (!navigator.geolocation) {
      showToast('Ez a böngésző nem ad GPS-t.', 'error');
      return;
    }
    setMeres(stand.id);
    setAllapot({ pontossag: null, masodperc: 6 });

    let legjobb = null;
    const kezdet = Date.now();

    const figyelo = navigator.geolocation.watchPosition(
      (pos) => {
        const p = pos.coords.accuracy;
        if (!legjobb || p < legjobb.accuracy) {
          legjobb = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: p };
        }
        setAllapot({
          pontossag: Math.round(legjobb.accuracy),
          masodperc: Math.max(0, 6 - Math.round((Date.now() - kezdet) / 1000)),
        });
        // Ennél pontosabbra nem kell várni: a sátrak 3 méterre vannak egymástól.
        if (legjobb.accuracy <= 8) befejez();
      },
      (err) => {
        befejez(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    const ora = setTimeout(() => befejez(), 6000);

    function befejez(err) {
      clearTimeout(ora);
      navigator.geolocation.clearWatch(figyelo);
      setMeres(null);
      setAllapot(null);

      if (!legjobb) {
        showToast(
          err?.code === 1
            ? 'A helymeghatározás le van tiltva. Engedélyezd a böngészőben.'
            : 'Nem jött GPS-jel. Állj ki a sátor elé, és próbáld újra.',
          'error'
        );
        return;
      }
      if (legjobb.accuracy > 25) {
        showToast(
          `Csak ${Math.round(legjobb.accuracy)} m pontos — ennyivel a szomszéd sátorhoz vinne. ` +
            'Várj pár másodpercet, és nyomd meg újra.',
          'error'
        );
        return;
      }
      if (!koszegben(legjobb.lat, legjobb.lon)) {
        showToast('A mért pont nem Kőszegen van. Nem írtam be.', 'error');
        return;
      }
      rogzit(stand, [legjobb.lat, legjobb.lon], Math.round(legjobb.accuracy));
    }
  };

  /**
   * Kézi beírás: beillesztett koordinátapárból.
   *
   * MIÉRT KELL A GPS MELLETT: nem mindig a sátor előtt állunk. Előfordul,
   * hogy a szervező egy térképről vagy egy üzenetből olvas be egy pontot,
   * este, a szállásról. Ugyanazt a három ellenőrzést futtatja, mint a
   * `koordinatak.mjs`: Kőszegen van-e, és elég pontos-e a szám.
   *
   * Bármilyen alakot elfogad, amiben két szám van — a Google Maps
   * „47.389831, 16.538930" formája is ilyen.
   */
  const keziMentes = async (stand) => {
    const szamok = String(keziSzoveg).match(/-?\d+[.,]\d+/g) || [];
    if (szamok.length < 2) {
      showToast('Két számot kérek, pl. 47.389831, 16.538930', 'error');
      return;
    }
    const [lat, lon] = szamok.slice(0, 2).map((n) => Number(n.replace(',', '.')));

    if (!koszegben(lat, lon)) {
      showToast('Ez a pont nem Kőszegen van. Nincs felcserélve a két szám?', 'error');
      return;
    }
    const jegyek = (n) => (String(n).split('.')[1] || '').length;
    if (Math.min(jegyek(lat), jegyek(lon)) < 6) {
      showToast('Hat tizedesjegynél pontatlanabb — így a sátorhoz kevés.', 'error');
      return;
    }

    setKezi(null);
    setKeziSzoveg('');
    await rogzit(stand, [lat, lon], null);
  };

  /** Mentés: előbb a hálózaton, és ha nem megy, a várólistára. */
  const rogzit = async (stand, coords, pontossag) => {
    const ok = await mentCoordinatat(stand.id, coords);
    if (ok) {
      showToast(
        pontossag === null
          ? `${stand.name}: beírva.`
          : `${stand.name}: bemérve, ${pontossag} m pontossággal.`,
        'success'
      );
      uritVaro();
      return;
    }
    const lista = [...olvasVaro().filter((t) => t.id !== stand.id), { id: stand.id, coords }];
    irVaro(lista);
    setVaro(lista);
    showToast('Nincs hálózat — a pont elmentve, feltöltöm, amint van.', 'info');
  };

  /* A még bemérendők elöl: ez a holnapi munka sorrendje. A bemérteket is
     mutatjuk, hogy látszódjon a haladás, és hogy újra lehessen mérni, ha
     valami félrement. */
  const lista = [...exhibitors].sort((a, b) => {
    const ka = valodiGps(a.coordinates) ? 1 : 0;
    const kb = valodiGps(b.coordinates) ? 1 : 0;
    if (ka !== kb) return ka - kb;
    return a.name.localeCompare(b.name, 'hu');
  });
  const kesz = lista.filter((x) => valodiGps(x.coordinates)).length;

  return (
    <div className="fixed inset-0 z-[60] bg-stone-100 flex flex-col">
      <div className="bg-amber-950 text-white px-3 py-2.5 flex items-center gap-2 shrink-0">
        <Crosshair className="w-5 h-5 text-amber-300 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black leading-tight">Koordináta-felvétel</p>
          <p className="text-[11px] text-amber-200 font-medium leading-tight">
            {kesz} / {lista.length} bemérve
            {varo.length > 0 && ` • ${varo.length} vár a feltöltésre`}
          </p>
        </div>
        {varo.length > 0 && (
          <button
            onClick={uritVaro}
            className="shrink-0 flex items-center gap-1 px-2.5 py-2 bg-amber-800 hover:bg-amber-700 rounded-md text-[11px] font-extrabold cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Feltöltés</span>
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Bezárás"
          className="shrink-0 p-2.5 -mr-1 text-amber-200 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="shrink-0 px-3 py-2 bg-amber-100 border-b border-amber-200 text-[11px] font-semibold text-amber-950 leading-snug">
        Állj a sátor elé, és koppints a nevére: pár másodpercig mér, aztán
        magától beírja. A 25 méternél pontatlanabbat nem fogadja el. Ha nem a
        helyszínen vagy, a billentyűzet ikonnal kézzel is beírhatod.
      </p>

      <div className="flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-1.5">
        {lista.map((x) => {
          const bemert = valodiGps(x.coordinates);
          const varakozik = varo.some((t) => t.id === x.id);
          const fut = meres === x.id;

          return (
            <div
              key={x.id}
              className={`rounded-md border transition-colors ${
                fut
                  ? 'bg-amber-100 border-amber-400'
                  : bemert
                  ? 'bg-white border-emerald-300'
                  : 'bg-white border-stone-300'
              }`}
            >
              <div className="flex items-center">
                <button
                  onClick={() => mer(x)}
                  disabled={Boolean(meres)}
                  className="min-w-0 flex-1 text-left px-3 py-3 flex items-center gap-2.5 cursor-pointer disabled:cursor-wait"
                >
                  <span className="shrink-0">
                    {fut ? (
                      <Loader2 className="w-5 h-5 text-amber-800 animate-spin" />
                    ) : varakozik ? (
                      <AlertTriangle className="w-5 h-5 text-amber-700" />
                    ) : bemert ? (
                      <Check className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <MapPin className="w-5 h-5 text-stone-400" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-stone-900 leading-tight">
                      {x.name}
                    </span>
                    <span className="block text-[11px] font-medium text-stone-500 leading-tight">
                      {fut
                        ? allapot?.pontossag
                          ? `mérés… ${allapot.pontossag} m (${allapot.masodperc} s)`
                          : 'GPS-jelre várok…'
                        : varakozik
                        ? 'bemérve, feltöltésre vár'
                        : bemert
                        ? `${x.coordinates[0].toFixed(6)}, ${x.coordinates[1].toFixed(6)}`
                        : 'becsült hely — ide kell állni és koppintani'}
                    </span>
                  </span>

                  {!fut && (
                    <span
                      className={`shrink-0 px-2.5 py-1.5 rounded-md text-[11px] font-extrabold ${
                        bemert
                          ? 'bg-stone-100 text-stone-600 border border-stone-200'
                          : 'bg-amber-900 text-white'
                      }`}
                    >
                      {bemert ? 'Újra' : 'Itt vagyok'}
                    </span>
                  )}
                </button>

                {/* Kézi beírás: ha nem a sátor előtt állsz. */}
                <button
                  onClick={() => {
                    setKezi(kezi === x.id ? null : x.id);
                    setKeziSzoveg(
                      bemert ? `${x.coordinates[0]}, ${x.coordinates[1]}` : ''
                    );
                  }}
                  title="Beírom kézzel"
                  aria-label="Koordináta beírása kézzel"
                  className={`shrink-0 p-3 cursor-pointer ${
                    kezi === x.id ? 'text-amber-900' : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <Keyboard className="w-5 h-5" />
                </button>
              </div>

              {kezi === x.id && (
                <div className="px-3 pb-3 pt-0 flex items-start gap-1.5">
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={keziSzoveg}
                    onChange={(e) => setKeziSzoveg(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') keziMentes(x);
                      if (e.key === 'Escape') setKezi(null);
                    }}
                    placeholder="47.389831, 16.538930"
                    className="flex-1 min-w-0 px-2.5 py-2 bg-stone-50 border border-amber-400 rounded-md text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    onClick={() => keziMentes(x)}
                    className="shrink-0 px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-extrabold rounded-md cursor-pointer"
                  >
                    Beírom
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
