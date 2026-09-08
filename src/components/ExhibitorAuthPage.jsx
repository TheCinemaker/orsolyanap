import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import VisitKoszegLogo from './VisitKoszegLogo';
import { Key, ArrowRight, ShieldCheck, Store, Utensils } from 'lucide-react';

export default function ExhibitorAuthPage() {
  const { loginExhibitor, setActiveView } = useOrsolya();
  const [pinInput, setPinInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginExhibitor(pinInput)) {
      setPinInput('');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {/* Top Header */}
        <div className="text-center space-y-3 mb-8">
          <VisitKoszegLogo />
          <div className="pt-2">
            <span className="text-[10px] font-bold tracking-widest text-amber-600 dark:text-amber-500 uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              ORSOLYA-NAPI ÁRUS PORTÁL
            </span>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mt-3">
              Árus & Stand Belépés
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Lépj be a standod PIN kódjával az adagszámok, a bemutatkozás és az ételek kezeléséhez.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Stand PIN Kód
            </label>
            <div className="relative">
              <Key className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                placeholder="Pl. 1234"
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Belépés a Stand Felületre</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400 mb-2">Demó belépési kódok:</p>
          <div className="flex flex-wrap justify-center gap-2 text-[11px] font-mono">
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-lg">
              1234 (Jurisics Vár)
            </span>
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-lg">
              2345 (Borosgazdák)
            </span>
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-lg">
              3456 (Rétesház)
            </span>
          </div>
        </div>

        <button
          onClick={() => setActiveView('visitor')}
          className="mt-6 w-full text-center text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          ← Vissza a látogatói felületre
        </button>
      </div>
    </div>
  );
}
