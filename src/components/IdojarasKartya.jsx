import React, { useEffect, useState } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  ArrowUpRight,
  Droplets,
} from 'lucide-react';
import { idojaras, kodSzerint } from '../lib/idojaras';

/**
 * Kőszegi időjárás a vásár két napjára.
 *
 * Nem reklámcsík: az adat a kiemet.hu forrásaiból jön (kőszegi mérőállomás +
 * Open-Meteo), tehát azt mondja el, amit a látogató tényleg kérdez — kabát
 * kell-e, esik-e. A link a részletekhez vezet, új lapon.
 *
 * Ha egyik forrás sem válaszol, a kártya NEM JELENIK MEG. Üres vagy kitalált
 * adat helyett inkább semmi: a fejlécben ott a közvetlen link.
 */
const IKON = {
  nap: Sun,
  napos: CloudSun,
  felho: Cloud,
  kod: CloudFog,
  szemerkel: CloudDrizzle,
  eso: CloudRain,
  ho: CloudSnow,
  zivatar: CloudLightning,
};

/* A vásár két napja. Fix dátum, mert ez a kártya erre a rendezvényre szól. */
const NAPOK = ['2026-10-17', '2026-10-18'];
const NAP_NEVE = { '2026-10-17': 'Szombat', '2026-10-18': 'Vasárnap' };

export default function IdojarasKartya() {
  const [adat, setAdat] = useState(null);

  useEffect(() => {
    let el = true;
    idojaras(NAPOK)
      .then((a) => {
        if (el) setAdat(a);
      })
      .catch(() => {
        // Nincs adat: a kártya kimarad, a fejléc linkje megmarad.
      });
    return () => {
      el = false;
    };
  }, []);

  if (!adat || (!adat.most && adat.napok.length === 0)) return null;

  return (
    <a
      href="https://kiemet.hu"
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white border border-sky-300/80 rounded-md overflow-hidden shadow-xs hover:border-sky-500 transition-colors"
    >
      <div className="flex items-stretch">
        {/* Most, Kőszegen */}
        {adat.most && (
          <div className="shrink-0 px-2.5 py-2 bg-gradient-to-br from-sky-50 to-sky-100 border-r border-sky-200 flex flex-col justify-center items-center min-w-[74px]">
            <span className="text-[8px] font-black uppercase tracking-widest text-sky-800/70 leading-none">
              Most
            </span>
            <span className="text-xl font-black text-sky-950 leading-tight">
              {adat.most.fok}°
            </span>
            <span className="text-[9px] font-bold text-sky-800 leading-none text-center">
              {adat.most.szoveg}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1 px-3 py-1.5 flex flex-col justify-center gap-0.5">
          {adat.napok.map((n) => {
            const { szoveg, jel } = kodSzerint(n.kod);
            const Ikon = IKON[jel] || Cloud;
            return (
              <div key={n.nap} className="flex items-center gap-1.5 text-[11px]">
                <Ikon className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                <span className="font-extrabold text-stone-900 w-[58px] shrink-0">
                  {NAP_NEVE[n.nap]}
                </span>
                <span className="font-bold text-stone-900 shrink-0">
                  {n.min}–{n.max}°
                </span>
                <span className="text-stone-600 font-medium truncate">{szoveg}</span>
                {/* A csapadékot csak akkor írjuk ki, ha van: a „0 mm" csak
                    elvonná a figyelmet a két hőmérsékletről. */}
                {n.csapadek > 0.1 && (
                  <span className="ml-auto shrink-0 inline-flex items-center gap-0.5 text-[10px] font-extrabold text-sky-800">
                    <Droplets className="w-3 h-3" />
                    {n.csapadek.toFixed(1)} mm
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* A forrás neve és a nyíl: ennyi elég ahhoz, hogy látsszon, hova
            visz. A hosszú „részletes előrejelzés, radar, webkamerák" sor egy
            külön sort vitt el a lap tetejéről. */}
        <div className="shrink-0 pl-2 pr-3 flex items-center">
          <span className="text-[11px] font-extrabold text-sky-800 group-hover:text-sky-900 inline-flex items-center gap-0.5 whitespace-nowrap">
            kiemet.hu
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </a>
  );
}
