import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { MapPin, ArrowRight, Compass, Waves, Trees, Castle, Heart } from 'lucide-react';

export default function MapView() {
  const { exhibitors, menuItems, favoriteExhibitorIds, setActiveView, addToCart } = useOrsolya();
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
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300/60">
          📍 KŐSZEG DIÁKSÉTÁNY
        </span>
        <h1 className="text-3xl font-extrabold text-stone-900">
          Diáksétány Vásári Térkép
        </h1>
        <p className="text-xs text-stone-600">
          A Gyöngyös-patak mentén húzódó vásári standok, beszkennelt kedvenceid és adagszámok.
        </p>
      </div>

      {/* Promenade Map Card */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Diáksétány Interaktív Sétány Térkép
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">Kattints a stand gombjára a megtekintéshez!</span>
        </div>

        {/* Visual Map Graphic Container */}
        <div className="relative bg-stone-50 border border-stone-200/90 rounded-2xl p-6 min-h-[300px] flex flex-col justify-between overflow-hidden">
          {/* Gyöngyös-patak Stream Line Graphic */}
          <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-sky-100/90 border-y border-sky-300/70 flex items-center justify-around text-sky-800 text-[11px] font-bold tracking-widest pointer-events-none select-none">
            <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5" /> Gyöngyös-patak</span>
            <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5" /> Gyöngyös-patak</span>
            <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5" /> Gyöngyös-patak</span>
          </div>

          {/* West & East Landmarks */}
          <div className="flex justify-between items-center relative z-10 text-xs font-bold text-stone-700">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs">
              <Castle className="w-4 h-4 text-amber-700" />
              <span>Jurisics Vár</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs">
              <Trees className="w-4 h-4 text-emerald-700" />
              <span>Várpark & Színpad</span>
            </div>
          </div>

          {/* Promenade Path & Stand Markers Pins */}
          <div className="relative z-10 my-6 flex items-center justify-between gap-2 overflow-x-auto py-3 px-1 scrollbar-none">
            {exhibitors.map((ex, idx) => {
              const exItems = menuItems.filter((i) => i.exhibitor_id === ex.id);
              const totalStock = exItems.reduce((s, i) => s + i.stock, 0);
              const isSelected = ex.id === selectedExhibitorId;
              const isFavorite = favoriteExhibitorIds.includes(ex.id);

              return (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExhibitorId(ex.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all relative ${
                    isSelected
                      ? 'bg-amber-800 text-white border-amber-800 shadow-md scale-105'
                      : 'bg-white text-stone-900 border-stone-200 hover:border-amber-600'
                  }`}
                >
                  {isFavorite && (
                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow-xs">
                      <Heart className="w-3 h-3 fill-white" />
                    </span>
                  )}

                  <div className="flex items-center gap-1 text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Stand #{idx + 1}</span>
                  </div>

                  <span className={`text-[11px] font-semibold max-w-[110px] truncate ${isSelected ? 'text-white' : 'text-stone-700'}`}>
                    {ex.name}
                  </span>

                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white text-amber-800' : 'bg-emerald-100 text-emerald-900'}`}>
                    {totalStock} adag
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-center text-[11px] font-bold text-stone-500 relative z-10">
            🚶 DIÁKSÉTÁNY FESZTIVÁL SÉTÁNY (KŐSZEG)
          </div>
        </div>

        {/* Selected Stand Details Panel */}
        {selectedExhibitor && (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-stone-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    STAND: {selectedExhibitor.location}
                  </span>
                  {favoriteExhibitorIds.includes(selectedExhibitor.id) && (
                    <span className="text-[10px] font-bold uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-700" /> Beszkennelt Kedvenc
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-stone-900 mt-1">
                  {selectedExhibitor.name}
                </h3>
                {selectedExhibitor.story && (
                  <p className="text-xs text-stone-700 mt-1">
                    {selectedExhibitor.story}
                  </p>
                )}
              </div>

              <button
                onClick={() => setActiveView('visitor')}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs self-start"
              >
                Ugrás az ételekhez →
              </button>
            </div>

            {/* Selected Exhibitor Food Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-400 uppercase">
                Stand kínálata a Diáksétányon:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900 block">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-stone-500">{item.description}</span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-extrabold text-emerald-800 block">
                        {item.stock} adag
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="text-[10px] font-bold text-amber-800 hover:underline"
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
        <h3 className="text-base font-extrabold text-stone-900">
          Diáksétány Zónák & Standok
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white border border-stone-200/90 rounded-2xl p-5 space-y-3 shadow-xs"
            >
              <div>
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                  {zone.badge}
                </span>
                <h4 className="text-base font-bold text-stone-900 mt-0.5">
                  {zone.name}
                </h4>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
                {zone.stands.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => setSelectedExhibitorId(ex.id)}
                    className="p-2.5 rounded-xl bg-stone-50 hover:bg-amber-100/60 cursor-pointer transition-colors flex justify-between items-center border border-stone-200/60"
                  >
                    <div className="flex items-center gap-1.5">
                      {favoriteExhibitorIds.includes(ex.id) && (
                        <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                      )}
                      <div>
                        <span className="font-bold text-stone-900 block">
                          {ex.name}
                        </span>
                        <span className="text-[10px] text-stone-500 font-medium">{ex.location}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
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
