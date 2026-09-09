import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Flame, Clock, ThumbsUp, Check, Heart, Trophy, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MenuItemCard({ item, exhibitor }) {
  const { addToCart, cart, votedItemIds, voteForItem } = useOrsolya();

  const isVoted = votedItemIds.includes(item.id);
  const isTopVoted = (item.votes || 0) >= 40;

  const isSoldOut = item.status === 'sold_out' || item.stock === 0;
  const isCooking = item.status === 'cooking';

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-4.5 transition-all hover:border-amber-600/40 hover:shadow-md flex flex-col justify-between group space-y-3">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
          {/* Status Badge */}
          {isSoldOut ? (
            <span className="bg-rose-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-800 uppercase tracking-wider">
              <AlertCircle className="w-3 h-3 text-white" />
              <span>Elfogyott</span>
            </span>
          ) : isCooking ? (
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
              <Clock className="w-3 h-3 text-amber-700 animate-spin" />
              <span>Fő / Készül</span>
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              <span>Kóstolható</span>
            </span>
          )}

          {/* Top Voted Emblem Badge */}
          {isTopVoted && (
            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
              <Trophy className="w-3 h-3 text-amber-700" />
              <span>Közönségkedvenc</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors leading-snug">
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-stone-600 leading-relaxed mt-1 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {item.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-stone-100 text-stone-600 text-[10px] font-semibold px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Voting Action Button */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
          <Heart className="w-3.5 h-3.5 text-rose-700 fill-rose-700" />
          <span>Adományos kóstolás</span>
        </div>

        {/* Public Vote Button */}
        <button
          onClick={() => voteForItem(item.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border shadow-2xs ${
            isVoted
              ? 'bg-emerald-800 text-white border-emerald-800'
              : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300/80'
          }`}
          title={isVoted ? 'Leadott közönségszavazat' : 'Szavazok erre az ételre!'}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? 'fill-white' : 'text-amber-800'}`} />
          <span>{isVoted ? `Szavazva (${item.votes || 1})` : `Szavazok (${item.votes || 0})`}</span>
        </button>
      </div>
    </div>
  );
}
