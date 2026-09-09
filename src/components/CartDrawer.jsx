import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, MapPin } from 'lucide-react';
import PreOrderModal from './PreOrderModal';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, addToCart, removeFromCart, clearCart, exhibitors } = useOrsolya();
  const [selectedExhibitorForCheckout, setSelectedExhibitorForCheckout] = useState(null);

  if (!isCartOpen) return null;

  // Group cart items by exhibitor
  const groupedCart = exhibitors.map((ex) => {
    const items = cart.filter((c) => c.item.exhibitor_id === ex.id);
    return { exhibitor: ex, items };
  }).filter((g) => g.items.length > 0);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex justify-end">
        <div className="bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 w-full max-w-md h-full flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-base">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>Kóstoló Foglalások</span>
              <span className="text-xs bg-amber-500/10 text-amber-600 font-semibold px-2 py-0.5 rounded-full border border-amber-500/20">
                {cart.reduce((s, i) => s + i.quantity, 0)} adag
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Body */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Nincs kiválasztott kóstoló adag.</p>
              </div>
            ) : (
              groupedCart.map(({ exhibitor, items }) => (
                <div
                  key={exhibitor.id}
                  className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-md p-4 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-700/60">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{exhibitor.name}</h4>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-700 inline" /> {exhibitor.location}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {items.map(({ item, quantity }) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 flex-1 truncate">
                          {item.name}
                        </span>

                        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                          <button
                            onClick={() => addToCart(item, -1)}
                            className="text-zinc-400 hover:text-zinc-700 p-0.5"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-zinc-900 dark:text-white min-w-[16px] text-center">
                            {quantity} adag
                          </span>
                          <button
                            onClick={() => addToCart(item, 1)}
                            className="text-amber-600 hover:text-amber-500 p-0.5"
                            disabled={quantity >= item.stock}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-zinc-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedExhibitorForCheckout(exhibitor);
                      setIsCartOpen(false);
                    }}
                    className="w-full mt-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-md shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Foglalás Véglegesítése</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <button
                onClick={clearCart}
                className="w-full py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold rounded-md"
              >
                Kosár ürítése
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedExhibitorForCheckout && (
        <PreOrderModal
          exhibitor={selectedExhibitorForCheckout}
          onClose={() => setSelectedExhibitorForCheckout(null)}
        />
      )}
    </>
  );
}
