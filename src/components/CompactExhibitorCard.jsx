import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { MapPin, Utensils, Heart, ChevronRight, ThumbsUp, Map, CupSoda } from 'lucide-react';

export default function CompactExhibitorCard({ exhibitor, items, onOpenDetails }) {
  const { favoriteExhibitorIds, toggleFavoriteExhibitor, votedItemIds, voteForItem, focusExhibitorOnMap } = useOrsolya();
  const isFavorite = favoriteExhibitorIds.includes(exhibitor.id);

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs hover:border-amber-600/60 transition-all flex flex-col justify-between space-y-3 relative group">
      {/* Top Bar: Location Badge, Drinks Badge & Favorite Toggle */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/60 inline-flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-amber-700" />
            <span className="truncate">{exhibitor.location.split('(')[0]}</span>
          </span>

          {exhibitor.hasDrinks && (
            <span className="text-[10px] font-extrabold text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded-full border border-cyan-300 flex items-center gap-1">
              <span>🥤 Ital kapható</span>
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteExhibitor(exhibitor.id);
          }}
          className={`p-1.5 rounded-full transition-all ${
            isFavorite ? 'bg-rose-100 text-rose-700' : 'text-stone-300 hover:text-rose-600'
          }`}
          title="Kedvencekhez adás"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-700 text-rose-700' : ''}`} />
        </button>
      </div>

      {/* Image & Title */}
      <div onClick={() => onOpenDetails(exhibitor)} className="cursor-pointer space-y-2">
        {exhibitor.image && (
          <div className="h-36 rounded-xl overflow-hidden relative">
            <img
              src={exhibitor.image}
              alt={exhibitor.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <div>
          <h3 className="font-extrabold text-stone-900 text-base sm:text-lg leading-snug group-hover:text-amber-800 transition-colors line-clamp-1">
            {exhibitor.name}
          </h3>
          {exhibitor.offerings ? (
            <p className="text-xs font-bold text-amber-900 line-clamp-1 mt-0.5">
              Kínálat: {exhibitor.offerings}
            </p>
          ) : exhibitor.story ? (
            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed font-medium mt-0.5">
              {exhibitor.story}
            </p>
          ) : null}
        </div>
      </div>

      {/* Dishes preview */}
      {items.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-stone-100">
          {items.slice(0, 2).map((item) => {
            const isVoted = votedItemIds.includes(item.id);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs bg-stone-50 p-2 rounded-xl border border-stone-100 gap-2"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-stone-800 truncate block">{item.name}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    voteForItem(item.id);
                  }}
                  className={`px-2 py-1 rounded-lg font-extrabold text-[10px] transition-all flex items-center gap-1 border flex-shrink-0 ${
                    isVoted
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                  }`}
                >
                  <ThumbsUp className={`w-3 h-3 ${isVoted ? 'fill-white' : 'text-amber-800'}`} />
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
          className="py-1.5 px-2 text-center text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-all flex items-center justify-center gap-1 border border-amber-300/80"
        >
          <Map className="w-3.5 h-3.5 text-amber-800" />
          <span>📍 Térkép</span>
        </button>

        <button
          onClick={() => onOpenDetails(exhibitor)}
          className="py-1.5 px-2 text-center text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-all flex items-center justify-center gap-1"
        >
          <span>Részletek</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
