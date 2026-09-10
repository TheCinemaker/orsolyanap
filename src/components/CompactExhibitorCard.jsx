import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { MapPin, Heart, ChevronRight, ThumbsUp, Map, CupSoda, Calendar } from 'lucide-react';

export default function CompactExhibitorCard({ exhibitor, items, onOpenDetails }) {
  const { favoriteExhibitorIds, toggleFavoriteExhibitor, votedItemIds, voteForItem, focusExhibitorOnMap } = useOrsolya();
  const isFavorite = favoriteExhibitorIds.includes(exhibitor.id);

  const dayLabel = exhibitor.days === 'saturday' ? 'Szombat' : exhibitor.days === 'sunday' ? 'Vasárnap' : 'Mindkét nap';

  return (
    <div className="bg-white border border-stone-200/90 rounded-md p-4 shadow-xs hover:border-amber-600/60 transition-all flex flex-col justify-between space-y-3 relative group">
      <div>
        {/* 7.1 Exhibitor Name Centered at Top */}
        <div onClick={() => onOpenDetails(exhibitor)} className="cursor-pointer text-center space-y-2">
          <h3 className="font-black text-stone-900 text-base sm:text-lg leading-snug group-hover:text-amber-800 transition-colors line-clamp-2 text-center">
            {exhibitor.name}
          </h3>

          {/* 7.2 Logo / Image Centered Under Name */}
          {exhibitor.image && (
            <div className="w-full aspect-video rounded-md overflow-hidden relative border border-stone-200 bg-stone-950 flex items-center justify-center mx-auto">
              <img
                src={exhibitor.image}
                alt={exhibitor.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
        </div>

        {/* 7.3 Pills (3 Pills under logo, sharper rounded-md corners) */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap mt-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100/90 px-2 py-1 rounded-md border border-amber-300/80 inline-flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-amber-700" />
            <span className="truncate">{exhibitor.location.split('(')[0]}</span>
          </span>

          <span className="text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-1 rounded-md border border-stone-200 inline-flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5 text-stone-500" />
            <span>{dayLabel}</span>
          </span>

          {exhibitor.hasDrinks && (
            <span className="text-[10px] font-extrabold text-cyan-900 bg-cyan-100 px-2 py-1 rounded-md border border-cyan-300 inline-flex items-center gap-1">
              <CupSoda className="w-2.5 h-2.5 text-cyan-800" />
              <span>Ital</span>
            </span>
          )}
        </div>

        {/* 7.4 Dish List with reduced vertical spacing */}
        {items.length > 0 && (
          <div className="space-y-1 pt-2.5 mt-2.5 border-t border-stone-100">
            {items.slice(0, 4).map((item) => {
              const isVoted = votedItemIds.includes(item.id);
              const isSoldOut = item.status === 'sold_out';

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between text-xs px-2 py-1 rounded-md border gap-1.5 transition-all ${
                    isSoldOut ? 'bg-stone-200 border-stone-300 opacity-80 grayscale' : 'bg-stone-50 border-stone-100'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-stone-800 truncate block text-[11px]">{item.name}</span>
                  </div>

                  <button
                    disabled={isSoldOut}
                    onClick={(e) => {
                      e.stopPropagation();
                      voteForItem(item.id);
                    }}
                    className={`px-1.5 py-0.5 rounded-md font-extrabold text-[10px] transition-all flex items-center gap-1 border flex-shrink-0 ${
                      isSoldOut
                        ? 'bg-stone-200 text-stone-400 border-stone-300'
                        : isVoted
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                    }`}
                  >
                    <ThumbsUp className={`w-2.5 h-2.5 ${isVoted ? 'fill-white' : 'text-amber-800'}`} />
                    <span>{item.votes || 0}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7.5 Bottom Action Button Row: Térkép | Szívecske | Részletek */}
      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-stone-100">
        {/* Térkép */}
        <button
          onClick={() => focusExhibitorOnMap(exhibitor.id)}
          className="py-1.5 px-1 text-center text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md transition-all flex items-center justify-center gap-1 border border-amber-300/80"
          title="Megtekintés a térképen"
        >
          <Map className="w-3.5 h-3.5 text-amber-800" />
          <span className="hidden xs:inline">Térkép</span>
        </button>

        {/* Szívecske */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteExhibitor(exhibitor.id);
          }}
          className={`py-1.5 px-1 text-center text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 border ${
            isFavorite
              ? 'bg-rose-100 text-rose-800 border-rose-300'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
          }`}
          title="Kedvenc kiállító hozzáadása"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-700 text-rose-700' : 'text-stone-400'}`} />
          <span className="hidden xs:inline">Kedvenc</span>
        </button>

        {/* Részletek */}
        <button
          onClick={() => onOpenDetails(exhibitor)}
          className="py-1.5 px-1 text-center text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-md transition-all flex items-center justify-center gap-0.5 border border-stone-200"
          title="Kiállító részletei"
        >
          <span>Részletek</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
        </button>
      </div>
    </div>
  );
}
