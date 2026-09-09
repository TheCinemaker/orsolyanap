import React, { useState } from 'react';
import { OrsolyaProvider, useOrsolya } from './context/OrsolyaContext';
import Header from './components/Header';
import ExhibitorCard from './components/ExhibitorCard';
import CompactExhibitorCard from './components/CompactExhibitorCard';
import ExhibitorDetailModal from './components/ExhibitorDetailModal';
import InlineQRScanner from './components/InlineQRScanner';
import FoodCatalogView from './components/FoodCatalogView';
import ExhibitorDashboard from './components/ExhibitorAdmin/ExhibitorDashboard';
import ExhibitorAuthPage from './components/ExhibitorAuthPage';
import CartDrawer from './components/CartDrawer';
import MyOrdersModal from './components/MyOrdersModal';
import MapView from './components/MapView';
import VisitKoszegLogo from './components/VisitKoszegLogo';
import { Utensils, Info, CheckCircle2, MapPin, LayoutGrid, List, Flame, Heart, ChevronDown, Store } from 'lucide-react';
import './App.css';

function MainApp() {
  const { activeView, exhibitors, menuItems, favoriteExhibitorIds, toastMessage } = useOrsolya();

  const [mainTab, setMainTab] = useState('tents'); // 'tents' | 'food'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all'); // 'all' | 'zone-1' | 'zone-2' | 'zone-3'
  const [viewMode, setViewMode] = useState('compact'); // 'compact' | 'detailed'
  const [showOnlyCooking, setShowOnlyCooking] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const [selectedDetailExhibitor, setSelectedDetailExhibitor] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12); // Batch pagination for 100+ items

  // Zone filters definitions
  const zones = [
    { id: 'all', label: 'Összes Stand (1-100)' },
    { id: 'zone-1', label: '1-30. Vár felőli kapu' },
    { id: 'zone-2', label: '31-70. Patakpart sáv' },
    { id: 'zone-3', label: '71-100. Színpad & Park' }
  ];

  const filteredExhibitors = exhibitors.filter((ex) => {
    const exItems = menuItems.filter((i) => i.exhibitor_id === ex.id);

    // Search query matching
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.story && ex.story.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exItems.some(
        (i) =>
          i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Category matching
    const matchesCategory =
      selectedCategory === 'all' ||
      ex.category === selectedCategory ||
      exItems.some((i) => i.category === selectedCategory);

    // Zone matching based on stand number string
    const standNumMatch = ex.location.match(/\d+/);
    const standNum = standNumMatch ? parseInt(standNumMatch[0], 10) : 1;

    const matchesZone =
      selectedZone === 'all' ||
      (selectedZone === 'zone-1' && standNum <= 30) ||
      (selectedZone === 'zone-2' && standNum > 30 && standNum <= 70) ||
      (selectedZone === 'zone-3' && standNum > 70);

    // Filter toggles
    const matchesCooking = !showOnlyCooking || (ex.notice && ex.notice.length > 0);
    const matchesFavorites = !showOnlyFavorites || favoriteExhibitorIds.includes(ex.id);

    return matchesSearch && matchesCategory && matchesZone && matchesCooking && matchesFavorites;
  });

  const visibleExhibitors = filteredExhibitors.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-stone-900 flex flex-col justify-between font-sans selection:bg-amber-600 selection:text-white pb-20 md:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl shadow-xl font-semibold text-xs flex items-center gap-2 border animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-800 text-white border-rose-700'
              : toastMessage.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-700'
              : 'bg-stone-900 text-white border-stone-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        mainTab={mainTab}
        setMainTab={setMainTab}
        selectedZone={selectedZone}
        setSelectedZone={setSelectedZone}
      />

      {/* Main View Switcher */}
      <main className="flex-1">
        {activeView === 'exhibitor' ? (
          <ExhibitorDashboard />
        ) : activeView === 'login' ? (
          <ExhibitorAuthPage />
        ) : activeView === 'map' ? (
          <MapView />
        ) : (
          /* Visitor Main View */
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {/* Hero Section */}
            <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-8 shadow-xs relative overflow-hidden">
              <div className="max-w-2xl space-y-3 relative z-10">
                <span className="text-[10px] font-extrabold tracking-widest text-amber-800 uppercase bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300/60 inline-flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-amber-700" />
                  <span>ORSOLYA-NAPI VÁSÁR – NATÚRPARK ÍZEI FESZTIVÁL</span>
                </span>

                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
                  Civil Ízek Utcája
                </h1>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                  A kőszegi Diáksétányon rotyogó civil bográcsok, adományos főzések és vásári standok nyomon követése.
                </p>

                {/* Main View Mode Switcher: 50 Sátor vs 200 Étel Katalógus */}
                <div className="pt-2">
                  <div className="inline-flex items-center gap-1 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/90 w-full sm:w-auto">
                    <button
                      onClick={() => setMainTab('tents')}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-extrabold transition-all ${
                        mainTab === 'tents'
                          ? 'bg-amber-800 text-white shadow-xs'
                          : 'text-stone-700 hover:bg-stone-200/60 font-bold'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>50 Sátor Nézet</span>
                    </button>

                    <button
                      onClick={() => setMainTab('food')}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-extrabold transition-all ${
                        mainTab === 'food'
                          ? 'bg-amber-800 text-white shadow-xs'
                          : 'text-stone-700 hover:bg-stone-200/60 font-bold'
                      }`}
                    >
                      <Utensils className="w-4 h-4" />
                      <span>200 Étel Katalógus</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            {mainTab === 'food' ? (
              <FoodCatalogView
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            ) : (
              <>
                {/* Filters Bar for 100+ Exhibitors */}
                <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
              {/* Top Control Bar: View Mode Switcher & Zone Selector */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                {/* Zone Select Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                  {zones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => {
                        setSelectedZone(zone.id);
                        setVisibleCount(12);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        selectedZone === zone.id
                          ? 'bg-amber-800 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                      }`}
                    >
                      {zone.label}
                    </button>
                  ))}
                </div>

                {/* Grid / List Mode Toggle */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 self-start sm:self-center">
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      viewMode === 'compact'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="Kompakt Ráccsbeosztás"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">Kompakt Ráccs</span>
                  </button>

                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      viewMode === 'detailed'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="Részletes Lista"
                  >
                    <List className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">Kifejtett Lista</span>
                  </button>
                </div>
              </div>

              {/* Status Quick Filter Toggles */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <button
                  onClick={() => setShowOnlyCooking((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    showOnlyCooking
                      ? 'bg-amber-100 border-amber-400 text-amber-900 font-extrabold'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-700" />
                  <span>Csak élőben főző standok</span>
                </button>

                <button
                  onClick={() => setShowOnlyFavorites((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    showOnlyFavorites
                      ? 'bg-rose-100 border-rose-300 text-rose-800 font-extrabold'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-rose-600" />
                  <span>Csak a Kedvenceim ({favoriteExhibitorIds.length})</span>
                </button>
              </div>
            </div>

            {/* Exhibitors Grid/List Feed */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Standok a Diáksétányon</span>
                </h2>
                <span className="text-xs text-stone-500 font-bold bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                  Megjelenítve: {visibleExhibitors.length} / {filteredExhibitors.length} stand
                </span>
              </div>

              {filteredExhibitors.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-12 text-center text-stone-400">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-bold text-stone-700">Nincs a szűrésnek megfelelő stand.</p>
                </div>
              ) : viewMode === 'compact' ? (
                /* Compact 2-Column Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {visibleExhibitors.map((exhibitor) => {
                    const exItems = menuItems.filter(
                      (item) =>
                        item.exhibitor_id === exhibitor.id &&
                        (selectedCategory === 'all' || item.category === selectedCategory)
                    );

                    return (
                      <CompactExhibitorCard
                        key={exhibitor.id}
                        exhibitor={exhibitor}
                        items={exItems}
                        onOpenDetails={(ex) => setSelectedDetailExhibitor(ex)}
                      />
                    );
                  })}
                </div>
              ) : (
                /* Detailed Expanded List View */
                <div className="space-y-4">
                  {visibleExhibitors.map((exhibitor) => {
                    const exItems = menuItems.filter(
                      (item) =>
                        item.exhibitor_id === exhibitor.id &&
                        (selectedCategory === 'all' || item.category === selectedCategory)
                    );

                    return (
                      <ExhibitorCard
                        key={exhibitor.id}
                        exhibitor={exhibitor}
                        items={exItems}
                      />
                    );
                  })}
                </div>
              )}

              {/* Batch Pagination Button ("További standok betöltése") */}
              {visibleCount < filteredExhibitors.length && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="px-6 py-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-extrabold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 mx-auto"
                  >
                    <span>További 12 stand betöltése ({visibleCount} / {filteredExhibitors.length})</span>
                    <ChevronDown className="w-4 h-4 text-amber-700" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )}
  </main>

      {/* Detail Modal */}
      {selectedDetailExhibitor && (
        <ExhibitorDetailModal
          exhibitor={selectedDetailExhibitor}
          onClose={() => setSelectedDetailExhibitor(null)}
        />
      )}

      {/* Cart & Modals */}
      <CartDrawer />
      <MyOrdersModal />

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200/80 py-6 sm:py-8 text-xs text-stone-500 mt-8 sm:mt-12 hidden md:block">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <VisitKoszegLogo />
          <div>
            <span className="font-medium">© 2026 VisitKőszeg.hu • Civil Ízek Utcája • Orsolya-Napi Vásár – Natúrpark Ízei Gasztronómiai Fesztivál</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <OrsolyaProvider>
      <MainApp />
    </OrsolyaProvider>
  );
}
