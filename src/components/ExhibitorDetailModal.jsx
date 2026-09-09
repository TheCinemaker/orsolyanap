import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, MapPin, Phone, Heart, Utensils, Map, ThumbsUp, CupSoda } from 'lucide-react';

export default function ExhibitorDetailModal({ exhibitor, onClose }) {
  const {
    menuItems,
    favoriteExhibitorIds,
    toggleFavoriteExhibitor,
    favoriteItemIds,
    toggleFavoriteItem,
    voteForItem,
    votedItemIds,
    focusExhibitorOnMap
  } = useOrsolya();

  if (!exhibitor) return null;

  const items = menuItems.filter((i) => i.exhibitor_id === exhibitor.id);
  const isFavorite = favoriteExhibitorIds.includes(exhibitor.id);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-stone-200 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-5 relative animate-in slide-in-from-bottom duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all border border-stone-200 shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large Photo */}
        {exhibitor.image && (
          <div className="h-48 sm:h-56 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 overflow-hidden relative">
            <img
              src={exhibitor.image}
              alt={exhibitor.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-200 bg-amber-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40 inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>{exhibitor.location}</span>
              </span>

              {exhibitor.hasDrinks && (
                <span className="text-xs font-extrabold text-cyan-100 bg-cyan-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-400/40 flex items-center gap-1">
                  <span>🥤 Ital kapható</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Title & Action Buttons */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
            {exhibitor.name}
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavoriteExhibitor(exhibitor.id)}
              className={`flex-1 py-2 px-3 rounded-2xl text-xs font-extrabold transition-all border flex items-center justify-center gap-1.5 shadow-2xs ${
                isFavorite
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-700 text-rose-700' : ''}`} />
              <span>{isFavorite ? 'Kedvenc árus' : '❤️ Mentés Kedvencekhez'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                focusExhibitorOnMap(exhibitor.id);
              }}
              className="flex-1 py-2 px-3 bg-amber-800 hover:bg-amber-700 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Map className="w-4 h-4" />
              <span>📍 Mutasd a térképen</span>
            </button>
          </div>
        </div>

        {/* Offerings Summary (Kínálat) */}
        {exhibitor.offerings && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1">
            <span className="text-xs font-black text-amber-900 uppercase tracking-wider block">
              🍽️ Mit kínál nálunk az árus:
            </span>
            <p className="text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed">
              {exhibitor.offerings}
            </p>
          </div>
        )}

        {/* Story & Cause (Hide empty fields) */}
        {(exhibitor.story || exhibitor.cause || exhibitor.phone) && (
          <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/80 text-xs">
            {exhibitor.story && (
              <div>
                <span className="font-bold text-stone-900 block mb-0.5">Bemutatkozás:</span>
                <p className="text-stone-600 leading-relaxed">{exhibitor.story}</p>
              </div>
            )}

            {exhibitor.cause && (
              <div className="pt-2 border-t border-stone-200/60">
                <span className="font-bold text-amber-900 block mb-0.5">Adomány célja:</span>
                <p className="text-amber-800 font-medium">{exhibitor.cause}</p>
              </div>
            )}

            {exhibitor.phone && (
              <div className="pt-2 border-t border-stone-200/60 flex items-center gap-1.5 text-stone-500">
                <Phone className="w-3.5 h-3.5 text-stone-700" />
                <span>{exhibitor.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Specific Dishes List (If provided) */}
        {items.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-amber-800" />
              <span>Konkrét ételek és árak / adományok ({items.length}):</span>
            </h4>

            <div className="space-y-2">
              {items.map((item) => {
                const isFavItem = favoriteItemIds?.includes(item.id);
                const isVoted = votedItemIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-stone-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-extrabold text-stone-900 text-xs sm:text-sm">{item.name}</h5>
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-stone-500 line-clamp-2">{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleFavoriteItem(item.id)}
                        className={`p-1.5 rounded-xl border transition-all ${
                          isFavItem
                            ? 'bg-rose-100 border-rose-300 text-rose-700'
                            : 'bg-stone-50 border-stone-200 text-stone-400 hover:text-rose-600'
                        }`}
                        title="Étel kedvencekhez"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFavItem ? 'fill-rose-700' : ''}`} />
                      </button>

                      <button
                        onClick={() => voteForItem(item.id)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                          isVoted
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? 'fill-white' : 'text-amber-800'}`} />
                        <span>{item.votes || 0}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
