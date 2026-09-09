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
import {
  Utensils,
  Info,
  CheckCircle2,
  MapPin,
  LayoutGrid,
  List,
  Flame,
  Heart,
  ChevronDown,
  Store,
  Search,
  X,
  Sparkles,
  Cake,
  Cookie,
  CupSoda,
  Coffee,
  Package
} from 'lucide-react';
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
    { id: 'zone-1', label: '1-15. Várkapu' },
    { id: 'zone-2', label: '16-30. Patakpart' },
    { id: 'zone-3', label: '31-100. Színpad' }
  ];

  const intentCategories = [
    { id: 'all', label: 'Összes kínálat', icon: Sparkles },
    { id: 'meleg_etel', label: 'Meleg étel', icon: Flame },
    { id: 'sutemeny', label: 'Sütemény', icon: Cake },
    { id: 'retes', label: 'Rétes', icon: Cookie },
    { id: 'ital', label: 'Ital kapható', icon: CupSoda },
    { id: 'kave_tea', label: 'Kávé / tea', icon: Coffee },
    { id: 'helyi_termek', label: 'Helyi termék', icon: Package }
  ];

  const filteredExhibitors = exhibitors.filter((ex) => {
    const exItems = menuItems.filter((i) => i.exhibitor_id === ex.id);

    // Tolerant Drink search matching ("ital", "üdítő", "bor", "fröccs", etc.)
    const lowerQuery = searchQuery.trim().toLowerCase();
    const isDrinkSearch = ['ital', 'üdítő', 'bor', 'sör', 'must', 'forralt bor', 'fröccs'].some((s) =>
      lowerQuery.includes(s)
    );

    const matchesSearch =
      !lowerQuery ||
      ex.name.toLowerCase().includes(lowerQuery) ||
      ex.location.toLowerCase().includes(lowerQuery) ||
      (ex.story && ex.story.toLowerCase().includes(lowerQuery)) ||
      (ex.offerings && ex.offerings.toLowerCase().includes(lowerQuery)) ||
      (isDrinkSearch && ex.hasDrinks) ||
      exItems.some(
        (i) =>
          i.name.toLowerCase().includes(lowerQuery) ||
          i.description.toLowerCase().includes(lowerQuery) ||
          (i.tags && i.tags.some((t) => t.toLowerCase().includes(lowerQuery)))
      );

    // Category matching (visitor intent)
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'ital' && (ex.hasDrinks || ex.category === 'ital')) ||
      ex.category === selectedCategory ||
      exItems.some((i) => i.category === selectedCategory);

    // Zone matching based on stand number string
    const standNumMatch = ex.location.match(/\d+/);
    const standNum = standNumMatch ? parseInt(standNumMatch[0], 10) : 1;

    const matchesZone =
      selectedZone === 'all' ||
      (selectedZone === 'zone-1' && standNum <= 15) ||
      (selectedZone === 'zone-2' && standNum > 15 && standNum <= 30) ||
      (selectedZone === 'zone-3' && standNum > 30);

    // Filter toggles
    const matchesCooking = !showOnlyCooking || (ex.notice && ex.notice.length > 0);
    const matchesFavorites = !showOnlyFavorites || favoriteExhibitorIds.includes(ex.id);

    return matchesSearch && matchesCategory && matchesZone && matchesCooking && matchesFavorites;
  });

  const visibleExhibitors = filteredExhibitors.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-stone-900 flex flex-col justify-between font-sans selection:bg-amber-700 selection:text-white pb-20 md:pb-0">
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
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 space-y-6">
            {/* Top Search & Category Section */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
                  Civil Ízek Utcája
                </h1>
              </div>

              {/* Sleek Horizontal Category Pills Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {intentCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const IconComp = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                        isSelected
                          ? 'bg-amber-800 text-white border-amber-900 shadow-xs'
                          : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200'
                      }`}
                    >
                      <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-200' : 'text-amber-800'}`} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
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
                {/* Minimal Zone Filter Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2 border-t border-stone-200/60">
                  {/* Zone Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full sm:w-auto">
                    {zones.map((zone) => (
                      <button
                        key={zone.id}
                        onClick={() => {
                          setSelectedZone(zone.id);
                          setVisibleCount(12);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          selectedZone === zone.id
                            ? 'bg-stone-900 text-white shadow-xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                        }`}
                      >
                        {zone.label}
                      </button>
                    ))}
                  </div>

                  {/* Favorites Filter */}
                  <button
                    onClick={() => setShowOnlyFavorites((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                      showOnlyFavorites
                        ? 'bg-rose-100 border-rose-300 text-rose-800'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-rose-700 text-rose-700' : 'text-rose-600'}`} />
                    <span>Kedvenceim ({favoriteExhibitorIds.length})</span>
                  </button>
                </div>

                {/* Exhibitors Feed */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-amber-800" />
                      <span>Standok a Diáksétányon ({filteredExhibitors.length})</span>
                    </h2>
                  </div>

                  {filteredExhibitors.length === 0 ? (
                    <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-12 text-center text-stone-400">
                      <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-bold text-stone-700">Nincs a keresésnek megfelelő stand.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visibleExhibitors.map((exhibitor) => {
                        const exItems = menuItems.filter((item) => item.exhibitor_id === exhibitor.id);

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
                  )}

                  {/* Batch Pagination Button */}
                  {visibleCount < filteredExhibitors.length && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setVisibleCount((prev) => prev + 12)}
                        className="px-6 py-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-extrabold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 mx-auto"
                      >
                        <span>További standok betöltése ({visibleCount} / {filteredExhibitors.length})</span>
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
