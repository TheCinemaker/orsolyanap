import React from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, Clock, CheckCircle, Flame, AlertCircle, MapPin } from 'lucide-react';

export default function MyOrdersModal() {
  const { isMyOrdersOpen, setIsMyOrdersOpen, myOrderIds, orders, exhibitors } = useOrsolya();

  if (!isMyOrdersOpen) return null;

  const myOrdersList = orders.filter((o) => myOrderIds.includes(o.id));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-500/10 text-amber-600 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Feldolgozás alatt
          </span>
        );
      case 'accepted':
        return (
          <span className="bg-blue-500/10 text-blue-600 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-500/20">
            <Flame className="w-3 h-3" />
            Étel készül a standnál!
          </span>
        );
      case 'ready':
        return (
          <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm animate-pulse">
            <Flame className="w-3.5 h-3.5" />
            🔥 Átvehető a standnál!
          </span>
        );
      case 'completed':
        return (
          <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            Átvéve
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Saját Foglalásaim</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Élő státuszfrissítés a standoktól
            </p>
          </div>
          <button
            onClick={() => setIsMyOrdersOpen(false)}
            className="text-zinc-400 hover:text-zinc-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 flex-1 overflow-y-auto space-y-4">
          {myOrdersList.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">Még nem adtál le kóstoló foglalást.</p>
            </div>
          ) : (
            myOrdersList.map((order) => {
              const exhibitor = exhibitors.find((ex) => ex.id === order.exhibitor_id);

              return (
                <div
                  key={order.id}
                  className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-600 block">
                        #{order.id}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
                        {exhibitor ? exhibitor.name : 'Stand'}
                      </h4>
                      {exhibitor && (
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          {exhibitor.location}
                        </span>
                      )}
                    </div>

                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl space-y-1 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.name}</span>
                        <span className="font-bold">{it.quantity} adag</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-zinc-500 pt-1">
                    <span>
                      Átvétel: <strong className="text-amber-600 dark:text-amber-400">{order.pickup_time}</strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
