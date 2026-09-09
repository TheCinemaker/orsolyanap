import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Utensils, MapPin, Heart, Menu } from 'lucide-react';

export default function MobileBottomNav({ onOpenFavorites, onOpenHamburger }) {
  const { activeView, setActiveView, favoriteExhibitorIds, favoriteItemIds } = useOrsolya();
  const totalFavs = favoriteExhibitorIds.length + (favoriteItemIds?.length || 0);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200 shadow-lg px-2 py-2 pb-safe">
      <div className="flex items-center justify-around">
        {/* Ételek */}
        <button
          onClick={() => setActiveView('visitor')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeView === 'visitor'
              ? 'text-amber-800 font-extrabold'
              : 'text-stone-500 font-medium hover:text-stone-900'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px]">Ételek</span>
        </button>

        {/* Térkép */}
        <button
          onClick={() => setActiveView('map')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeView === 'map'
              ? 'text-amber-800 font-extrabold'
              : 'text-stone-500 font-medium hover:text-stone-900'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px]">Térkép</span>
        </button>

        {/* Kedvencek */}
        <button
          onClick={onOpenFavorites}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all text-stone-500 hover:text-stone-900 font-medium relative"
        >
          <div className="relative">
            <Heart className="w-5 h-5 text-rose-700 fill-rose-700" />
            {totalFavs > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-700 text-white font-extrabold text-[9px] px-1 rounded-full min-w-[14px] text-center">
                {totalFavs}
              </span>
            )}
          </div>
          <span className="text-[10px]">Kedvencek</span>
        </button>

        {/* Menü (Hamburger) */}
        <button
          onClick={onOpenHamburger}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all text-stone-500 hover:text-stone-900 font-medium"
        >
          <Menu className="w-5 h-5 text-amber-800" />
          <span className="text-[10px]">Menü</span>
        </button>
      </div>
    </div>
  );
}
