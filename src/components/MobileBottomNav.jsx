import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Utensils, MapPin, QrCode, Heart, Info, Store } from 'lucide-react';

export default function MobileBottomNav({ onOpenInfo, onOpenFavorites, onOpenScanner }) {
  const { activeView, setActiveView, activeExhibitor, favoriteExhibitorIds } = useOrsolya();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200 shadow-lg px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around">
        {/* Ételek / Árusok */}
        <button
          onClick={() => setActiveView('visitor')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeView === 'visitor'
              ? 'text-amber-800 font-bold'
              : 'text-stone-500 font-medium hover:text-stone-900'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px]">Ételek</span>
        </button>

        {/* Diáksétány Térkép */}
        <button
          onClick={() => setActiveView('map')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeView === 'map'
              ? 'text-amber-800 font-bold'
              : 'text-stone-500 font-medium hover:text-stone-900'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px]">Térkép</span>
        </button>

        {/* QR Olvasó (Középső kiemelt gomb) */}
        <button
          onClick={onOpenScanner}
          className="flex flex-col items-center justify-center w-11 h-11 -mt-4 rounded-full bg-amber-800 text-white shadow-md active:scale-95 transition-transform border-2 border-white"
          title="QR Olvasó"
        >
          <QrCode className="w-5 h-5" />
        </button>

        {/* Kedvencek */}
        <button
          onClick={onOpenFavorites}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all text-stone-500 hover:text-stone-900 font-medium relative"
        >
          <div className="relative">
            <Heart className="w-5 h-5 text-rose-700 fill-rose-700" />
            {favoriteExhibitorIds.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-700 text-white font-extrabold text-[9px] px-1 rounded-full min-w-[14px] text-center">
                {favoriteExhibitorIds.length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Kedvencek</span>
        </button>

        {/* Vásár Info / Árus Portál ha be van lépve */}
        {activeExhibitor ? (
          <button
            onClick={() => setActiveView('exhibitor')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
              activeView === 'exhibitor'
                ? 'text-amber-800 font-bold'
                : 'text-stone-500 font-medium hover:text-stone-900'
            }`}
          >
            <Store className="w-5 h-5 text-emerald-700" />
            <span className="text-[10px] text-emerald-800 font-bold">Standom</span>
          </button>
        ) : (
          <button
            onClick={onOpenInfo}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all text-stone-500 hover:text-stone-900 font-medium"
          >
            <Info className="w-5 h-5 text-amber-700" />
            <span className="text-[10px]">Info</span>
          </button>
        )}
      </div>
    </div>
  );
}
