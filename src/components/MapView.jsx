import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { MapPin, ArrowRight, Utensils, Compass } from 'lucide-react';

export default function MapView() {
  const { exhibitors, menuItems, setActiveView } = useOrsolya();

  const areas = [
    {
      id: 'jurisics',
      name: 'Jurisics tér',
      description: 'Hagyományos bográcsozók és városi főzések helyszíne',
      stands: exhibitors.filter(
        (ex) => ex.location.includes('Jurisics tér') && !ex.location.includes('Várudvar')
      )
    },
    {
      id: 'foter',
      name: 'Fő tér',
      description: 'Kézműves kirakodóvásár, rétesek és kürtőskalácsok',
      stands: exhibitors.filter((ex) => ex.location.includes('Fő tér'))
    },
    {
      id: 'varudvar',
      name: 'Jurisics Várudvar',
      description: 'Vadételek és erdei különlegességek kóstolója',
      stands: exhibitors.filter((ex) => ex.location.includes('Várudvar'))
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          HELYSZÍNI TÉRKÉP
        </span>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Orsolya-Napi Vásári Térkép
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Kőszeg belvárosának helyszínei és a standok valós idejű adagjai.
        </p>
      </div>

      <div className="space-y-6">
        {areas.map((area) => (
          <div
            key={area.id}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4"
          >
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{area.name}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{area.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {area.stands.map((ex) => {
                const exItems = menuItems.filter((i) => i.exhibitor_id === ex.id);
                const totalStock = exItems.reduce((s, i) => s + i.stock, 0);

                return (
                  <div
                    key={ex.id}
                    onClick={() => setActiveView('visitor')}
                    className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 p-4 rounded-2xl cursor-pointer hover:border-amber-500/50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-500 block">
                          📍 {ex.location}
                        </span>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5 group-hover:text-amber-600 transition-colors">
                          {ex.name}
                        </h4>
                      </div>

                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {totalStock} adag
                      </span>
                    </div>

                    <div className="mt-4 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs text-zinc-500">
                      <span>{exItems.length} féle étel</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Étlap</span>
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
