import React, { useState } from 'react';
import { OrsolyaProvider, useOrsolya } from './context/OrsolyaContext';
import Header from './components/Header';
import ExhibitorCard from './components/ExhibitorCard';
import ExhibitorDashboard from './components/ExhibitorAdmin/ExhibitorDashboard';
import CartDrawer from './components/CartDrawer';
import MyOrdersModal from './components/MyOrdersModal';
import MapView from './components/MapView';
import LiveTVBoard from './components/LiveTVBoard';
import VisitKoszegLogo from './components/VisitKoszegLogo';
import { Flame, Utensils, MapPin, Clock, Info, CheckCircle2, Tv } from 'lucide-react';
import './App.css';

function MainApp() {
  const { activeView, exhibitors, menuItems, activeExhibitor, toastMessage } = useOrsolya();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter exhibitors & items based on search & category
  const filteredExhibitors = exhibitors.filter((ex) => {
    const exItems = menuItems.filter((i) => i.exhibitor_id === ex.id);

    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  if (activeView === 'tv') {
    return <LiveTVBoard />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border animate-in slide-in-from-bottom duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-red-600 text-white border-red-500'
              : toastMessage.type === 'success'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
              : 'bg-slate-800 text-amber-300 border-amber-500/40'
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

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'exhibitor' ? (
          <ExhibitorDashboard />
        ) : activeView === 'map' ? (
          <MapView />
        ) : (
          /* Visitor Main View */
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/50 border border-amber-500/20 p-6 sm:p-10 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>KŐSZEGI ORSOLYA-NAPI GASZTRO & KÉZMŰVES VÁSÁR</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                  Kóstolj bele a kőszegi ősz ízeibe valós időben!
                </h1>

                <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
                  Kövesd a Jurisics tér és a Fő tér bográcsainak rotyogását élőben! Rendelj elő, foglald le kedvenc ételeidet és réteseidet várakozás nélkül.
                </p>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Nyitvatartás
                    </span>
                    <span className="text-sm font-extrabold text-amber-400">09:00 - 20:00</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Helyszínek
                    </span>
                    <span className="text-sm font-extrabold text-white">Jurisics & Fő tér</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Árusok száma
                    </span>
                    <span className="text-sm font-extrabold text-emerald-400">
                      {exhibitors.length} Stand
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Friss adagok
                    </span>
                    <span className="text-sm font-extrabold text-amber-400">
                      {menuItems.reduce((s, i) => s + i.stock, 0)} adag kapható
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exhibitors List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Utensils className="w-6 h-6 text-amber-500" />
                  <span>Orsolya-Napi Kiállítók & Ételkínálat</span>
                </h2>
                <span className="text-xs text-slate-400 font-semibold">
                  {filteredExhibitors.length} találat
                </span>
              </div>

              {filteredExhibitors.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                  <Info className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-base font-bold text-white">Sajnos nincs találat a keresési feltételekre.</p>
                  <p className="text-xs text-slate-500 mt-1">Próbáld meg törölni a keresőt vagy válaszd az "Összes kínálat" kategóriát.</p>
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

      {/* Cart Drawer & Modals */}
      <CartDrawer />
      <MyOrdersModal />

      {/* Official Footer with VisitKoszeg Logo */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-2">
            <VisitKoszegLogo showTagline={true} size="md" />
            <p className="text-xs text-slate-300 max-w-md mt-1">
              Az Orsolya-napi országos vásár hivatalos valós idejű látogatói és kiállítói alkalmazása. A VisitKőszeg városi platform része.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end text-xs text-slate-400 gap-1">
            <span className="font-semibold text-slate-300">© 2026 VisitKőszeg.hu & OrsolyaApp</span>
            <span>Jurisics tér • Fő tér • Kőszeg</span>
            <span className="text-amber-500/80 font-mono text-[10px] mt-1">
              Powered by KőszegApp Realtime Engine
            </span>
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
