import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { MapPin, Utensils, Heart, ChevronRight, ThumbsUp, Map, CupSoda } from 'lucide-react';

export default function CompactExhibitorCard({ exhibitor, items, onOpenDetails }) {
  const { favoriteExhibitorIds, toggleFavoriteExhibitor, votedItemIds, voteForItem, focusExhibitorOnMap } = useOrsolya();
  const isFavorite = favoriteExhibitorIds.includes(exhibitor.id);

  return (
    <div className="bg-white border-2 border-stone-200 hover:border-stone-900 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group">
      {/* Top Bar: Location Badge, Drinks Badge & Favorite Toggle */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-white bg-stone-900 px-2.5 py-0.5 rounded-full border border-stone-950 inline-flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-amber-400" />
            <span className="truncate">{exhibitor.location.split('(')[0]}</span>
          </span>

          {exhibitor.hasDrinks && (
            <span className="text-[10px] font-black text-white bg-cyan-900 px-2 py-0.5 rounded-full border border-cyan-950 flex items-center gap-1">
              <CupSoda className="w-3 h-3 text-cyan-300" />
              <span>Ital kapható</span>
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteExhibitor(exhibitor.id);
          }}
          className={`p-1.5 rounded-full transition-all border ${
            isFavorite ? 'bg-rose-700 text-white border-rose-800' : 'bg-stone-100 text-stone-400 border-stone-200 hover:text-rose-600 hover:bg-rose-50'
          }`}
          title="Kedvencekhez adás"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white text-white' : ''}`} />
        </button>
      </div>

      {/* Image & Title */}
      <div onClick={() => onOpenDetails(exhibitor)} className="cursor-pointer space-y-2">
        {exhibitor.image && (
          <div className="h-36 rounded-xl overflow-hidden relative border border-stone-200">
            <img
              src={exhibitor.image}
              alt={exhibitor.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <div>
          <h3 className="font-black text-stone-950 text-base sm:text-lg leading-snug group-hover:text-amber-900 transition-colors line-clamp-1">
            {exhibitor.name}
          </h3>
          {exhibitor.offerings ? (
            <p className="text-xs font-black text-amber-950 line-clamp-1 mt-0.5">
              Kínálat: {exhibitor.offerings}
            </p>
          ) : exhibitor.story ? (
            <p className="text-xs text-stone-700 line-clamp-2 leading-relaxed font-bold mt-0.5">
              {exhibitor.story}
            </p>
          ) : null}
        </div>
      </div>

      {/* Dishes preview */}
      {items.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-stone-200">
          {items.slice(0, 2).map((item) => {
            const isVoted = votedItemIds.includes(item.id);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs bg-stone-100/80 p-2 rounded-xl border border-stone-300 gap-2"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-black text-stone-950 truncate block">{item.name}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    voteForItem(item.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-black text-[10px] transition-all flex items-center gap-1 border flex-shrink-0 ${
                    isVoted
                      ? 'bg-emerald-800 text-white border-emerald-900'
                      : 'bg-amber-900 hover:bg-amber-950 text-white border-amber-950 shadow-2xs'
                  }`}
                >
                  <ThumbsUp className={`w-3 h-3 ${isVoted ? 'fill-white' : 'text-amber-200'}`} />
                  <span>{item.votes || 0}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => focusExhibitorOnMap(exhibitor.id)}
          className="py-2 px-2 text-center text-xs font-black text-white bg-stone-900 hover:bg-black rounded-xl transition-all flex items-center justify-center gap-1 border border-stone-950 shadow-2xs"
        >
          <Map className="w-3.5 h-3.5 text-amber-400" />
          <span>Térkép</span>
        </button>

        <button
          onClick={() => onOpenDetails(exhibitor)}
          className="py-2 px-2 text-center text-xs font-black text-stone-900 bg-white hover:bg-stone-100 rounded-xl transition-all flex items-center justify-center gap-1 border border-stone-300 shadow-2xs"
        >
          <span>Részletek</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
