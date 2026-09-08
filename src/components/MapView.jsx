import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { MapPin, Flame, Utensils, Compass, ArrowRight } from 'lucide-react';

export default function MapView({ onSelectExhibitor }) {
  const { exhibitors, menuItems, setActiveView } = useOrsolya();
  const [selectedStand, setSelectedStand] = useState(null);

  // Group exhibitors by area
  const areas = [
    {
      id: 'jurisics',
      name: 'Jurisics tér & Várostorony környéke',
      badge: '🔥 BOGRÁCS ZÓNA',
      color: 'from-amber-600/20 to-red-600/20 border-amber-500/40',
      stands: exhibitors.filter(
        (ex) => ex.location.includes('Jurisics tér') && !ex.location.includes('Várudvar')
      )
    },
    {
      id: 'foter',
      name: 'Fő tér & Kirakodóvásár',
      badge: '🥐 RÉTES & KÉZMŰVES',
      color: 'from-amber-500/20 to-amber-700/20 border-amber-500/30',
      stands: exhibitors.filter((ex) => ex.location.includes('Fő tér'))
    },
    {
      id: 'varudvar',
      name: 'Jurisics Várudvar',
      badge: '🌲 VADÉTELEK & GASTRONOMY',
      color: 'from-emerald-600/20 to-amber-600/20 border-emerald-500/40',
      stands: exhibitors.filter((ex) => ex.location.includes('Várudvar'))
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Compass className="w-4 h-4" />
          <span>Helyszíni Árus Térkép</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Hol mit találsz Kőszegen?
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm">
          Navigálj a Jurisics tér, Fő tér és a Várudvar standjai között valós időben!
        </p>
      </div>

      {/* Visual Interactive Map Layout */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-8">
        {areas.map((area) => (
          <div
            key={area.id}
            className={`bg-gradient-to-r ${area.color} border rounded-2xl p-6 space-y-4 shadow-lg`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
              <div>
                <span className="text-[10px] font-black text-amber-400 tracking-widest uppercase block">
                  {area.badge}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{area.name}</h3>
              </div>
              <span className="text-xs text-slate-300 font-semibold">
                {area.stands.length} aktív stand
              </span>
            </div>

            {/* Stands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {area.stands.map((ex) => {
                const exItems = menuItems.filter((i) => i.exhibitor_id === ex.id);
                const totalStock = exItems.reduce((s, i) => s + i.stock, 0);

                return (
                  <div
                    key={ex.id}
                    onClick={() => {
                      if (onSelectExhibitor) onSelectExhibitor(ex.id);
                      setActiveView('visitor');
                    }}
                    className="bg-slate-900/90 border border-slate-700/80 hover:border-amber-400 p-4 rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-amber-500 text-slate-950 rounded-lg flex items-center justify-center font-black text-xs">
                          📍
                        </span>
                        <div>
                          <h4 className="text-sm font-extrabold text-white group-hover:text-amber-400 transition-colors">
                            {ex.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 block">{ex.location}</span>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {totalStock} adag
                      </span>
                    </div>

                    {ex.notice && (
                      <p className="text-[11px] text-amber-300/90 mt-2.5 line-clamp-1 italic bg-amber-500/10 px-2 py-1 rounded-md">
                        {ex.notice}
                      </p>
                    )}

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>{exItems.length} féle ajánlat</span>
                      <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Étlap megtekintése</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
