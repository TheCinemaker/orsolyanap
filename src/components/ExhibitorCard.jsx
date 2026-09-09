import React from 'react';
import MenuItemCard from './MenuItemCard';
import { MapPin, Heart, Megaphone } from 'lucide-react';

export default function ExhibitorCard({ exhibitor, items }) {
  return (
    <div className="bg-white border border-stone-200/90 rounded-md p-6 shadow-sm mb-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-100">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/60">
              STAND
            </span>
            <div className="flex items-center gap-1 text-xs text-stone-500 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>{exhibitor.location}</span>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-stone-900">
            {exhibitor.name}
          </h2>

          {/* Story & Cause */}
          {exhibitor.story && (
            <p className="text-xs text-stone-700 max-w-3xl leading-relaxed mt-2">
              {exhibitor.story}
            </p>
          )}

          {exhibitor.cause && (
            <div className="inline-flex items-center gap-1.5 text-xs text-rose-900 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200 font-semibold mt-2">
              <Heart className="w-3.5 h-3.5 fill-rose-700 text-rose-700 flex-shrink-0" />
              <span><strong>Adomány célja:</strong> {exhibitor.cause}</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Broadcast Notice */}
      {exhibitor.notice && (
        <div className="bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-md flex items-center gap-2.5 text-xs font-semibold text-stone-800">
          <Megaphone className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>{exhibitor.notice}</span>
        </div>
      )}

      {/* Items Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
          Ételeink & Kínálatunk (Adagszámláló)
        </h4>

        {items.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-2">Jelenleg nincs elérhető étel a standnál.</p>
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
