import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Heart, ChevronRight, Map, Calendar } from 'lucide-react';

export default function CompactExhibitorCard({ exhibitor, onOpenDetails }) {
  const { favoriteExhibitorIds, toggleFavoriteExhibitor, focusExhibitorOnMap } = useOrsolya();
  const isFavorite = favoriteExhibitorIds.includes(exhibitor.id);
  const dayLabel = exhibitor.days === 'saturday' ? 'Szombat' : exhibitor.days === 'sunday' ? 'Vasárnap' : 'Mindkét nap';

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
