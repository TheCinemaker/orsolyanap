import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import PreOrderModal from './PreOrderModal';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, addToCart, removeFromCart, clearCart, exhibitors } = useOrsolya();
  const [selectedExhibitorForCheckout, setSelectedExhibitorForCheckout] = useState(null);

  if (!isCartOpen) return null;

  const totalAmount = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  // Group cart items by exhibitor
  const groupedCart = exhibitors.map((ex) => {
    const items = cart.filter((c) => c.item.exhibitor_id === ex.id);
    return { exhibitor: ex, items };
  }).filter((g) => g.items.length > 0);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
        <div className="bg-slate-900 border-l border-slate-700 w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-extrabold text-lg">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <span>Kosár</span>
              <span className="text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)} adag
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Body */}
          <div className="p-5 flex-1 overflow-y-auto space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">A kosarad jelenleg üres.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Válassz a kőszegi árusok és bográcsozók friss kínálatából!
                </p>
              </div>
            ) : (
              groupedCart.map(({ exhibitor, items }) => {
                const subtotal = items.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

                return (
                  <div
                    key={exhibitor.id}
                    className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                      <div>
                        <h4 className="text-sm font-bold text-amber-400">{exhibitor.name}</h4>
                        <span className="text-[11px] text-slate-400">📍 {exhibitor.location}</span>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {subtotal.toLocaleString('hu-HU')} Ft
                      </span>
                    </div>

                    <div className="space-y-3">
                      {items.map(({ item, quantity }) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex-1">
                            <span className="font-semibold text-white block">{item.name}</span>
                            <span className="text-slate-400">{item.price.toLocaleString('hu-HU')} Ft / adag</span>
                          </div>

                          <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
                            <button
                              onClick={() => addToCart(item, -1)}
                              className="text-slate-400 hover:text-white p-0.5"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-white min-w-[16px] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => addToCart(item, 1)}
                              className="text-amber-400 hover:text-white p-0.5"
                              disabled={quantity >= item.stock}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedExhibitorForCheckout(exhibitor);
                        setIsCartOpen(false);
                      }}
                      className="w-full mt-3 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Előrendelés erről a standról</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-800 bg-slate-950/90 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Végösszeg:</span>
                <span className="text-xl font-black text-amber-400">
                  {totalAmount.toLocaleString('hu-HU')} Ft
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={clearCart}
                  className="px-3 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Ürítés
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pre-Order Modal */}
      {selectedExhibitorForCheckout && (
        <PreOrderModal
          exhibitor={selectedExhibitorForCheckout}
          onClose={() => setSelectedExhibitorForCheckout(null)}
        />
      )}
    </>
  );
}
