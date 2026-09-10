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
import LiveReelBar from './components/LiveReelBar';
import ReelsGallery from './components/ReelsGallery';
import BackToTopButton from './components/BackToTopButton';
import {
  Utensils,
  Info,
  CheckCircle2,
  MapPin,
  Flame,
  ChevronDown,
  Store,
  Sparkles,
  Cake,
  Cookie,
  CupSoda,
  Package,
  Loader2
} from 'lucide-react';
import './App.css';

function MainApp() {
  const {
    activeView,
    exhibitors,
    menuItems,
    favoriteExhibitorIds,
    toastMessage,
    isLoadingData,
    mainTab,
    setMainTab,
    searchQuery,
    setSearchQuery,
    navigateToFoodCatalog
  } = useOrsolya();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedDetailExhibitor, setSelectedDetailExhibitor] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const intentCategories = [
    { id: 'all', label: 'Összes kínálat', icon: Sparkles },
    { id: 'meleg_etel', label: 'Meleg ételek', icon: Flame },
    { id: 'hideg_etel', label: 'Hideg ételek', icon: Utensils },
    { id: 'sutemeny', label: 'Sütemény', icon: Cake },
    { id: 'street_food', label: 'Street Food', icon: Cookie },
    { id: 'italok', label: 'Italok', icon: CupSoda },
    { id: 'egyeb', label: 'Egyéb', icon: Package }
  ];

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const activeCategoryObj = intentCategories.find((cat) => cat.id === selectedCategory) || intentCategories[0];

  const filteredExhibitors = exhibitors.filter((ex) => {
    const exItems = menuItems.filter((i) => i.exhibitor_id === ex.id);
    const lowerQuery = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !lowerQuery ||
      ex.name.toLowerCase().includes(lowerQuery) ||
      ex.location.toLowerCase().includes(lowerQuery) ||
      (ex.story && ex.story.toLowerCase().includes(lowerQuery)) ||
      (ex.offerings && ex.offerings.toLowerCase().includes(lowerQuery)) ||
      exItems.some(
        (i) =>
          i.name.toLowerCase().includes(lowerQuery) ||
          i.description.toLowerCase().includes(lowerQuery) ||
          (i.tags && i.tags.some((t) => t.toLowerCase().includes(lowerQuery)))
      );

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'italok' && (ex.hasDrinks || ex.category === 'italok' || ex.category === 'ital')) ||
      ex.category === selectedCategory ||
      exItems.some((i) => i.category === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const visibleExhibitors = filteredExhibitors.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-stone-900 flex flex-col justify-between font-sans selection:bg-amber-800 selection:text-white pb-20 md:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 rounded-md shadow-xl font-extrabold text-xs flex items-center gap-2 border animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 text-white border-rose-800'
              : toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-800'
              : 'bg-stone-900 text-white border-stone-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-amber-300" />
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
        ) : activeView === 'reels' ? (
          <ReelsGallery />
        ) : (
          /* Visitor Main View */
          <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-2 pb-4 space-y-4">
            {/* Live Facebook/Instagram Style Reels Bar */}
            <LiveReelBar />

            {/* Top Title Section */}
            <div className="text-center py-1">
              <h1 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-widest">
                CIVIL ÍZEK UTCÁJA
              </h1>
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
                {/* Exhibitors Feed */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <h2 className="text-xs font-black text-stone-950 uppercase tracking-widest flex items-center gap-2">
                      <Store className="w-4 h-4 text-amber-800" />
                      <span>Standok a Diáksétányon ({filteredExhibitors.length})</span>
                    </h2>
                  </div>

                  {isLoadingData ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-amber-900 py-3 bg-amber-50 rounded-md border border-amber-200/80 shadow-2xs">
                        <Loader2 className="w-4 h-4 text-amber-800 animate-spin" />
                        <span>Adatok betöltése a Supabase adatbázisból...</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((sk) => (
                          <div key={sk} className="bg-white border border-stone-200 rounded-md p-4 space-y-3 animate-pulse shadow-xs">
                            <div className="flex justify-between items-center">
                              <div className="h-4 bg-stone-200 rounded-md w-1/3" />
                              <div className="h-4 bg-stone-100 rounded-full w-1/4" />
                            </div>
                            <div className="h-6 bg-stone-300 rounded-md w-3/4" />
                            <div className="h-4 bg-stone-200 rounded-md w-1/2" />
                            <div className="space-y-1.5 pt-2 border-t border-stone-100">
                              <div className="h-3 bg-stone-150 rounded-md w-full" />
                              <div className="h-3 bg-stone-150 rounded-md w-4/5" />
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 pt-2">
                              <div className="h-8 bg-stone-200 rounded-md" />
                              <div className="h-8 bg-stone-200 rounded-md" />
                              <div className="h-8 bg-stone-200 rounded-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : filteredExhibitors.length === 0 ? (
                    <div className="bg-white border border-stone-200 rounded-md p-8 sm:p-12 text-center text-stone-400">
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
                        className="px-6 py-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-extrabold text-xs rounded-md shadow-xs transition-all flex items-center gap-2 mx-auto"
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
          onSelectDish={(item) => {
            setSelectedDetailExhibitor(null);
            navigateToFoodCatalog(item ? item.name : '');
          }}
        />
      )}

      {/* Floating Back To Top Button */}
      <BackToTopButton />

      {/* Cart & Modals */}
      <CartDrawer />
      <MyOrdersModal />

      {/* Clean Footer (Item 9) */}
      <footer className="bg-white border-t border-stone-200/80 py-4 text-xs text-stone-600 mt-6 sm:mt-8 pb-20 md:pb-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center justify-center gap-1.5 text-center leading-tight">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-extrabold text-amber-950 bg-amber-100/90 px-2.5 py-0.5 rounded-md border border-amber-300 uppercase text-[10px] tracking-wider">
              POWERED BY{' '}
              <a
                href="https://visitkoszeg.hu"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-800 transition-colors"
              >
                VISITKOSZEG
              </a>
            </span>
            <span className="font-medium text-stone-500 text-[11px]">
              © 2026 • Civil Ízek Utcája • Orsolya-Napi Vásár
            </span>
          </div>

          <div className="text-[10px] text-stone-400 font-medium pt-0.5">
            developed by:{' '}
            <a
              href="mailto:avar.szilveszter@gmail.com"
              className="underline hover:text-stone-700 transition-colors"
            >
              SA software & Network Solutions
            </a>
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
