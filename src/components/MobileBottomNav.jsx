import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Utensils, MapPin, Heart, Store, CalendarDays } from 'lucide-react';

/**
 * Mobil alsó navigáció.
 *
 * Az ÉTELEK a középső, kiemelt gomb. Ez a vásár legtöbbet használt funkciója
 * -- aki pörköltet keres, annak ne kelljen gondolkodnia, hol kezdje -, ezért
 * nagyobb, kiemelkedik a sávból, és pontosan középen van az öt elem közül.
 */
export default function MobileBottomNav({ onOpenFavorites, setMainTab }) {
  const {
    activeView,
    setActiveView,
    favoriteExhibitorIds,
    favoriteItemIds,
    navigateToStandFeed,
    navigateToFoodCatalog,
    mainTab
  } = useOrsolya();

  const totalFavs = favoriteExhibitorIds.length + (favoriteItemIds?.length || 0);

  // A látogatói nézetnek három füle van, ezért az aktív állapothoz a mainTab is
  // kell. Enélkül a "Standok" akkor is kiemelve maradna, amikor az ételeket
  // vagy a programot nézi valaki.
  const isTents = activeView === 'visitor' && mainTab === 'tents';
  const isFood = activeView === 'visitor' && mainTab === 'food';
  const isProgram = activeView === 'visitor' && mainTab === 'program';
  const isMap = activeView === 'map';

  /** A négy másodlagos gomb egységes stílusa. */
  const sideButton = (active) =>
    `flex flex-col items-center justify-self-center gap-0.5 py-1 px-1 rounded-md transition-all ${
      active ? 'text-amber-900 font-black' : 'text-stone-500 font-medium hover:text-stone-900'
    }`;

  const sideIcon = (active) => `w-5 h-5 ${active ? 'text-amber-800' : 'text-stone-500'}`;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200 shadow-lg px-2 pt-1.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
      {/* A feliratok alatti hely.
          Ket dolog kellett hozza: a pb-safe osztaly nem letezett a projektben,
          az index.html viewport metajabol pedig hianyzott a viewport-fit=cover
          -- utolso nelkul az env(safe-area-inset-bottom) MINDIG 0-t ad, barmit
          is irunk ide. A 14px-es minimum azokra a bongeszokre szol, amelyek
          nem jelentenek biztonsagos teruletet, de van gesztus-savuk. */}
      <div className="grid grid-cols-5 items-end relative">

        {/* 1. Standok */}
        <button
          onClick={() => {
            if (navigateToStandFeed) navigateToStandFeed();
          }}
          className={sideButton(isTents)}
        >
          <Store className={sideIcon(isTents)} />
          <span className="text-[10px] font-bold">Standok</span>
        </button>

        {/* 2. Térkép */}
        <button onClick={() => setActiveView('map')} className={sideButton(isMap)}>
          <MapPin className={sideIcon(isMap)} />
          <span className="text-[10px] font-bold">Térkép</span>
        </button>

        {/* 3. ÉTELEK — középen, kiemelve.
            A `ring-4 ring-white` miatt úgy ül a sávban, mintha kivágták volna
            neki a helyet; a negatív margó emeli ki fölé. */}
        <button
          onClick={() => {
            if (navigateToFoodCatalog) navigateToFoodCatalog();
          }}
          className="flex flex-col items-center justify-self-center -mt-5 transition-transform active:scale-95"
          title="Összes étel és katalógus"
          aria-label="Ételek"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-colors ${
              isFood
                ? 'bg-gradient-to-br from-amber-600 to-amber-800'
                : 'bg-gradient-to-br from-amber-700 to-amber-900'
            }`}
          >
            <Utensils className="w-6 h-6 text-amber-200" />
          </div>
          <span
            className={`text-[10px] font-black mt-0.5 uppercase tracking-wider ${
              isFood ? 'text-amber-900' : 'text-amber-950'
            }`}
          >
            Ételek
          </span>
        </button>

        {/* 4. Programok */}
        <button
          onClick={() => {
            setActiveView('visitor');
            if (setMainTab) setMainTab('program');
          }}
          className={sideButton(isProgram)}
          title="Programfüzet"
        >
          <CalendarDays className={sideIcon(isProgram)} />
          <span className="text-[10px] font-bold">Programok</span>
        </button>

        {/* 5. Kedvencek */}
        <button onClick={onOpenFavorites} className={`${sideButton(false)} relative`}>
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

      </div>
    </div>
  );
}
