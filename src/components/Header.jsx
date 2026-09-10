import React, { useState, useEffect } from 'react';
import VisitKoszegLogo from './VisitKoszegLogo';
import OrsolyaInfoModal from './OrsolyaInfoModal';
import FavoritesModal from './FavoritesModal';
import QRScannerModal from './QRScannerModal';
import MobileBottomNav from './MobileBottomNav';
import { useOrsolya } from '../context/OrsolyaContext';
import { Utensils, MapPin, Store, Heart, Search, X, Info, Calendar, Clock, Menu, ThumbsUp } from 'lucide-react';
import HamburgerMenuDrawer from './HamburgerMenuDrawer';

export default function Header({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  mainTab,
  setMainTab,
  selectedZone,
  setSelectedZone,
  onSelectStandFeed
}) {
  const {
    activeView,
    setActiveView,
    activeExhibitor,
    favoriteExhibitorIds,
    menuItems,
    exhibitors,
    votedItemIds,
    voteForItem,
    navigateToStandFeed
  } = useOrsolya();

  const handleStandClick = () => {
    if (onSelectStandFeed) {
      onSelectStandFeed();
    } else if (navigateToStandFeed) {
      navigateToStandFeed();
    }
  };

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Instant matching dishes calculation
  const searchTrim = searchQuery.trim().toLowerCase();
  const instantMatchingItems = searchTrim
    ? menuItems.filter((item) => {
        const exhibitor = exhibitors.find((ex) => ex.id === item.exhibitor_id);
        const exName = exhibitor ? exhibitor.name.toLowerCase() : '';
        const exLoc = exhibitor ? exhibitor.location.toLowerCase() : '';

        return (
          item.name.toLowerCase().includes(searchTrim) ||
          item.description.toLowerCase().includes(searchTrim) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchTrim))) ||
          exName.includes(searchTrim) ||
          exLoc.includes(searchTrim)
        );
      })
    : [];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        {/* Event Banner */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 text-amber-50 text-[10px] sm:text-[11px] font-bold px-3 py-1 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="truncate uppercase tracking-wider font-extrabold text-amber-100">ORSOLYA-NAPI VÁSÁR – NATÚRPARK ÍZEI • CIVIL ÍZEK UTCÁJA</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 opacity-90 text-[11px]">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-amber-300" /> Natúrpark Ízei</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-300" /> 09:00 - 20:00</span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Left Group: Clean Hamburger Button & Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHamburgerOpen(true)}
              className="p-2 rounded-md bg-white hover:bg-stone-100 text-stone-900 transition-all border border-stone-300 shadow-2xs"
              title="Menü megnyitása"
            >
              <Menu className="w-5 h-5 text-stone-900" />
            </button>
            <VisitKoszegLogo
              onClick={handleStandClick}
              onLongPress5s={() => setActiveView('login')}
            />
          </div>

          {/* Navigation Tabs (Desktop Apple Segmented Style) */}
          <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-md border border-stone-200/80">
            <button
              onClick={handleStandClick}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs transition-all ${
                activeView === 'visitor' && mainTab === 'tents'
                  ? 'bg-amber-900 text-white shadow-sm font-extrabold'
                  : 'text-stone-700 hover:text-stone-900 font-semibold'
              }`}
            >
              <Store className={`w-3.5 h-3.5 ${activeView === 'visitor' && mainTab === 'tents' ? 'text-amber-200' : 'text-amber-700'}`} />
              <span>Standok</span>
            </button>

            <button
              onClick={() => {
                setActiveView('visitor');
                setMainTab('food');
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs transition-all ${
                activeView === 'visitor' && mainTab === 'food'
                  ? 'bg-amber-900 text-white shadow-sm font-extrabold'
                  : 'text-stone-700 hover:text-stone-900 font-semibold'
              }`}
            >
              <Utensils className={`w-3.5 h-3.5 ${activeView === 'visitor' && mainTab === 'food' ? 'text-amber-200' : 'text-amber-700'}`} />
              <span>Ételek / Italok</span>
            </button>

            <button
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs transition-all ${
                activeView === 'map'
                  ? 'bg-amber-900 text-white shadow-sm font-extrabold'
                  : 'text-stone-700 hover:text-stone-900 font-semibold'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${activeView === 'map' ? 'text-amber-200' : 'text-amber-700'}`} />
              <span>Térkép</span>
            </button>

            {/* Info Button */}
            <button
              onClick={() => setIsInfoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-amber-900 hover:bg-stone-200/70 transition-all"
            >
              <Info className="w-3.5 h-3.5 text-amber-800" />
              <span>Info</span>
            </button>
          </div>

          {/* Right Actions (Desktop & Tablet) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Kedvencek Button */}
            <button
              onClick={() => setIsFavoritesOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-all border border-stone-200"
            >
              <Heart className="w-3.5 h-3.5 text-rose-700 fill-rose-700 flex-shrink-0" />
              <span className="hidden sm:inline">Kedvencek</span>
              {favoriteExhibitorIds.length > 0 && (
                <span className="bg-rose-700 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {favoriteExhibitorIds.length}
                </span>
              )}
            </button>

            {/* If Logged in as Exhibitor */}
            {activeExhibitor && (
              <button
                onClick={() => setActiveView('exhibitor')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="max-w-[90px] truncate hidden sm:inline">{activeExhibitor.name}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar & Instant Live Food Search (Visitor view) */}
        {activeView === 'visitor' && (
          <div className="border-t border-stone-200/70 px-3 sm:px-4 py-2 bg-stone-50/80 transition-all duration-200">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-2.5">
              {/* Search Container */}
              <div className="relative w-full sm:w-96">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Azonnali keresés ételre (pl. gulyás, rétes, bor)..."
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  className="w-full pl-8 pr-8 py-1.5 bg-white border border-amber-300/80 focus:border-amber-500 rounded-md text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-2xs font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Instant Search Dropdown Popover */}
                {searchTrim.length > 0 && isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-md shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-amber-900 text-amber-5 px-3 py-1.5 text-[11px] font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-amber-300" />
                        <span>Azonnali találatok ("{searchQuery}")</span>
                      </span>
                      <span className="text-[10px] bg-amber-800 text-amber-100 px-2 py-0.5 rounded-full font-bold">
                        {instantMatchingItems.length} étel
                      </span>
                    </div>

                    {instantMatchingItems.length === 0 ? (
                      <div className="p-4 text-center text-xs text-stone-500 font-medium">
                        Nincs a keresésnek megfelelő étel a vásárban.
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                        {instantMatchingItems.map((item) => {
                          const exhibitor = exhibitors.find((ex) => ex.id === item.exhibitor_id);
                          const isVoted = votedItemIds.includes(item.id);

                          return (
                            <div
                              key={item.id}
                              className="p-3 hover:bg-amber-50/60 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                              onClick={() => {
                                setSearchQuery(item.name);
                                setIsSearchFocused(false);
                                setMainTab('food');
                              }}
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm group-hover:text-amber-800 transition-colors truncate">
                                    {item.name}
                                  </h4>
                                </div>

                                {item.description && (
                                  <p className="text-[11px] text-stone-500 truncate leading-tight">
                                    {item.description}
                                  </p>
                                )}

                                {exhibitor && (
                                  <div className="flex items-center gap-1 text-[10px] text-amber-800 font-bold">
                                    <MapPin className="w-2.5 h-2.5 text-amber-700 flex-shrink-0" />
                                    <span className="truncate">{exhibitor.name} • {exhibitor.location}</span>
                                  </div>
                                )}
                              </div>

                              {/* Vote action right inside dropdown */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  voteForItem(item.id);
                                }}
                                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all border ${
                                  isVoted
                                    ? 'bg-emerald-800 text-white border-emerald-800'
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                                }`}
                              >
                                <ThumbsUp className={`w-3 h-3 ${isVoted ? 'fill-white' : 'text-amber-800'}`} />
                                <span>{isVoted ? `(Szavazva)` : `(${item.votes || 0})`}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="bg-stone-50 p-2 border-t border-stone-100 text-center">
                      <button
                        onClick={() => {
                          setIsSearchFocused(false);
                          setMainTab('food');
                        }}
                        className="text-[11px] text-amber-800 hover:text-amber-900 font-extrabold flex items-center justify-center gap-1 mx-auto"
                      >
                        <span>Összes találat megtekintése a Katalógusban →</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenHamburger={() => setIsHamburgerOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        setMainTab={setMainTab}
      />

      {/* Modals & Drawers */}
      <HamburgerMenuDrawer
        isOpen={isHamburgerOpen}
        onClose={() => setIsHamburgerOpen(false)}
        mainTab={mainTab}
        setMainTab={setMainTab}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedZone={selectedZone}
        setSelectedZone={setSelectedZone}
        setIsInfoOpen={setIsInfoOpen}
        setIsFavoritesOpen={setIsFavoritesOpen}
      />
      <OrsolyaInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        onOpenScanner={() => setIsScannerOpen(true)}
      />
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </>
  );
}
