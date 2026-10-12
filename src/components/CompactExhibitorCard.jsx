import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Heart, ChevronRight, Map, Calendar, Flame } from 'lucide-react';
import { festivalDayToday, DAY_LABELS, DAY_SHORT } from '../data/napok';

export default function CompactExhibitorCard({ exhibitor, onOpenDetails }) {
  const { favoriteExhibitorIds, toggleFavoriteExhibitor, focusExhibitorOnMap, menuItems } = useOrsolya();
  const isFavorite = favoriteExhibitorIds.includes(exhibitor.id);
  const dayLabel = DAY_LABELS[exhibitor.days] || DAY_LABELS.both;

  /* Mit főznek aznap.
     A nap-specifikus fogás az, amit a stand CSAK szombaton vagy CSAK vasárnap
     ad -- a főzőversenyes étel. A "mindkét nap" tételek (sütemény, ital) nem
     tartoznak ide: azok a teljes kínálat, nem a napi fogás. Így a kártyán egy
     sor is elég, nem kell az egész étlapot megismételni.

     A vásár napjain "Ma" a felirat, azon kívül a két nap külön sorban, hogy
     előre is lehessen tervezni. */
  const todayKey = festivalDayToday();
  const dishesOn = (day) =>
    menuItems.filter((i) => i.exhibitor_id === exhibitor.id && !i.is_hidden && i.available_day === day);

  const dayRows = todayKey
    ? [{ key: todayKey, label: 'Ma', items: dishesOn(todayKey) }]
    : [
        { key: 'saturday', label: DAY_SHORT.saturday, items: dishesOn('saturday') },
        { key: 'sunday', label: DAY_SHORT.sunday, items: dishesOn('sunday') },
      ].filter((r) => r.items.length > 0);

  return (
    <article className="bg-white border border-stone-200/90 rounded-md p-2.5 sm:p-3 shadow-xs hover:border-amber-600/60 transition-colors flex flex-col relative group">
      <button onClick={() => onOpenDetails(exhibitor)} className="cursor-pointer text-center w-full" aria-label={exhibitor.name + ' részletei'}>
        <div className="w-full aspect-[4/3] rounded-md overflow-hidden border border-stone-200 bg-white flex items-center justify-center p-1.5 sm:p-2">
          {exhibitor.image ? (
            <img src={exhibitor.image} alt="" loading="lazy" decoding="async" width="800" height="600" className="w-full h-full object-contain" />
          ) : (
            <div className="text-stone-300 text-3xl font-black">•</div>
          )}
        </div>
        <h3 className="mt-2 font-black text-stone-900 text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-amber-800 transition-colors">{exhibitor.name}</h3>
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-2">
        <span className="text-[9px] sm:text-[10px] font-bold text-stone-600 bg-stone-100 px-1.5 py-1 rounded-md border border-stone-200 inline-flex items-center gap-1">
          <Calendar className="w-2.5 h-2.5 text-stone-500" />
          <span>{dayLabel}</span>
        </span>
      </div>

      {dayRows.length > 0 && (
        <div className="mt-2 pt-2 border-t border-stone-100 space-y-1">
          {dayRows.map((row) => (
            <div key={row.key} className="flex items-start gap-1.5 text-left">
              <span className="shrink-0 mt-px text-[9px] font-black uppercase tracking-wide text-amber-900 bg-amber-100 border border-amber-200 rounded px-1 py-0.5 inline-flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 text-amber-700" />
                {row.label}
              </span>
              <span className="text-[11px] font-bold text-stone-700 leading-snug">
                {row.items.length > 0 ? row.items.map((i) => i.name).join(', ') : 'Nem főznek'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-stone-100">
        <button onClick={() => focusExhibitorOnMap(exhibitor.id)} className="h-9 px-1 text-[10px] sm:text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors flex items-center justify-center gap-1 border border-amber-300/80" title="Megtekintés a térképen">
          <Map className="w-3.5 h-3.5" /><span>Térkép</span>
        </button>
        <button onClick={() => toggleFavoriteExhibitor(exhibitor.id)} className={'h-9 px-1 text-[10px] sm:text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1 border ' + (isFavorite ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200')} title={isFavorite ? 'Eltávolítás a kedvencekből' : 'Stand a kedvencekhez'}>
          <Heart className={'w-3.5 h-3.5 ' + (isFavorite ? 'fill-rose-700 text-rose-700' : 'text-stone-400')} /><span>Kedvenc</span>
        </button>
        <button onClick={() => onOpenDetails(exhibitor)} className="h-9 px-1 text-[10px] sm:text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors flex items-center justify-center gap-0.5 border border-stone-200" title="Stand részletei">
          <span>Részletek</span><ChevronRight className="w-3.5 h-3.5 text-stone-500" />
        </button>
      </div>
    </article>
  );
}
