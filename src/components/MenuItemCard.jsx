import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Flame, Clock, Plus, Check, AlertCircle, Heart } from 'lucide-react';

export default function MenuItemCard({ item, exhibitor }) {
  const { addToCart, cart } = useOrsolya();

  const cartItem = cart.find((c) => c.item.id === item.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const isSoldOut = item.stock <= 0 || item.status === 'sold_out';
  const isCooking = item.status === 'cooking';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 transition-all hover:border-amber-500/40 shadow-sm flex flex-col justify-between group">
      <div>
        {/* Header & Badges */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 transition-colors">
            {item.name}
          </h3>

          {/* Portion/Status Badge */}
          {isSoldOut ? (
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
              Elfogyott
            </span>
          ) : isCooking ? (
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3 animate-spin" />
              Főzés alatt (~{item.eta_minutes || 15}p)
            </span>
          ) : (
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
              🔥 {item.stock} adag
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
          {item.description}
        </p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-medium px-2 py-0.5 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Donation info & Action */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          <Heart className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Adományos kóstolás</span>
        </div>

        <button
          onClick={() => addToCart(item)}
          disabled={isSoldOut}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            isSoldOut
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              : inCartQty > 0
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 shadow-sm'
          }`}
        >
          {inCartQty > 0 ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{inCartQty} adag foglalva</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Kóstoló foglalása</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
