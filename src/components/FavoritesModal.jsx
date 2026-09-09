import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, Heart, MapPin, QrCode, Trash2, Map, Utensils, Store } from 'lucide-react';

export default function FavoritesModal({ isOpen, onClose, onOpenScanner }) {
  const {
    exhibitors,
    favoriteExhibitorIds,
    toggleFavoriteExhibitor,
    menuItems,
    favoriteItemIds,
    toggleFavoriteItem,
    focusExhibitorOnMap
  } = useOrsolya();

  if (!isOpen) return null;

  const favoriteExhibitors = exhibitors.filter((ex) => favoriteExhibitorIds.includes(ex.id));
  const favoriteItems = menuItems.filter((i) => favoriteItemIds?.includes(i.id));

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-stone-200 rounded-md p-5 sm:p-6 w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-xl font-black text-stone-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-700 fill-rose-700" />
              <span>KEDVENCEIM</span>
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Elmentett ételeid és árusaid listája a Diáksétányon
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Scanner Trigger */}
        <div className="pt-3 pb-2">
          <button
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            className="w-full py-2.5 bg-amber-800 hover:bg-amber-700 text-white font-extrabold text-xs rounded-md shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>Stand QR Kód Beolvasása Kamerával</span>
          </button>
        </div>

        {/* Favorites Scrollable Content */}
        <div className="py-2 flex-1 overflow-y-auto space-y-6">
          {/* Section 1: ÉTELEK */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-stone-100 pb-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-700" />
                <span>Mentett Ételek ({favoriteItems.length})</span>
              </h3>
            </div>

            {favoriteItems.length === 0 ? (
              <p className="text-xs text-stone-400 font-medium italic p-2">
                Még nem mentettél el konkrét ételt a szív ikonsorral.
              </p>
            ) : (
              <div className="space-y-2">
                {favoriteItems.map((item) => {
                  const exhibitor = exhibitors.find((ex) => ex.id === item.exhibitor_id);

                  return (
                    <div
                      key={item.id}
                      className="bg-stone-50 border border-stone-200/80 rounded-md p-3 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 truncate">
                          {item.name}
                        </h4>
                        {exhibitor && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-800 font-bold">
                            <MapPin className="w-3 h-3 text-amber-700 flex-shrink-0" />
                            <span className="truncate">{exhibitor.name} • {exhibitor.location.split('(')[0]}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {exhibitor && (
                          <button
                            onClick={() => {
                              onClose();
                              focusExhibitorOnMap(exhibitor.id);
                            }}
                            className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md text-xs font-bold transition-all flex items-center gap-1"
                            title="Mutasd a térképen"
                          >
                            <Map className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => toggleFavoriteItem(item.id)}
                          className="p-2 text-rose-600 hover:text-stone-400 rounded-md"
                          title="Eltávolítás"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: ÁRUSOK */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-stone-100 pb-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-700" />
                <span>Mentett Árusok ({favoriteExhibitors.length})</span>
              </h3>
            </div>

            {favoriteExhibitors.length === 0 ? (
              <p className="text-xs text-stone-400 font-medium italic p-2">
                Még nincs elmentett kedvenc standod.
              </p>
            ) : (
              <div className="space-y-2">
                {favoriteExhibitors.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-stone-50 border border-stone-200/80 rounded-md p-3 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 truncate">
                        {ex.name}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-amber-800 font-bold">
                        <MapPin className="w-3 h-3 text-amber-700 flex-shrink-0" />
                        <span className="truncate">{ex.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          onClose();
                          focusExhibitorOnMap(ex.id);
                        }}
                        className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md text-xs font-bold transition-all flex items-center gap-1"
                        title="Mutasd a térképen"
                      >
                        <Map className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleFavoriteExhibitor(ex.id)}
                        className="p-2 text-rose-600 hover:text-stone-400 rounded-md"
                        title="Eltávolítás"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
