import React, { useState } from 'react';
import VisitKoszegLogo from './VisitKoszegLogo';
import OrsolyaInfoModal from './OrsolyaInfoModal';
import { useOrsolya } from '../context/OrsolyaContext';
import { Utensils, MapPin, Store, Clock, Key, Search, X, Info } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory }) {
  const {
    activeView,
    setActiveView,
    activeExhibitor,
    myOrderIds,
    orders,
    setIsMyOrdersOpen
  } = useOrsolya();

  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const activeUserOrders = orders.filter(
    (o) => myOrderIds.includes(o.id) && o.status !== 'completed'
  );

  const categories = [
    { id: 'all', label: 'Összes' },
    { id: 'bogracs', label: 'Bogrács & Meleg étel' },
    { id: 'ital', label: 'Borok & Must' },
    { id: 'desszert', label: 'Rétes & Sütemény' }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => setActiveView('visitor')} className="text-left focus:outline-none">
            <VisitKoszegLogo />
          </button>

          {/* Navigation Tabs (Apple Segmented Style) */}
          <div className="hidden md:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
            <button
              onClick={() => setActiveView('visitor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'visitor'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Árusok & Ételek</span>
            </button>

            <button
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'map'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Diáksétány Térkép</span>
            </button>

            {/* Info Button */}
            <button
              onClick={() => setIsInfoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-600 dark:text-amber-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Vásár Info</span>
            </button>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-2">
            {/* Info Button (Mobile) */}
            <button
              onClick={() => setIsInfoOpen(true)}
              className="md:hidden p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-amber-600 dark:text-amber-500 border border-zinc-200 dark:border-zinc-800"
              title="Vásár Info"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* My Orders Button */}
            {myOrderIds.length > 0 && (
              <button
                onClick={() => setIsMyOrdersOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-all border border-zinc-200 dark:border-zinc-800"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                <span className="hidden sm:inline">Foglalásaim</span>
                {activeUserOrders.length > 0 && (
                  <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {activeUserOrders.length}
                  </span>
                )}
              </button>
            )}

            {/* Exhibitor Login / Dashboard button */}
            {activeExhibitor ? (
              <button
                onClick={() => setActiveView('exhibitor')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="max-w-[100px] truncate">{activeExhibitor.name}</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveView('login')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 text-xs font-semibold shadow-sm transition-all"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Árus Belépés</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar (Visitor view) */}
        {activeView === 'visitor' && (
          <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 px-4 py-2 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Keresés..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
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
                    className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800/60'
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

      {/* Orsolya Info Modal */}
      <OrsolyaInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </>
  );
}
