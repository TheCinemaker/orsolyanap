import React, { useState } from 'react';
import VisitKoszegLogo from './VisitKoszegLogo';
import { useOrsolya } from '../context/OrsolyaContext';
import { 
  ShoppingBag, 
  MapPin, 
  Store, 
  Tv, 
  Clock, 
  Utensils, 
  Search,
  Key,
  X,
  ChevronRight,
  Flame
} from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory }) {
  const {
    activeView,
    setActiveView,
    activeExhibitor,
    cart,
    setIsCartOpen,
    myOrderIds,
    orders,
    setIsMyOrdersOpen,
    loginExhibitor
  } = useOrsolya();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const activeUserOrders = orders.filter(
    (o) => myOrderIds.includes(o.id) && o.status !== 'completed' && o.status !== 'cancelled'
  );

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginExhibitor(pinInput)) {
      setPinInput('');
      setIsLoginModalOpen(false);
    }
  };

  const categories = [
    { id: 'all', label: 'Összes kínálat', icon: Utensils },
    { id: 'bogracs', label: '🔥 Bográcsos & Meleg étel', icon: Flame },
    { id: 'ital', label: '🍷 Borok & Must', icon: Utensils },
    { id: 'desszert', label: '🥐 Rétes & Kürtős', icon: Utensils }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/20 text-white shadow-xl">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
            </span>
            <span className="truncate font-bold tracking-wide uppercase">
              Kőszegi Orsolya-Napi Országos Kézműves & Gasztro Vásár
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px] opacity-90">
            <span>📍 Jurisics tér & Fő tér</span>
            <span>⏱️ 09:00 - 20:00</span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="cursor-pointer" onClick={() => setActiveView('visitor')}>
            <VisitKoszegLogo showTagline={true} size="md" />
          </div>

          {/* Navigation Modes */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveView('visitor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                activeView === 'visitor'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Vásárlói Felület</span>
            </button>

            <button
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                activeView === 'map'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Térkép & Standok</span>
            </button>

            {/* Live TV Board Display Mode Button */}
            <button
              onClick={() => setActiveView('tv')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-extrabold transition-all ${
                activeView === 'tv'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-amber-400 hover:bg-slate-700/50'
              }`}
            >
              <Tv className="w-4 h-4 text-red-500" />
              <span>📺 TV Kijelző</span>
            </button>

            {activeExhibitor ? (
              <button
                onClick={() => setActiveView('exhibitor')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                  activeView === 'exhibitor'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-emerald-400 hover:bg-slate-700/50'
                }`}
              >
                <Store className="w-4 h-4" />
                <span className="truncate max-w-[120px]">{activeExhibitor.name}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-semibold text-emerald-400 hover:bg-slate-700/50 transition-all"
              >
                <Key className="w-4 h-4" />
                <span>Árus Belépés</span>
              </button>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* TV Display Button (Mobile) */}
            <button
              onClick={() => setActiveView(activeView === 'tv' ? 'visitor' : 'tv')}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-amber-400 border border-slate-700"
              title="TV Kijelző Mód"
            >
              <Tv className="w-5 h-5 text-red-500" />
            </button>

            {/* My Orders Button */}
            {myOrderIds.length > 0 && (
              <button
                onClick={() => setIsMyOrdersOpen(true)}
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs sm:text-sm font-medium transition-all"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Rendeléseim</span>
                {activeUserOrders.length > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full text-[10px] animate-pulse">
                    {activeUserOrders.length}
                  </span>
                )}
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Kosár</span>
              {cartItemsCount > 0 && (
                <span className="bg-slate-950 text-amber-400 font-extrabold px-2 py-0.5 rounded-full text-xs">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Mobile Exhibitor / Login Quick Button */}
            <div className="md:hidden">
              {activeExhibitor ? (
                <button
                  onClick={() => setActiveView(activeView === 'exhibitor' ? 'visitor' : 'exhibitor')}
                  className="p-2 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40"
                  title="Árus Portál"
                >
                  <Store className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="p-2 rounded-xl bg-slate-800 text-amber-400 border border-slate-700"
                  title="Árus Belépés"
                >
                  <Key className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Visitor Filter Bar (Show in Visitor view) */}
        {activeView === 'visitor' && (
          <div className="bg-slate-950/80 border-t border-slate-800 px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Keresés étel, árus, bogrács..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
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

      {/* Exhibitor Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
                <Store className="w-7 h-7 text-slate-950" />
              </div>
              <h2 className="text-xl font-bold text-white">Kiállítói & Stand Belépés</h2>
              <p className="text-xs text-slate-400 mt-1">
                Lépj be a standod PIN kódjával a valós idejű adagszámláló és rendeléskezelő felületre.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Stand PIN Kód
                </label>
                <input
                  type="password"
                  placeholder="Kód (pl. 1234, 2345, 3456)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full text-center text-xl tracking-widest font-mono py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Belépés a Standra</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
              <span>Demó PIN kódok: </span>
              <span className="font-mono text-amber-400">1234</span> (Jurisics Vár),{' '}
              <span className="font-mono text-amber-400">2345</span> (Borosgazdák),{' '}
              <span className="font-mono text-amber-400">3456</span> (Rétesház)
            </div>
          </div>
        </div>
      )}
    </>
  );
}
