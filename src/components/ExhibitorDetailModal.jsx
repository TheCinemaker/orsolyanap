import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, MapPin, Phone, Heart, Plus, Sparkles, CheckCircle2, Utensils } from 'lucide-react';

export default function ExhibitorDetailModal({ exhibitor, onClose }) {
  const { menuItems, favoriteExhibitorIds, toggleFavoriteExhibitor, addToCart } = useOrsolya();

  if (!exhibitor) return null;

  const items = menuItems.filter((i) => i.exhibitor_id === exhibitor.id);
  const isFavorite = favoriteExhibitorIds.includes(exhibitor.id);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300/60 inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-700" />
              <span>{exhibitor.location}</span>
            </span>

            <button
              onClick={() => toggleFavoriteExhibitor(exhibitor.id)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 ${
                isFavorite
                  ? 'bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              <Heart className={`w-3 h-3 ${isFavorite ? 'fill-rose-700' : ''}`} />
              <span>{isFavorite ? 'Kedvenc' : 'Mentés'}</span>
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            {exhibitor.name}
          </h2>
        </div>

        {/* Live Broadcast Notice */}
        {exhibitor.notice && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5 animate-spin" />
            <span className="font-semibold">{exhibitor.notice}</span>
          </div>
        )}

        {/* Story & Cause */}
        <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/80 text-xs">
          {exhibitor.story && (
            <div>
              <span className="font-bold text-stone-900 block mb-0.5">Kik vagyunk & Történetünk:</span>
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

        {/* Full Dishes List */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-amber-700" />
            <span>Kínálat a Diáksétányon ({items.length} étel):</span>
          </h4>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-stone-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <h5 className="font-bold text-stone-900 text-xs sm:text-sm">{item.name}</h5>
                  {item.description && (
                    <p className="text-[11px] text-stone-500 line-clamp-2">{item.description}</p>
                  )}
                  <span className="text-[10px] text-amber-800 font-bold block">
                    Adományos kóstolás • Kapható: {item.stock} adag
                  </span>
                </div>

                <button
                  onClick={() => addToCart(item, exhibitor)}
                  disabled={item.stock <= 0}
                  className="px-3 py-1.5 bg-amber-800 text-white rounded-xl font-bold text-xs hover:bg-amber-700 transition-all disabled:opacity-40 flex items-center gap-1 flex-shrink-0 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kóstoló</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
