import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import VisitKoszegLogo from './VisitKoszegLogo';
import {
  X,
  Store,
  Utensils,
  MapPin,
  Tv,
  Heart,
  Info,
  ChevronRight,
  Flame,
  Wine,
  Cookie,
  Compass
} from 'lucide-react';

export default function HamburgerMenuDrawer({
  isOpen,
  onClose,
  mainTab,
  setMainTab,
  selectedCategory,
  setSelectedCategory,
  setSelectedZone,
  setIsInfoOpen,
  setIsFavoritesOpen
}) {
  const { favoriteExhibitorIds, exhibitors, menuItems, setActiveView } = useOrsolya();

  if (!isOpen) return null;

  const handleSelectTab = (tab) => {
    setMainTab(tab);
    setActiveView('visitor');
    onClose();
  };

  const handleSelectZone = (zoneId) => {
    setMainTab('tents');
    setSelectedZone(zoneId);
    setActiveView('visitor');
    onClose();
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    onClose();
  };

  const handleOpenMap = () => {
    setActiveView('map');
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex justify-start animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xs sm:max-w-sm h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-5 space-y-6 relative animate-in slide-in-from-left duration-250 border-r border-stone-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <VisitKoszegLogo
            onClick={() => {
              setMainTab('tents');
              setSelectedCategory('all');
              setSelectedZone('all');
              setActiveView('visitor');
              onClose();
            }}
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="space-y-6 flex-1">
          {/* Main Views */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 px-3 block mb-1">
              FŐ NAVIGÁCIÓ
            </span>

            <button
              onClick={() => handleSelectTab('tents')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                mainTab === 'tents'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4" />
                <span>Standok</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => handleSelectTab('food')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                mainTab === 'food'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Utensils className="w-4 h-4" />
                <span>Ételek</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={handleOpenMap}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-amber-700" />
                <span>Térkép</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>


          </div>

          {/* Quick Zone Section */}
          <div className="space-y-1 pt-2 border-t border-stone-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 px-3 block mb-1">
              GYORS UGRÁS SÁTOR SZAKASZHOZ (50 SÁTOR)
            </span>

            <button
              onClick={() => handleSelectZone('zone-1')}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-all"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-700" /> Stand 1-15. (Várkapu felől)
              </span>
            </button>

            <button
              onClick={() => handleSelectZone('zone-2')}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-all"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-700" /> Stand 16-30. (Gyöngyös-patak Híd)
              </span>
            </button>

            <button
              onClick={() => handleSelectZone('zone-3')}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-all"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-700" /> Stand 31-50. (Várpark & Színpad)
              </span>
            </button>
          </div>

          {/* Food Categories */}
          <div className="space-y-1 pt-2 border-t border-stone-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 px-3 block mb-1">
              ÉTEL KATEGÓRIÁK
            </span>

            <button
              onClick={() => handleSelectCategory('bogracs')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'bogracs'
                  ? 'bg-amber-100 text-amber-900 font-extrabold'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-700" /> Bográcsos & Meleg ételek
              </span>
            </button>

            <button
              onClick={() => handleSelectCategory('ital')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'ital'
                  ? 'bg-amber-100 text-amber-900 font-extrabold'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Wine className="w-3.5 h-3.5 text-rose-700" /> Borok, Must & Forró italok
              </span>
            </button>

            <button
              onClick={() => handleSelectCategory('desszert')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'desszert'
                  ? 'bg-amber-100 text-amber-900 font-extrabold'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Cookie className="w-3.5 h-3.5 text-amber-800" /> Kézműves Rétesek & Édesség
              </span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-stone-100 space-y-2">
          <button
            onClick={() => {
              setIsFavoritesOpen(true);
              onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 fill-rose-700 text-rose-700" />
              <span>Mentett Kedvenceim</span>
            </div>
            <span className="bg-rose-700 text-white px-2 py-0.5 rounded-full text-[10px]">
              {favoriteExhibitorIds.length}
            </span>
          </button>

          <button
            onClick={() => {
              setIsInfoOpen(true);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
          >
            <Info className="w-3.5 h-3.5 text-amber-700" />
            <span>Vásár Történelem & Info</span>
          </button>
        </div>
      </div>
    </div>
  );
}
