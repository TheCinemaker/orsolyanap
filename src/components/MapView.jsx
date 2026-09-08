import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { MapPin, ArrowRight, Utensils, Compass, Waves, Trees, Castle, Music, Heart, X, CheckCircle2 } from 'lucide-react';

export default function MapView() {
  const { exhibitors, menuItems, setActiveView, addToCart } = useOrsolya();
  const [selectedExhibitorId, setSelectedExhibitorId] = useState(exhibitors[0]?.id || null);

  const selectedExhibitor = exhibitors.find((ex) => ex.id === selectedExhibitorId);
  const selectedItems = menuItems.filter((i) => i.exhibitor_id === selectedExhibitorId);

  const zones = [
    {
      id: 'var-szerep',
      name: 'Vár felőli Szakasz',
      badge: 'BOGRÁCS & MELEG ÉTELEK',
      stands: exhibitors.filter((ex) => ex.location.includes('1.') || ex.location.includes('3.'))
    },
    {
      id: 'kozpont',
      name: 'Központi Sétány & Patakpart',
      badge: 'BOROK, MUST & RÉTESEK',
      stands: exhibitors.filter((ex) => ex.location.includes('5.') || ex.location.includes('8.'))
    },
    {
      id: 'szinpad',
      name: 'Színpad & Park felőli Szakasz',
      badge: 'VADÉTELEK & ERDÉSZET',
      stands: exhibitors.filter((ex) => ex.location.includes('12.'))
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          📍 KŐSZEG DIÁKSÉTÁNY
        </span>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Diáksétány Vásári Térkép
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          A Gyöngyös-patak mentén, a Jurisics Vártól a Parki Színpadig húzódó vásári standok és adagszámok.
        </p>
      </div>

      {/* Interactive Visual Promenade Vector Map */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Diáksétány Interaktív Sétány Térkép
            </h3>
          </div>
          <span className="text-xs text-zinc-400">Kattints a stand gombjára a megtekintéshez!</span>
        </div>

        {/* Visual Map Graphic Container */}
        <div className="relative bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 min-h-[320px] flex flex-col justify-between overflow-hidden">
          {/* Gyöngyös-patak Stream Line Graphic */}
          <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-blue-500/10 border-y border-blue-500/20 flex items-center justify-around text-blue-500/40 text-[10px] font-semibold tracking-widest pointer-events-none select-none">
            <span className="flex items-center gap-1"><Waves className="w-3 h-3" /> Gyöngyös-patak</span>
            <span className="flex items-center gap-1"><Waves className="w-3 h-3" /> Gyöngyös-patak</span>
            <span className="flex items-center gap-1"><Waves className="w-3 h-3" /> Gyöngyös-patak</span>
          </div>

          {/* West & East Landmarks */}
          <div className="flex justify-between items-center relative z-10 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Castle className="w-4 h-4 text-amber-600" />
              <span>Jurisics Vár</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Trees className="w-4 h-4 text-emerald-600" />
              <span>Várpark & Színpad</span>
            </div>
          </div>

          {/* Promenade Path & Stand Markers Pins */}
          <div className="relative z-10 my-8 flex items-center justify-between gap-2 overflow-x-auto py-4 px-2 scrollbar-none">
            {exhibitors.map((ex, idx) => {
              const exItems = menuItems.filter((i) => i.exhibitor_id === ex.id);
              const totalStock = exItems.reduce((s, i) => s + i.stock, 0);
              const isSelected = ex.id === selectedExhibitorId;

              return (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExhibitorId(ex.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-lg scale-105'
                      : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800 hover:border-amber-500'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Stand #{idx + 1}</span>
                  </div>

                  <span className={`text-[11px] font-semibold max-w-[110px] truncate ${isSelected ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {ex.name}
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white text-amber-600' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    {totalStock} adag
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-center text-[11px] text-zinc-400 relative z-10">
            🚶 DIÁKSÉTÁNY FESZTIVÁL SÉTÁNY (KŐSZEG)
          </div>
        </div>

        {/* Selected Stand Details Panel */}
        {selectedExhibitor && (
          <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-700/60 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  KIVÁLASZTOTT STAND: {selectedExhibitor.location}
                </span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                  {selectedExhibitor.name}
                </h3>
                {selectedExhibitor.story && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                    {selectedExhibitor.story}
                  </p>
                )}
              </div>

              <button
                onClick={() => setActiveView('visitor')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-sm self-start"
              >
                Ugrás az ételekhez →
              </button>
            </div>

            {/* Selected Exhibitor Food Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase">
                Stand kínálata a Diáksétányon:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-white block">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-zinc-500">{item.description}</span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                        {item.stock} adag
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="text-[10px] font-semibold text-amber-600 hover:underline"
                      >
                        + Foglalás
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stand Zones Breakdown */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
          Diáksétány Zónák & Standok
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 space-y-3 shadow-sm"
            >
              <div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider block">
                  {zone.badge}
                </span>
                <h4 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                  {zone.name}
                </h4>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                {zone.stands.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => setSelectedExhibitorId(ex.id)}
                    className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-amber-500/10 cursor-pointer transition-colors flex justify-between items-center"
                  >
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-white block">
                        {ex.name}
                      </span>
                      <span className="text-[10px] text-zinc-400">{ex.location}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
