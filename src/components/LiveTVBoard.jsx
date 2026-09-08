import React, { useState, useEffect } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import VisitKoszegLogo from './VisitKoszegLogo';
import { Flame, Tv, Clock, MapPin, Sparkles, CheckCircle2, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';

export default function LiveTVBoard() {
  const { exhibitors, menuItems, setActiveView } = useOrsolya();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  // Group items by exhibitor
  const activeExhibitorsData = exhibitors.map((ex) => {
    const items = menuItems.filter((i) => i.exhibitor_id === ex.id);
    const totalStock = items.reduce((sum, i) => sum + i.stock, 0);
    return { ...ex, items, totalStock };
  });

  // Collect all live announcements for ticker
  const notices = exhibitors.filter((ex) => ex.notice).map((ex) => `${ex.name}: ${ex.notice}`);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 font-sans relative overflow-hidden">
      {/* Background Subtle Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-amber-500/30 relative z-10">
        <div className="flex items-center gap-4">
          <VisitKoszegLogo size="lg" showTagline={true} />
          <div className="h-10 w-px bg-slate-800 hidden sm:block" />
          <div className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span>ÉLŐ KIJELZŐ • BOGRÁCS & KÍNÁLAT KIELZŐ</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Clock */}
          <div className="text-right">
            <span className="text-2xl sm:text-4xl font-mono font-black text-amber-400 tracking-wider">
              {currentTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-widest">
              2026. OKTÓBER • ORSOLYA-NAP
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition-all"
            title="Teljes Képernyő"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setActiveView('visitor')}
            className="px-4 py-2.5 bg-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20"
          >
            Bezárás
          </button>
        </div>
      </header>

      {/* Main Grid: Exhibitors & Live Stock Cards */}
      <main className="my-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 flex-1">
        {activeExhibitorsData.map((exhibitor) => (
          <div
            key={exhibitor.id}
            className="bg-slate-900/90 border border-amber-500/25 rounded-3xl p-6 shadow-2xl flex flex-col justify-between hover:border-amber-500/50 transition-all"
          >
            {/* Stand Info */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-md">
                    📍 {exhibitor.location}
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1.5 leading-snug">
                    {exhibitor.name}
                  </h2>
                </div>

                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Össz adag
                  </span>
                  <span
                    className={`text-xl font-black ${
                      exhibitor.totalStock > 10 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                    }`}
                  >
                    {exhibitor.totalStock} adag
                  </span>
                </div>
              </div>

              {/* Stand Live Broadcast Notice */}
              {exhibitor.notice && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl mb-4 text-xs font-semibold text-amber-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-spin" />
                  <span>{exhibitor.notice}</span>
                </div>
              )}

              {/* Items Live List */}
              <div className="space-y-3">
                {exhibitor.items.map((item) => {
                  const isSoldOut = item.stock <= 0 || item.status === 'sold_out';
                  const isCooking = item.status === 'cooking';
                  const isLow = item.stock > 0 && item.stock <= 10;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSoldOut
                          ? 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                          : isCooking
                          ? 'bg-amber-500/10 border-amber-500/40 text-white'
                          : isLow
                          ? 'bg-red-500/10 border-red-500/40 text-white'
                          : 'bg-slate-800/70 border-slate-700/80 text-white'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold truncate">{item.name}</h4>
                        </div>
                        <span className="text-xs font-bold text-amber-400/90 block">
                          {item.price.toLocaleString('hu-HU')} Ft
                        </span>
                      </div>

                      {/* Stock Badge */}
                      <div>
                        {isSoldOut ? (
                          <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-extrabold px-3 py-1 rounded-full">
                            ELFOGYOTT
                          </span>
                        ) : isCooking ? (
                          <span className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            FŐZÉS ALATT (~{item.eta_minutes || 15}p)
                          </span>
                        ) : isLow ? (
                          <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-bounce">
                            <Flame className="w-3.5 h-3.5" />MÉG {item.stock} ADAG!
                          </span>
                        ) : (
                          <div className="text-right">
                            <span className="text-2xl font-black text-emerald-400 block leading-none">
                              {item.stock}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              adag
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>📍 Státusz: <strong className="text-emerald-400">NYITVA</strong></span>
              <span>Előrendelhető mobilról</span>
            </div>
          </div>
        ))}
      </main>

      {/* Live Ticker Bar at Bottom */}
      <footer className="bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 text-white rounded-2xl p-3 shadow-xl overflow-hidden relative z-10">
        <div className="flex items-center gap-4">
          <span className="bg-slate-950 text-amber-400 text-xs font-black px-3 py-1 rounded-xl uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>KŐSZEG LIVE TICKER</span>
          </span>

          <div className="overflow-hidden flex-1 relative whitespace-nowrap">
            <div className="inline-block animate-marquee font-bold text-xs sm:text-sm tracking-wide">
              {notices.length > 0
                ? notices.join('   •••   ')
                : '🔥 BOGRÁCSOS MARHAPÖRKÖLT A JURISICS TÉREN ••• 🍷 FORRÓ FORRALT KÉKFRANKOS A VÁROSTORONYNÁL ••• 🥐 FRISS MÉGGYES-MÁKOS RÉTES A FŐ TÉREN'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
