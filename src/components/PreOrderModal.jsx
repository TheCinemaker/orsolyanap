import React, { useState } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, Clock, User, Phone, CheckCircle, Utensils, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PreOrderModal({ exhibitor, onClose }) {
  const { cart, placeOrder, setIsMyOrdersOpen } = useOrsolya();

  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('12:45');
  const [completedOrder, setCompletedOrder] = useState(null);

  const exhibitorItems = cart.filter((c) => c.item.exhibitor_id === exhibitor.id);
  const timeSlots = ['12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '14:00', '14:30'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) return;

    const order = placeOrder(userName, userPhone, pickupTime, exhibitor.id);
    if (order) {
      setCompletedOrder(order);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (err) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-6 w-full max-w-lg shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {!completedOrder ? (
          <>
            <div className="mb-6 space-y-1">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                KÓSTOLÓ FOGLALÁS
              </span>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{exhibitor.name}</h2>
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-700 inline" /> {exhibitor.location}
              </p>
            </div>

            {/* Reserved Items */}
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-md p-4 mb-5 space-y-2">
              <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Foglalt ételek adagszáma:
              </h4>
              {exhibitorItems.map(({ item, quantity }) => (
                <div key={item.id} className="flex justify-between text-xs text-zinc-800 dark:text-zinc-200">
                  <span>{item.name}</span>
                  <span className="font-bold">{quantity} adag</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>Neved</span>
                </label>
                <input
                  type="text"
                  placeholder="Pl. Kovács István"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  <span>Telefonszámod</span>
                </label>
                <input
                  type="tel"
                  placeholder="Pl. +36 30 123 4567"
                  required
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kívánt Átvételi Időpont</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setPickupTime(slot)}
                      className={`py-2 text-xs font-medium rounded-md border transition-all ${
                        pickupTime === slot
                          ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-md shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Utensils className="w-4 h-4" />
                <span>Kóstoló Foglalás Véglegesítése</span>
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Köszönjük a foglalást!</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                A stand elmentette a foglalásod. Várunk szeretettel a helyszínen!
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-md p-4 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center border-b border-zinc-200/60 dark:border-zinc-700/60 pb-2">
                <span className="text-zinc-500">Foglalás azonosító:</span>
                <span className="font-mono font-bold text-amber-600">#{completedOrder.id}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                <span>Stand:</span>
                <span className="font-semibold">{exhibitor.name}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                <span>Várható átvétel:</span>
                <span className="font-semibold text-amber-600">{completedOrder.pickup_time}-kor</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                setIsMyOrdersOpen(true);
              }}
              className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs rounded-md"
            >
              Foglalásaim Megtekintése
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
