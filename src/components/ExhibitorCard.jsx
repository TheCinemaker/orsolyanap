import React from 'react';
import MenuItemCard from './MenuItemCard';
import { MapPin, Phone, Megaphone, CheckCircle2 } from 'lucide-react';

export default function ExhibitorCard({ exhibitor, items }) {
  return (
    <div className="bg-slate-900/80 border border-amber-500/20 rounded-3xl overflow-hidden shadow-2xl mb-8">
      {/* Header Banner */}
      <div className="relative h-48 sm:h-56 w-full bg-slate-950">
        <img
          src={exhibitor.image}
          alt={exhibitor.name}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/90 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md">
                STAND
              </span>
              <div className="flex items-center gap-1 text-slate-300 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{exhibitor.location}</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {exhibitor.name}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-0.5 max-w-2xl">
              {exhibitor.description}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            {exhibitor.phone && (
              <a
                href={`tel:${exhibitor.phone}`}
                className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl text-amber-400 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Hívás</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Live Notice Broadcast Bar */}
      {exhibitor.notice && (
        <div className="bg-amber-500/10 border-y border-amber-500/20 px-6 py-2.5 flex items-center gap-3">
          <Megaphone className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
          <span className="text-xs sm:text-sm font-semibold text-amber-200">
            {exhibitor.notice}
          </span>
        </div>
      )}

      {/* Items Grid */}
      <div className="p-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          Étlap & Kínálat (Valós idejű adagok)
        </h4>

        {items.length === 0 ? (
          <p className="text-slate-500 text-sm italic py-4">Jelenleg nincs elérhető étel a standnál.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <MenuItemCard key={item.id} item={item} exhibitor={exhibitor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
