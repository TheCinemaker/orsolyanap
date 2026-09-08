import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, Heart, MapPin, QrCode, Trash2, ArrowRight } from 'lucide-react';

export default function FavoritesModal({ isOpen, onClose, onOpenScanner }) {
  const { exhibitors, favoriteExhibitorIds, toggleFavoriteExhibitor, menuItems, setActiveView } = useOrsolya();

  if (!isOpen) return null;

  const favoriteExhibitors = exhibitors.filter((ex) => favoriteExhibitorIds.includes(ex.id));

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-700 fill-rose-700" />
              <span>Beszkennelt Kedvenc Standjaim</span>
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              A QR kóddal elmentett kőszegi kiállítók listája
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: QR Scanner */}
        <div className="pt-4 pb-2">
          <button
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            className="w-full py-3 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>Stand QR Kód Beolvasása Kamerával</span>
          </button>
        </div>

        {/* Favorites List */}
        <div className="py-3 flex-1 overflow-y-auto space-y-3">
          {favoriteExhibitors.length === 0 ? (
            <div className="text-center py-12 text-stone-400 space-y-2">
              <Heart className="w-10 h-10 mx-auto opacity-30 text-rose-500" />
              <p className="text-xs font-bold text-stone-700">Még nincs beszkennelt kedvenc standod.</p>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto font-medium">
                Szkenneld be a Diáksétányon található standok QR kódját, hogy ne felejtsd el hol láttál szuper ételeket!
              </p>
            </div>
          ) : (
            favoriteExhibitors.map((ex) => {
              const exItems = menuItems.filter((i) => i.exhibitor_id === ex.id);

              return (
                <div
                  key={ex.id}
                  className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 space-y-2 relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-700" />
                        <span>{ex.location}</span>
                      </span>
                      <h4 className="text-sm font-extrabold text-stone-900 mt-0.5">{ex.name}</h4>
                    </div>

                    <button
                      onClick={() => toggleFavoriteExhibitor(ex.id)}
                      className="text-rose-600 hover:text-stone-400 p-1"
                      title="Eltávolítás"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {ex.story && (
                    <p className="text-xs text-stone-600 line-clamp-2">{ex.story}</p>
                  )}

                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-bold">
                      {exItems.length} kapható étel
                    </span>

                    <button
                      onClick={() => {
                        onClose();
                        setActiveView('visitor');
                      }}
                      className="text-amber-800 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Megtekintés</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
