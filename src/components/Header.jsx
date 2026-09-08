import React, { useState } from 'react';
import VisitKoszegLogo from './VisitKoszegLogo';
import OrsolyaInfoModal from './OrsolyaInfoModal';
import FavoritesModal from './FavoritesModal';
import QRScannerModal from './QRScannerModal';
import MobileBottomNav from './MobileBottomNav';
import { useOrsolya } from '../context/OrsolyaContext';
import { Utensils, MapPin, Store, Heart, Search, X, Info, QrCode } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory }) {
  const {
    activeView,
    setActiveView,
    activeExhibitor,
    favoriteExhibitorIds
  } = useOrsolya();

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const categories = [
    { id: 'all', label: 'Összes kínálat' },
    { id: 'bogracs', label: 'Bogrács & Meleg étel' },
    { id: 'ital', label: 'Borok & Must' },
    { id: 'desszert', label: 'Rétes & Sütemény' }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-stone-200/80 shadow-xs">
        {/* Event Banner */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-rose-900 text-amber-50 text-[10px] sm:text-[11px] font-semibold px-3 py-1 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span className="truncate uppercase tracking-wider font-bold">KŐSZEGI ORSOLYA-NAPI VÁSÁR • DIÁKSÉTÁNY</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 opacity-90 text-[11px]">
            <span>🍁 Natúrpark Ízei</span>
            <span>⏱️ 09:00 - 20:00</span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Logo with 5-second long press to trigger Exhibitor Login */}
          <VisitKoszegLogo onLongPress5s={() => setActiveView('login')} />

          {/* Navigation Tabs (Desktop Apple Segmented Style) */}
          <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/80">
            <button
              onClick={() => setActiveView('visitor')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs transition-all ${
                activeView === 'visitor'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-700" />
              <span>Árusok & Ételek</span>
            </button>

            <button
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs transition-all ${
                activeView === 'map'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>Diáksétány Térkép</span>
            </button>

            {/* Info Button */}
            <button
              onClick={() => setIsInfoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-800 hover:bg-stone-200/60 transition-all"
            >
              <Info className="w-3.5 h-3.5 text-amber-700" />
              <span>Vásár Info</span>
            </button>
          </div>

          {/* Right Actions (Desktop & Tablet) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Kedvencek (Beszkennelt Standok) Button */}
            <button
              onClick={() => setIsFavoritesOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-all border border-stone-200"
            >
              <Heart className="w-3.5 h-3.5 text-rose-700 fill-rose-700 flex-shrink-0" />
              <span className="hidden sm:inline">Kedvencek</span>
              {favoriteExhibitorIds.length > 0 && (
                <span className="bg-rose-700 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {favoriteExhibitorIds.length}
                </span>
              )}
            </button>

            {/* QR Scan Button */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl bg-amber-800 text-white hover:bg-amber-700 transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold px-2.5 sm:px-3"
              title="QR Kód Beolvasása"
            >
              <QrCode className="w-4 h-4 text-white flex-shrink-0" />
              <span className="hidden sm:inline">QR Olvasó</span>
            </button>

            {/* If Logged in as Exhibitor */}
            {activeExhibitor && (
              <button
                onClick={() => setActiveView('exhibitor')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="max-w-[90px] truncate hidden sm:inline">{activeExhibitor.name}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar (Visitor view) */}
        {activeView === 'visitor' && (
          <div className="border-t border-stone-200/70 px-3 sm:px-4 py-2 bg-stone-50/80">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Keresés étel, árus, bogrács..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-amber-800 text-white font-bold shadow-xs'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80 font-medium'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Modals */}
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
