import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import VisitKoszegLogo from './VisitKoszegLogo';
import {
  X,
  Store,
  Utensils,
  Heart,
  Info,
  ChevronRight,
  Flame,
  Cookie,
  CupSoda,
  Compass,
  Trophy,
  ThumbsUp,
  MapPin,
  Package
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
  const {
    favoriteExhibitorIds,
    exhibitors,
    menuItems,
    setActiveView,
    navigateToFoodCatalog
  } = useOrsolya();

  if (!isOpen) return null;

  const handleSelectTab = (tab) => {
    setMainTab(tab);
    setActiveView('visitor');
    onClose();
  };

  const handleSelectCategory = (catId) => {
    if (setSelectedCategory) setSelectedCategory(catId);
    if (setMainTab) setMainTab('food');
    setActiveView('visitor');
    onClose();
  };

  const handleOpenMap = () => {
    setActiveView('map');
    onClose();
  };

  // Top 5 Realtime Voted Dishes
  const top5Items = [...menuItems]
    .filter((item) => item.category !== 'italok' && item.category !== 'ital')
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 5);

  const getRankBadgeStyle = (index) => {
    switch (index) {
      case 0:
        return 'bg-amber-400 text-stone-950 border-amber-500 font-black shadow-2xs';
      case 1:
        return 'bg-stone-200 text-stone-900 border-stone-300 font-extrabold';
      case 2:
        return 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200 font-bold';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex justify-start animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xs sm:max-w-sm h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-5 space-y-6 relative animate-in slide-in-from-left duration-250 border-r border-stone-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <VisitKoszegLogo
            onClick={() => {
              setMainTab('tents');
              if (setSelectedCategory) setSelectedCategory('all');
              if (setSelectedZone) setSelectedZone('all');
              setActiveView('visitor');
              onClose();
            }}
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all cursor-pointer"
            title="Bezárás"
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-extrabold transition-all cursor-pointer ${
                mainTab === 'tents'
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4" />
                <span>Standok Listája</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => handleSelectTab('food')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-extrabold transition-all cursor-pointer ${
                mainTab === 'food'
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Utensils className="w-4 h-4" />
                <span>Ételek / Italok Katalógus</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={handleOpenMap}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-bold text-stone-700 hover:bg-stone-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-amber-700" />
                <span>Interaktív Térkép</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          </div>

          {/* REALTIME TOP 5 VOTED FOODS LEADERBOARD */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-700" /> KÖZÖNSÉGSZAVAZÁS TOP 5 ÉTEL
              </span>
              <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 animate-pulse">
                LIVE
              </span>
            </div>

            {top5Items.length === 0 ? (
              <p className="text-xs text-stone-400 italic px-3 py-1">Még nem érkezett szavazat.</p>
            ) : (
              <div className="space-y-1.5">
                {top5Items.map((item, index) => {
                  const exhibitor = exhibitors.find((ex) => ex.id === item.exhibitor_id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onClose();
                        if (navigateToFoodCatalog) {
                          navigateToFoodCatalog(item.name);
                        }
                      }}
                      className="flex items-center justify-between p-2 rounded-md bg-stone-50 hover:bg-amber-50/80 border border-stone-200/80 transition-all cursor-pointer group shadow-2xs"
                      title="Kattints az étel megtekintéséhez"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`w-5 h-5 rounded-md text-[10px] flex items-center justify-center border shrink-0 ${getRankBadgeStyle(index)}`}>
                          #{index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-extrabold text-stone-900 text-xs truncate block group-hover:text-amber-900">
                            {item.name}
                          </span>
                          {exhibitor && (
                            <span className="text-[10px] text-stone-500 font-semibold truncate block">
                              {exhibitor.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0 text-[10px] font-black">
                        <ThumbsUp className="w-2.5 h-2.5 text-amber-800 fill-amber-800" />
                        <span>{item.votes || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Food Categories Quick Filter */}
          <div className="space-y-1 pt-3 border-t border-stone-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 px-3 block mb-1">
              KATEGÓRIA GYORS SZŰRŐ
            </span>

            <button
              onClick={() => handleSelectCategory('meleg_etel')}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-md text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-700" /> Meleg ételek
              </span>
            </button>

            <button
              onClick={() => handleSelectCategory('sutemeny')}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-md text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Cookie className="w-3.5 h-3.5 text-amber-800" /> Sütemény / Édesség
              </span>
            </button>

            <button
              onClick={() => handleSelectCategory('italok')}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-md text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <CupSoda className="w-3.5 h-3.5 text-cyan-700" /> Italok
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
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-800 transition-all cursor-pointer"
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
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-amber-700" />
            <span>Vásár Történelem & Info</span>
          </button>
        </div>
      </div>
    </div>
  );
}
