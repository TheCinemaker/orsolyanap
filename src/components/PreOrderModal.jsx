import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, Clock, User, Phone, CheckCircle, Utensils } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PreOrderModal({ exhibitor, onClose }) {
  const { cart, placeOrder, setIsMyOrdersOpen } = useOrsolya();

  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('12:45');
  const [completedOrder, setCompletedOrder] = useState(null);

  const exhibitorItems = cart.filter((c) => c.item.exhibitor_id === exhibitor.id);
  const totalAmount = exhibitorItems.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  const timeSlots = ['12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '14:00', '14:30'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) return;

    const order = placeOrder(userName, userPhone, pickupTime, exhibitor.id);
    if (order) {
      setCompletedOrder(order);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.warn('Confetti fail', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {!completedOrder ? (
          <>
            <div className="mb-6">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-md">
                STAND ELŐRENDELÉS
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">{exhibitor.name}</h2>
              <p className="text-xs text-slate-400">📍 {exhibitor.location}</p>
            </div>

            {/* Order Items Summary */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 mb-5 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Rendelt Ételek:
              </h4>
              {exhibitorItems.map(({ item, quantity }) => (
                <div key={item.id} className="flex justify-between text-xs text-slate-200">
                  <span>
                    {quantity}x {item.name}
                  </span>
                  <span className="font-bold">
                    {(item.price * quantity).toLocaleString('hu-HU')} Ft
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-extrabold text-amber-400">
                <span>Fizetendő helyszínen:</span>
                <span>{totalAmount.toLocaleString('hu-HU')} Ft</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Neved</span>
                </label>
                <input
                  type="text"
                  placeholder="Pl. Kovács István"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Telefonszámod (Értesítéshez)</span>
                </label>
                <input
                  type="tel"
                  placeholder="Pl. +36 30 123 4567"
                  required
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kívánt Átvételi Idősáv</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setPickupTime(slot)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        pickupTime === slot
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Utensils className="w-4 h-4" />
                <span>Rendelés & Foglalás Véglegesítése</span>
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                SIKERES FOGLALÁS
              </span>
              <h2 className="text-2xl font-black text-white mt-2">Köszönjük a rendelést!</h2>
              <p className="text-xs text-slate-400 mt-1">
                A stand elmentette a foglalásod. Várunk szeretettel a helyszínen!
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-left space-y-2">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <span className="text-xs text-slate-400">Rendelés azonosító:</span>
                <span className="font-mono text-base font-black text-amber-400">
                  #{completedOrder.id}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Stand:</span>
                <span className="font-bold text-white">{exhibitor.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Átvételi időpont:</span>
                <span className="font-bold text-amber-400">kb. {completedOrder.pickup_time}-kor</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  setIsMyOrdersOpen(true);
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg"
              >
                Rendelés Nyomonkövetése
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
