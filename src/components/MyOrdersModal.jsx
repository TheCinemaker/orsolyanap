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
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Feldolgozás alatt
          </span>
        );
      case 'accepted':
        return (
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            Étel készül a standnál!
          </span>
        );
      case 'ready':
        return (
          <span className="bg-emerald-500 text-slate-950 text-xs font-black px-3.5 py-1 rounded-full flex items-center gap-1.5 animate-bounce shadow-lg shadow-emerald-500/30">
            <Flame className="w-3.5 h-3.5" />
            🔥 ÁTVEHETŐ A STANDNÁL!
          </span>
        );
      case 'completed':
        return (
          <span className="bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Befejezve & Átvéve
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Saját Előrendeléseim</span>
            </h2>
            <p className="text-xs text-slate-400">
              Élő státuszfrissítés az Orsolya-napi vásár árusaitól
            </p>
          </div>
          <button
            onClick={() => setIsMyOrdersOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders List */}
        <div className="py-4 flex-1 overflow-y-auto space-y-4">
          {myOrdersList.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Még nem adtál le előrendelést.</p>
            </div>
          ) : (
            myOrdersList.map((order) => {
              const exhibitor = exhibitors.find((ex) => ex.id === order.exhibitor_id);

              return (
                <div
                  key={order.id}
                  className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 block">
                        #{order.id}
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-0.5">
                        {exhibitor ? exhibitor.name : 'Stand'}
                      </h4>
                      {exhibitor && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          {exhibitor.location}
                        </span>
                      )}
                    </div>

                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Items */}
                  <div className="bg-slate-900/60 p-3 rounded-xl space-y-1 text-xs text-slate-300 border border-slate-800">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {it.quantity}x {it.name}
                        </span>
                        <span className="font-bold text-white">
                          {(it.price * it.quantity).toLocaleString('hu-HU')} Ft
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-400">
                      Átvételi idő: <strong className="text-amber-400">{order.pickup_time}</strong>
                    </span>
                    <span className="text-sm font-black text-white">
                      Összesen: {order.total_price.toLocaleString('hu-HU')} Ft
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
