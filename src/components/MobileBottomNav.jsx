import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Utensils, MapPin, Heart, Store, QrCode } from 'lucide-react';

export default function MobileBottomNav({ onOpenFavorites, onOpenScanner, setMainTab }) {
  const { activeView, setActiveView, favoriteExhibitorIds, favoriteItemIds, navigateToStandFeed } = useOrsolya();
  const totalFavs = favoriteExhibitorIds.length + (favoriteItemIds?.length || 0);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200 shadow-lg px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around relative">
        
        {/* 10.2 Left 1: Standok */}
        <button
          onClick={() => {
            if (navigateToStandFeed) navigateToStandFeed();
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-md transition-all ${
            activeView === 'visitor'
              ? 'text-amber-900 font-black'
              : 'text-stone-500 font-medium hover:text-stone-900'
          }`}
        >
          <Store className={`w-5 h-5 ${activeView === 'visitor' ? 'text-amber-800' : 'text-stone-500'}`} />
          <span className="text-[10px] font-bold">Standok</span>
        </button>

        {/* 10.2 Left 2: Térkép */}
        <button
          onClick={() => setActiveView('map')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-md transition-all ${
            activeView === 'map'
              ? 'text-amber-900 font-black'
              : 'text-stone-500 font-medium hover:text-stone-900'
          }`}
        >
          <MapPin className={`w-5 h-5 ${activeView === 'map' ? 'text-amber-800' : 'text-stone-500'}`} />
          <span className="text-[10px] font-bold">Térkép</span>
        </button>

        {/* 10.1 Center Prominent Cutlery Icon (Ételek / Katalógus) */}
        <button
          onClick={() => {
            setActiveView('visitor');
            if (setMainTab) setMainTab('food');
          }}
          className="flex flex-col items-center -mt-5 transition-transform active:scale-95"
          title="Ételek & Kínálat Katalógus"
        >
          <div className="w-12 h-12 rounded-full bg-amber-800 text-white flex items-center justify-center shadow-lg border-2 border-white">
            <Utensils className="w-6 h-6 text-amber-200" />
          </div>
          <span className="text-[10px] font-black text-amber-950 mt-0.5">Ételek/Italok</span>
        </button>

        {/* 10.3 Right 1: Kedvencek */}
        <button
          onClick={onOpenFavorites}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-md transition-all text-stone-500 hover:text-stone-900 font-medium relative"
        >
          <div className="relative">
            <Heart className="w-5 h-5 text-rose-700 fill-rose-700" />
            {totalFavs > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-700 text-white font-extrabold text-[9px] px-1 rounded-full min-w-[14px] text-center">
                {totalFavs}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Kedvencek</span>
        </button>

        {/* 10.3 Right 2: QR Scanner */}
        <button
          onClick={onOpenScanner}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-md transition-all text-stone-600 hover:text-stone-900 font-medium"
          title="QR Kód Beolvasása"
        >
          <QrCode className="w-5 h-5 text-amber-800" />
          <span className="text-[10px] font-bold">QR Olvasó</span>
        </button>

      </div>
    </div>
  );
}
