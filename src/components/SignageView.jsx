import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Maximize2, Minimize2, RefreshCw, Utensils } from 'lucide-react';
import { useOrsolya } from '../context/OrsolyaContext';
import { isKTSZEExhibitor } from '../lib/ktszeUtils';
import { supabase } from '../lib/supabaseClient';

/**
 * Digitális kijelző (menu board) a KTSZE standjára.
 *
 * TERVEZÉSI ALAPELVEK — ezek nem ízlés kérdései, a nézési távolságból következnek:
 *
 * 1. MINDEN MÉRET A KÉPERNYŐHÖZ SKÁLÁZÓDIK, nem breakpointokhoz.
 *    Egy kijelző egyetlen, rögzített méretben létezik: 1080p vagy 4K TV. A
 *    `sm:`/`xl:` töréspontok ott nem segítenek — egy `text-sm` egy 55"-os
 *    4K panelen nézhetetlenül apró. Ezért mindenhol `clamp()` + `vw/vh`.
 *
 * 2. AZ ÉTEL A FŐSZEREPLŐ. A fejléc és a lábléc együtt sem vihet el 15%-nál
 *    többet. Minden dekoratív elem, ami nem étel, az ételtől vesz el helyet.
 *
 * 3. EGY VIZUÁLIS NYELV. Egy betűcsalád, egy kiemelőszín. A méret és a
 *    vastagság hordozza a hierarchiát, nem a díszítés.
 *
 * 4. A NORMÁL ÁLLAPOTOT NEM CÍMKÉZZÜK. Ha minden ételen ott van, hogy
 *    "ELÉRHETŐ", az a szó elveszti a jelentését. Csak a kivétel kap jelölést
 *    (utolsó adagok, elfogyott) — így az tűnik fel, ami számít.
 *
 * 5. NINCS HOVER. Kijelzőn nincs egér.
 *
 * 6. NINCS ÁR ÉS NINCS QR-KÓD. A kijelző egyetlen dolgot csinál: megmutatja,
 *    mi kapható. Semmilyen döntést nem kér a vendégtől, és nem küldi el a
 *    telefonjához -- a pultnál a sor nem áll meg attól, hogy valaki olvas.
 */
