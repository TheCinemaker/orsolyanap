import React from 'react';
import { Megaphone } from 'lucide-react';
import { useOrsolya } from '../context/OrsolyaContext';

/**
 * „Élő a standokról" — amit a standosok épp most írtak be.
 *
 * A standos felületen van egy „Élő üzenet" mező (az `exhibitors.notice`
 * oszlop), amibe olyan dolgok mennek, hogy „a marhapörkölt frissen rotyog,
 * várható elkészülés 12:45". Ez eddig EGYETLEN helyen sem jelent meg a
 * látogatónak: az `ExhibitorCard.jsx` kiírta volna, de azt a komponenst
 * semmi nem importálja — a feed a `CompactExhibitorCard`-ot használja. A
 * stand tehát beírta, mentette, és soha senki nem látta.
 *
 * Ezért kap saját helyet a főlap tetején, a standlista előtt. Az
 * `exhibitors` tábla realtime, tehát a mentés után azonnal itt van, minden
 * telefonon, újratöltés nélkül.
 *
 * Nem jelenik meg, ha egy stand sem írt semmit — üres „élő" blokk rosszabb,
 * mint a semmi, mert elhasználja a bizalmat.
 */
export default function EloUzenetek({ onOpenDetails }) {
  const { exhibitors } = useOrsolya();

  const uzenetek = exhibitors.filter((x) => x.notice?.trim?.());
  if (uzenetek.length === 0) return null;

  return (
    <section className="bg-white border border-amber-300/80 rounded-md overflow-hidden shadow-xs">
      <h2 className="px-3 py-2 bg-amber-50 border-b border-amber-200 text-[11px] font-black uppercase tracking-widest text-amber-950 flex items-center gap-2">
        <Megaphone className="w-3.5 h-3.5 text-amber-800" />
        <span>Élő a standokról</span>
        {/* A pulzáló pont jelzi, hogy ez most van, nem egy hete beírt szöveg. */}
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inline-flex w-full h-full rounded-full bg-rose-500 opacity-70 animate-ping" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-rose-600" />
        </span>
        <span className="ml-auto font-bold text-amber-800/80 tracking-normal normal-case">
          {uzenetek.length} stand
        </span>
      </h2>

      <ul className="divide-y divide-stone-100">
        {uzenetek.map((x) => (
          <li key={x.id}>
            <button
              onClick={() => onOpenDetails?.(x)}
              className="w-full text-left px-3 py-2.5 hover:bg-amber-50/60 transition-colors cursor-pointer flex items-start gap-2.5"
            >
              {x.image ? (
                <img
                  src={x.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-8 h-8 rounded-md border border-stone-200 object-contain bg-white shrink-0"
                />
              ) : (
                <span className="w-8 h-8 rounded-md border border-stone-200 bg-stone-50 shrink-0" />
              )}
              <span className="min-w-0">
                <span className="block text-[11px] font-black text-stone-900 leading-tight">
                  {x.name}
                </span>
                <span className="block text-xs text-stone-700 font-medium leading-snug">
                  {x.notice}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
