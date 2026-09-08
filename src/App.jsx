import React, { useState } from 'react';
import { OrsolyaProvider, useOrsolya } from './context/OrsolyaContext';
import Header from './components/Header';
import ExhibitorCard from './components/ExhibitorCard';
import ExhibitorDashboard from './components/ExhibitorAdmin/ExhibitorDashboard';
import ExhibitorAuthPage from './components/ExhibitorAuthPage';
import CartDrawer from './components/CartDrawer';
import MyOrdersModal from './components/MyOrdersModal';
import MapView from './components/MapView';
import VisitKoszegLogo from './components/VisitKoszegLogo';
import { Flame, Utensils, Info, CheckCircle2, MapPin } from 'lucide-react';
import './App.css';

function MainApp() {
  const { activeView, exhibitors, menuItems, toastMessage } = useOrsolya();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredExhibitors = exhibitors.filter((ex) => {
    const exItems = menuItems.filter((i) => i.exhibitor_id === ex.id);

    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.story && ex.story.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exItems.some(
        (i) =>
          i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === 'all' ||
      ex.category === selectedCategory ||
      exItems.some((i) => i.category === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-white transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl font-semibold text-xs flex items-center gap-2 border animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-red-600 text-white border-red-500'
              : toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-zinc-900 text-white border-zinc-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
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
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            {/* Hero Section */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
              <div className="max-w-2xl space-y-3 relative z-10">
                <span className="text-[10px] font-bold tracking-widest text-amber-600 dark:text-amber-500 uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  📍 KŐSZEG DIÁKSÉTÁNY • ORSOLYA-NAPI VÁSÁR
                </span>

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                  Kőszegi ősz ízei & adományos főzései a Diáksétányon
                </h1>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Kövesd nyomon a Diáksétányon rotyogó bográcsokat, ismerd meg az árusok történetét és foglald le a kóstoló adagokat várakozás nélkül.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase">
                      Helyszín
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      Kőszeg Diáksétány
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase">
                      Árusok
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-500">
                      {exhibitors.length} Stand
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase">
                      Kapható adagok
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {menuItems.reduce((s, i) => s + i.stock, 0)} adag
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exhibitors Feed */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span>Diáksétány Árusok & Főzés Státusz</span>
                </h2>
                <span className="text-xs text-zinc-400">
                  {filteredExhibitors.length} stand
                </span>
              </div>

              {filteredExhibitors.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-zinc-400">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nincs találat.</p>
                </div>
              ) : (
                filteredExhibitors.map((exhibitor) => {
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
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Cart & Modals */}
      <CartDrawer />
      <MyOrdersModal />

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800/80 py-8 text-xs text-zinc-500 dark:text-zinc-400 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <VisitKoszegLogo />
          <div>
            <span>© 2026 VisitKőszeg.hu • Orsolya-Napi Vásár • Kőszeg Diáksétány</span>
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