export default function SignageView({ targetExhibitorId }) {
  const { exhibitors, menuItems } = useOrsolya();

  const [liveItems, setLiveItems] = useState([]);
  const [activeMode, setActiveMode] = useState('overview'); // 'overview' | 'featured'
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [overviewPage, setOverviewPage] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const hideTimer = useRef(null);

  /**
   * Hatot mutatunk oldalanként, nem nyolcat.
   * Nagyobb csempe = nagyobb fotó és név = messzebbről olvasható. Inkább
   * legyen eggyel több lapozás, mint apró betű.
   */
  const ITEMS_PER_PAGE = 6;

  const currentExhibitor = useMemo(() => {
    if (targetExhibitorId) {
      return exhibitors.find((ex) => ex.id === targetExhibitorId) || null;
    }
    return exhibitors.find((ex) => isKTSZEExhibitor(ex)) || exhibitors[0] || null;
  }, [exhibitors, targetExhibitorId]);

  // --- Élő adatok: Supabase Realtime ----------------------------------------
  useEffect(() => {
    if (!currentExhibitor) return undefined;

    setLiveItems(
      menuItems.filter((item) => item.exhibitor_id === currentExhibitor.id && !item.is_hidden)
    );

    const channel = supabase
      .channel(`signage_${currentExhibitor.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items',
          filter: `exhibitor_id=eq.${currentExhibitor.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLiveItems((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setLiveItems((prev) =>
              prev.map((item) => (item.id === payload.new.id ? payload.new : item))
            );
          } else if (payload.eventType === 'DELETE') {
            setLiveItems((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentExhibitor, menuItems]);

  // --- Óra -------------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // --- Lapozás és kiemelt mód váltása ---------------------------------------
  const totalPages = Math.ceil(liveItems.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (liveItems.length === 0) return undefined;

    const timer = setTimeout(
      () => {
        if (activeMode === 'overview') {
          if (overviewPage + 1 < totalPages) {
            setOverviewPage((prev) => prev + 1);
          } else {
            setOverviewPage(0);
            setActiveMode('featured');
            setFeaturedIndex(0);
          }
        } else if (featuredIndex + 1 < liveItems.length) {
          setFeaturedIndex((prev) => prev + 1);
        } else {
          setActiveMode('overview');
          setOverviewPage(0);
        }
      },
      activeMode === 'overview' ? 12_000 : 5_000
    );

    return () => clearTimeout(timer);
  }, [activeMode, overviewPage, totalPages, featuredIndex, liveItems]);

  // --- Vezérlők automatikus elrejtése ----------------------------------------
  //
  // A kijelzőn ne legyen ott állandóan egy gomb. Egérmozgásra előjön, aztán eltűnik.
  useEffect(() => {
    const reveal = () => {
      setControlsVisible(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    };

    reveal();
    window.addEventListener('mousemove', reveal);
    window.addEventListener('touchstart', reveal);

    return () => {
      clearTimeout(hideTimer.current);
      window.removeEventListener('mousemove', reveal);
      window.removeEventListener('touchstart', reveal);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };


  const formattedTime = currentTime.toLocaleTimeString('hu-HU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  /**
   * Csak a kivételes állapotokat címkézzük.
   * @returns {{ text: string, className: string } | null}
   */
  const getStatusBadge = (item) => {
    if (item.status === 'sold_out' || item.stock === 0) {
      return { text: 'Elfogyott', className: 'bg-white/10 text-white/60' };
    }
    if (item.status === 'cooking') {
      return { text: 'Készül', className: 'bg-sky-400/15 text-sky-300' };
    }
    if (item.stock && item.stock <= 5) {
      return { text: `Utolsó ${item.stock}`, className: 'bg-amber-400 text-stone-950' };
    }
    return null;
  };

  const isSoldOut = (item) => item.status === 'sold_out' || item.stock === 0;

  /** Étrendi jelölések — röviden, hogy ne vigyék el a figyelmet. */
  const dietTags = (item) =>
    [
      item.is_vegan && 'VEGÁN',
      item.is_gluten_free && 'GLUTÉNMENTES',
      item.is_lactose_free && 'LAKTÓZMENTES',
    ].filter(Boolean);

  if (!currentExhibitor) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950 flex items-center justify-center">
        <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
      </div>
    );
  }

  // Ha nincs megjeleníthető étel, a rács helyett egy nyugodt üres állapot megy
  // ki -- egy üres rács a kijelzőn hibának látszik.
  if (liveItems.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950 text-white flex flex-col items-center justify-center gap-[3vh] p-[4vw] text-center">
        <span className="text-[clamp(1rem,1.8vw,2.2rem)] font-semibold uppercase tracking-[0.15em] text-amber-400">
          KTSZE
        </span>
        <p className="text-[clamp(1.5rem,3.5vw,4rem)] font-medium leading-tight text-white/80 text-balance">
          A kínálat hamarosan érkezik
        </p>
      </div>
    );
  }

  const pageItems = liveItems.slice(
    overviewPage * ITEMS_PER_PAGE,
    (overviewPage + 1) * ITEMS_PER_PAGE
  );
  const featured = liveItems[featuredIndex] || liveItems[0];
  const layout = gridLayout(pageItems.length);

  // --- Közös méretek ---------------------------------------------------------
  // Egy helyen definiálva, hogy a két mód tipográfiája garantáltan egyezzen.
  const T = {
    brand: 'text-[clamp(0.9rem,1.5vw,1.9rem)]',
    clock: 'text-[clamp(0.9rem,1.5vw,1.9rem)]',
    dishName: 'text-[clamp(1.15rem,2.6vw,3.2rem)]',
    badge: 'text-[clamp(0.6rem,0.85vw,1rem)]',
    heroName: 'text-[clamp(2rem,5.5vw,7rem)]',
    footer: 'text-[clamp(0.65rem,0.95vw,1.1rem)]',
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 text-white overflow-hidden flex flex-col font-sans antialiased">
      {/* ------------------------------------------------------------------ */}
      {/* Fejléc — egyetlen sor, hogy a hely az ételé maradjon                */}
      {/* ------------------------------------------------------------------ */}
      <header className="shrink-0 flex items-baseline justify-between px-[2vw] pt-[2vh] pb-[1.2vh]">
        <div className="flex items-baseline gap-[1.2vw] min-w-0">
          <span className={`${T.brand} font-semibold uppercase tracking-[0.15em] text-amber-400`}>
            KTSZE
          </span>
          <span className={`${T.brand} font-medium text-white/40 truncate`}>
            Orsolya-napi vásár
          </span>
        </div>

        <div className="flex items-center gap-[1vw] shrink-0">
          <span className={`${T.clock} font-normal tabular-nums text-white/50`}>
            {formattedTime}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Teljes képernyő"
            className={`p-2 rounded-lg bg-white/5 text-white/50 transition-opacity duration-500 ${
              controlsVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Tartalom                                                            */}
      {/* ------------------------------------------------------------------ */}
      {activeMode === 'overview' ? (
        <main className="flex-1 min-h-0 px-[2vw] grid">
          <div className={`grid ${layout.grid} gap-[1.2vw] min-h-0 h-full`}>
            {pageItems.map((item, index) => {
              const badge = getStatusBadge(item);
              const soldOut = isSoldOut(item);
              const tags = dietTags(item);

              return (
                <article
                  key={item.id}
                  className={`relative rounded-[1.2vw] overflow-hidden bg-stone-900 flex flex-col transition-opacity duration-500 ${layout.span(
                    index
                  )} ${soldOut ? 'opacity-35' : 'opacity-100'}`}
                >
                  {/* Fotó: kitölti a csempét, a szöveg rákerül */}
                  <div className="absolute inset-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className={`w-full h-full object-cover ${soldOut ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-900">
                        <Utensils className="w-[4vw] h-[4vw] text-white/10" />
                      </div>
                    )}
                    {/* A sötétítés nélkül a fehér név olvashatatlan a fotón */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/55 to-stone-950/5" />
                  </div>

                  {/* Címke jobb felül — csak ha van mondanivalója */}
                  {badge && (
                    <div className="relative self-end m-[0.8vw]">
                      <span
                        className={`${T.badge} font-semibold uppercase tracking-wider px-[0.9vw] py-[0.4vh] rounded-full ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                  )}

                  {/* Név, leírás, ár — alul */}
                  <div className="relative mt-auto p-[1vw] space-y-[0.4vh]">
                    <h3
                      className={`${T.dishName} font-medium leading-[1.1] tracking-[-0.01em] text-balance`}
                    >
                      {item.name}
                    </h3>

                    {tags.length > 0 && (
                      <div className={`${T.badge} font-medium uppercase tracking-wider text-white/35 pt-[0.3vh]`}>
                        {tags.join(' · ')}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

        </main>
      ) : (
        /* Kiemelt mód: egy étel, nagyban */
        <main className="flex-1 min-h-0 px-[2vw] grid">
          {featured && (
            <article
              key={featured.id}
              className="relative rounded-[1.2vw] overflow-hidden bg-stone-900 animate-in fade-in duration-700"
            >
              {featured.image ? (
                <img src={featured.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Utensils className="w-[8vw] h-[8vw] text-white/10" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-[3vw] space-y-[1vh]">
                <h2
                  className={`${T.heroName} font-medium leading-[1.0] tracking-[-0.02em] text-balance max-w-[85%]`}
                >
                  {featured.name}
                </h2>
              </div>
            </article>
          )}

        </main>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Lábléc — lapozásjelző, semmi dekoráció                              */}
      {/* ------------------------------------------------------------------ */}
      <footer className="shrink-0 flex items-center justify-between px-[2vw] pt-[1.2vh] pb-[2vh]">
        <div className="flex items-center gap-[0.6vw]" aria-hidden="true">
          {activeMode === 'overview' &&
            totalPages > 1 &&
            Array.from({ length: totalPages }).map((_, index) => (
              <span
                key={index}
                className={`h-[0.4vh] rounded-full transition-all duration-500 ${
                  index === overviewPage ? 'w-[3vw] bg-amber-400' : 'w-[1.2vw] bg-white/15'
                }`}
              />
            ))}
        </div>

        <span className={`${T.footer} font-medium text-white/25 uppercase tracking-[0.2em]`}>
          Kóstold meg Kőszeg ízeit
        </span>
      </footer>
    </div>
  );
}
