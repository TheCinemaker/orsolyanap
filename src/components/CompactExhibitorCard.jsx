import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { MapPin, Utensils, Heart, ChevronRight, ThumbsUp, CheckCircle2 } from 'lucide-react';

export default function CompactExhibitorCard({ exhibitor, items, onOpenDetails }) {
  const { favoriteExhibitorIds, toggleFavoriteExhibitor, votedItemIds, voteForItem } = useOrsolya();
  const isFavorite = favoriteExhibitorIds.includes(exhibitor.id);

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-3 relative group">
      {/* Top Bar: Location Badge & Favorite Toggle */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/60 inline-flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 text-amber-700" />
          <span className="truncate">{exhibitor.location.split('(')[0]}</span>
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteExhibitor(exhibitor.id);
          }}
          className={`p-1 rounded-full transition-all ${
            isFavorite ? 'bg-rose-100 text-rose-700' : 'text-stone-300 hover:text-stone-500'
          }`}
          title="Kedvencekhez adás"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-700' : ''}`} />
        </button>
      </div>

      {/* Title & Story */}
      <div onClick={() => onOpenDetails(exhibitor)} className="cursor-pointer space-y-1">
        <h3 className="font-extrabold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-amber-800 transition-colors line-clamp-1">
          {exhibitor.name}
        </h3>
        {exhibitor.story && (
          <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed font-medium">
            {exhibitor.story}
          </p>
        )}
      </div>

      {/* Dishes preview (Up to 2 items) */}
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
                <span className="text-[10px] text-amber-800 font-semibold">Adományos kóstolás</span>
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

      {/* Bottom Action Footer */}
      <button
        onClick={() => onOpenDetails(exhibitor)}
        className="w-full py-1.5 text-center text-[11px] font-bold text-stone-600 hover:text-amber-800 transition-colors flex items-center justify-center gap-1 bg-stone-100 hover:bg-stone-200/80 rounded-xl"
      >
        <span>Stand adatlapja & ételek ({items.length})</span>
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}
