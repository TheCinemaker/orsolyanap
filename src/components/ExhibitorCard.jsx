import React from 'react';
import MenuItemCard from './MenuItemCard';
import { MapPin, Heart, Info, Megaphone } from 'lucide-react';

export default function ExhibitorCard({ exhibitor, items }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm mb-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              STAND
            </span>
            <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>{exhibitor.location}</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {exhibitor.name}
          </h2>

          {/* Story & Cause */}
          {exhibitor.story && (
            <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-3xl leading-relaxed mt-2">
              {exhibitor.story}
            </p>
          )}

          {exhibitor.cause && (
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 font-medium mt-2">
              <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500 flex-shrink-0" />
              <span><strong>Adomány célja:</strong> {exhibitor.cause}</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Broadcast Notice */}
      {exhibitor.notice && (
        <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
          <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          <span>{exhibitor.notice}</span>
        </div>
      )}

      {/* Items Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Ételeink & Kínálatunk (Adagszámláló)
        </h4>

        {items.length === 0 ? (
          <p className="text-xs text-zinc-400 italic py-2">Jelenleg nincs elérhető étel a standnál.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <MenuItemCard key={item.id} item={item} exhibitor={exhibitor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
