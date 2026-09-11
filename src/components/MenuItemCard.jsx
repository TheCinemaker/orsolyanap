import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { ThumbsUp, Trophy, Tag, CupSoda, MapPin } from 'lucide-react';

export default function MenuItemCard({ item, exhibitor, onOpenLocationModal }) {
  const { votedItemIds, voteForItem } = useOrsolya();

  const isVoted = votedItemIds.includes(item.id);
  const isTopVoted = (item.votes || 0) >= 40;

  const isSoldOut = item.status === 'sold_out';
  const isCooking = item.status === 'cooking';
  const isDrink = item.category === 'italok';

  // Format optional price display
  const getDisplayPrice = () => {
    if (item.price !== undefined && item.price !== null && String(item.price).trim() !== '') {
      const pStr = String(item.price).trim();
      if (pStr === '0' || pStr.toLowerCase() === 'ingyenes') return 'Ingyenes';
      if (!isNaN(Number(pStr))) return `${Number(pStr).toLocaleString('hu-HU')} Ft`;
      return pStr;
    }
    if (isDrink) return 'Ingyenes';
    return null;
  };

  const displayPrice = getDisplayPrice();

  return (
    <div
      className={`border rounded-md p-4 sm:p-4.5 transition-all flex flex-col justify-between group space-y-3 ${
        isSoldOut
          ? 'bg-stone-200 border-stone-300 grayscale select-none pointer-events-none'
          : isCooking
          ? 'bg-white border-amber-300 hover:border-amber-400 hover:shadow-md'
          : 'bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-lg'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Status Badge */}
            {isSoldOut ? (
              <span className="bg-rose-600 text-orange-200 text-xs font-black px-3 py-1 rounded-md border border-rose-700 uppercase tracking-wider">
                ELFOGYOTT
              </span>
            ) : isCooking ? (
              <span className="bg-amber-400 text-stone-950 text-xs font-black px-3 py-1 rounded-md border border-amber-500 uppercase tracking-wider">
                HAMAROSAN KÉSZ!
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-950 text-xs font-black px-2.5 py-1 rounded-md border border-emerald-300 uppercase tracking-wider">
                KÉSZ
              </span>
            )}

            {/* Drink / Category Badge */}
            {isDrink && (
              <span className="bg-cyan-100 text-cyan-950 text-xs font-extrabold px-2.5 py-1 rounded-md border border-cyan-300 flex items-center gap-1">
                <CupSoda className="w-3.5 h-3.5 text-cyan-800" />
                <span>ITAL</span>
              </span>
            )}
          </div>

          {/* Top Voted Emblem Badge */}
          {isTopVoted && (
            <span className="bg-amber-100 text-amber-950 text-xs font-extrabold px-2.5 py-1 rounded-md border border-amber-300 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-800" />
              <span>Közönségkedvenc</span>
            </span>
          )}
        </div>

        {/* Item Image */}
        {item.image && (
          <div
            onClick={() => onOpenLocationModal && onOpenLocationModal(item, exhibitor)}
            className={`w-full aspect-video rounded-md overflow-hidden mb-3 border border-stone-200 bg-stone-950 flex items-center justify-center cursor-pointer ${isCooking ? 'saturate-50' : ''}`}
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        {/* Title and Optional Price */}
        <div className="flex items-start justify-between gap-2">
          <h3
            onClick={() => onOpenLocationModal && onOpenLocationModal(item, exhibitor)}
            className="text-sm sm:text-base font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors leading-snug cursor-pointer"
          >
            {item.name}
          </h3>

          {displayPrice && (
            <span
              className={`shrink-0 text-xs font-black px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                displayPrice === 'Ingyenes'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-950 border-amber-300'
              }`}
            >
              <Tag className="w-3 h-3 text-stone-600" />
              <span>{displayPrice}</span>
            </span>
          )}
        </div>

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
                className="bg-stone-100 text-stone-600 text-xs font-semibold px-2.5 py-1 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Action Buttons */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        {/* Hol találom? Button */}
        {exhibitor ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenLocationModal) onOpenLocationModal(item, exhibitor);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-amber-950 border border-stone-200 hover:border-amber-300 transition-all cursor-pointer"
            title="Stand helyszínének megjelenítése kis térképen"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Hol találom?</span>
          </button>
        ) : <div />}

        {/* Public Vote Button */}
        <button
          disabled={isCooking || isSoldOut}
          onClick={(e) => {
            e.stopPropagation();
            voteForItem(item.id);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-extrabold transition-all border shadow-2xs cursor-pointer ${
            isSoldOut || isCooking
              ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed pointer-events-none'
              : isVoted
              ? 'bg-emerald-800 text-white border-emerald-800'
              : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300/80'
          }`}
          title={isCooking ? 'Főzés alatt - a szavazás hamarosan indul' : isVoted ? 'Leadott közönségszavazat' : 'Szavazok erre az ételre'}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? 'fill-white' : 'text-amber-800'}`} />
          <span>{isVoted ? `Szavazva (${item.votes || 1})` : `Szavazok (${item.votes || 0})`}</span>
        </button>
      </div>
    </div>
  );
}
