import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { Flame, Clock, Plus, Check, AlertCircle } from 'lucide-react';

export default function MenuItemCard({ item, exhibitor }) {
  const { addToCart, cart } = useOrsolya();

  const cartItem = cart.find((c) => c.item.id === item.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const isSoldOut = item.stock <= 0 || item.status === 'sold_out';
  const isCooking = item.status === 'cooking';

  return (
    <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-lg">
      <div>
        {/* Image & Badges */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-900">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

          {/* Real-time Stock Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {isSoldOut ? (
              <span className="bg-red-500/90 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-md backdrop-blur-md flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Elfogyott
              </span>
            ) : isCooking ? (
              <span className="bg-amber-500/90 text-slate-950 font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-md backdrop-blur-md flex items-center gap-1 animate-pulse">
                <Clock className="w-3 h-3" />
                Főzés alatt ~ {item.eta_minutes || 15} p
              </span>
            ) : item.stock <= 10 ? (
              <span className="bg-red-600 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3" />
                🔥 Utolsó {item.stock} adag!
              </span>
            ) : (
              <span className="bg-emerald-500 text-slate-950 font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Még {item.stock} adag
              </span>
            )}
          </div>

          {/* Exhibitor badge */}
          {exhibitor && (
            <div className="absolute bottom-2 left-3 right-3 truncate text-amber-400 text-xs font-semibold">
              📍 {exhibitor.name}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
            {item.name}
          </h3>
          <p className="text-slate-300 text-xs mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-slate-700/60 border border-slate-600/50 text-amber-300/90 text-[10px] font-medium px-2 py-0.5 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer / Price & Add Button */}
      <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-700/50 mt-2">
        <div>
          <span className="text-xs text-slate-400 block">Ár adagonként</span>
          <span className="text-lg font-extrabold text-white">
            {item.price.toLocaleString('hu-HU')} Ft
          </span>
        </div>

        <button
          onClick={() => addToCart(item)}
          disabled={isSoldOut}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md ${
            isSoldOut
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : inCartQty > 0
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
              : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
          }`}
        >
          {inCartQty > 0 ? (
            <>
              <Check className="w-4 h-4" />
              <span>{inCartQty} a kosárban</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Kosárba</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
