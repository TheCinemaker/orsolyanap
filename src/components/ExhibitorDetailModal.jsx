import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, MapPin, Phone, Mail, Heart, Utensils, Map, ThumbsUp, CupSoda, Calendar, Share2 } from 'lucide-react';

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

  const dayText = exhibitor.days === 'saturday' ? 'Csak Szombat' : exhibitor.days === 'sunday' ? 'Csak Vasárnap' : 'Mindkét nap (Szombat & Vasárnap)';

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
          <div className="w-full aspect-video -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 overflow-hidden relative bg-stone-950 flex items-center justify-center">
            <img
              src={exhibitor.image}
              alt={exhibitor.name}
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between flex-wrap gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-200 bg-amber-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40 inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>{exhibitor.location}</span>
              </span>

              {exhibitor.hasDrinks && (
                <span className="text-xs font-extrabold text-cyan-100 bg-cyan-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-400/40 flex items-center gap-1">
                  <CupSoda className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Ital kapható</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Title & Action Buttons */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-800" />
              <span>{dayText}</span>
            </span>
          </div>

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
              <span>{isFavorite ? 'Kedvenc árus' : 'Mentés Kedvencekhez'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                focusExhibitorOnMap(exhibitor.id);
              }}
              className="flex-1 py-2 px-3 bg-amber-800 hover:bg-amber-700 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Map className="w-4 h-4" />
              <span>Mutasd a térképen</span>
            </button>
          </div>
        </div>

        {/* Social Links & Contact Details */}
        {(exhibitor.phone || exhibitor.email || exhibitor.facebook_url || exhibitor.instagram_url) && (
          <div className="flex items-center gap-2 flex-wrap bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-xs">
            {exhibitor.phone && (
              <a
                href={`tel:${exhibitor.phone}`}
                className="flex items-center gap-1 text-stone-700 font-bold hover:text-amber-800 bg-white px-2.5 py-1 rounded-xl border border-stone-200"
              >
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                <span>{exhibitor.phone}</span>
              </a>
            )}

            {exhibitor.email && (
              <a
                href={`mailto:${exhibitor.email}`}
                className="flex items-center gap-1 text-stone-700 font-bold hover:text-amber-800 bg-white px-2.5 py-1 rounded-xl border border-stone-200"
              >
                <Mail className="w-3.5 h-3.5 text-stone-500" />
                <span>Email</span>
              </a>
            )}

            {exhibitor.facebook_url && (
              <a
                href={exhibitor.facebook_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-800 font-bold bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 hover:bg-blue-100"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Facebook</span>
              </a>
            )}

            {exhibitor.instagram_url && (
              <a
                href={exhibitor.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-pink-800 font-bold bg-pink-50 px-2.5 py-1 rounded-xl border border-pink-200 hover:bg-pink-100"
              >
                <Share2 className="w-3.5 h-3.5 text-pink-700" />
                <span>Instagram</span>
              </a>
            )}
          </div>
        )}

        {/* Offerings Summary (Kínálat) */}
        {exhibitor.offerings && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1">
            <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-amber-800" />
              <span>Mit kínál az árus:</span>
            </span>
            <p className="text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed">
              {exhibitor.offerings}
            </p>
          </div>
        )}

        {/* Story & Cause (Hide empty fields) */}
        {(exhibitor.story || exhibitor.cause) && (
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
          </div>
        )}

        {/* Specific Dishes List */}
        {items.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-amber-800" />
              <span>Konkrét ételek ({items.length}):</span>
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="font-extrabold text-stone-900 text-xs sm:text-sm">{item.name}</h5>
                        {item.is_gluten_free && (
                          <span className="text-[8px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                            Gluténmentes
                          </span>
                        )}
                        {item.is_lactose_free && (
                          <span className="text-[8px] font-extrabold text-cyan-800 bg-cyan-100 px-1.5 py-0.5 rounded border border-cyan-200">
                            Laktózmentes
                          </span>
                        )}
                        {item.is_sugar_free && (
                          <span className="text-[8px] font-extrabold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">
                            Cukormentes
                          </span>
                        )}
                        {item.is_vegan && (
                          <span className="text-[8px] font-extrabold text-lime-800 bg-lime-100 px-1.5 py-0.5 rounded border border-lime-200">
                            Vegán
                          </span>
                        )}
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
