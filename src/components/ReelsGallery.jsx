import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOrsolya } from '../context/OrsolyaContext';
import { X, Heart, MapPin, ChevronDown, Share2 } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';

/**
 * Teljes képernyős fotófolyam, Instagram/Facebook Reels mintájára.
 *
 * Négy dolog választja el egy görgethető képlistát attól, hogy Reelsnek
 * érződjön — mind a négy itt van megoldva:
 *
 * 1. TELJES KITÖLTÉS. A kép `object-cover`, tehát kitölti a képernyőt, és
 *    mögötte ugyanaz a kép elmosva adja a hátteret. Korábban `object-contain`
 *    volt: egy álló fotó mellett két fekete sáv állt, ami azonnal elárulja,
 *    hogy ez egy weboldal, nem egy feed.
 *
 * 2. DUPLA KOPPINTÁS. Az `onDoubleClick` egérre szól; telefonon vagy nem
 *    sül el, vagy a böngésző ráközelít helyette. Itt a koppintásokat magunk
 *    figyeljük, és a szív ott pattan fel, ahol a vendég megütötte a képet.
 *
 * 3. ELŐRETÖLTÉS. A következő és az előző kép már letöltve várakozik, mert
 *    különben minden görgetésnél egy fekete képernyőt bámul az ember. Ami
 *    messzebb van, az lustán töltődik: nem szedjük le az összes fotót elöl.
 *
 * 4. A GÖRGETÉS NEM SZÖKIK KI. `overscroll-contain`: az utolsó fotónál nem
 *    kezd el rugózni az alatta lévő oldal.
 */
export default function ReelsGallery() {
  const {
    reels,
    exhibitors,
    likeReel,
    likedReelIds,
    setActiveView,
    focusExhibitorOnMap,
    showToast,
    loadMoreReels,
    hasMoreReels,
    loadingMoreReels,
  } = useOrsolya();

  /* Mennyit rajzolunk ki a mostani körül.
     A többi fotó helye megmarad (ugyanolyan magas üres doboz), csak a kép és
     a feliratok nem kerülnek a DOM-ba. Kétszáz betöltött fotó kétszáz képet
     és négyszáz szövegréteget jelentene egyszerre — attól egy telefon
     bereccsen, a görgetés pedig szaggat. */
  const ABLAK = 2;

  const [activeIndex, setActiveIndex] = useState(0);
  /** Hol és melyik fotón pattanjon fel a szív. */
  const [burst, setBurst] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const scrollerRef = useRef(null);
  const lastTapRef = useRef({ id: null, time: 0 });

  useScrollLock(true);

  /* Melyik fotó van épp a képernyőn. Ebből tudjuk, mit kell előretölteni.
     Figyelő, nem görgetés-számolás: az utóbbi minden eszközön máshogy
     kerekít, és a snap közben félúton rossz értéket ad. */
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const megfigyelo = new IntersectionObserver(
      (bejegyzesek) => {
        for (const b of bejegyzesek) {
          if (b.isIntersecting && b.intersectionRatio > 0.6) {
            const i = Number(b.target.dataset.index);
            if (!Number.isNaN(i)) setActiveIndex(i);
          }
        }
      },
      { root, threshold: [0.6] }
    );
    root.querySelectorAll('[data-index]').forEach((el) => megfigyelo.observe(el));
    return () => megfigyelo.disconnect();
  }, [reels.length]);

  /* A kedvelés valtó: második koppintásra visszavonja. Az adatbázis tartja
     nyilván, melyik készülék melyik reelt kedvelte, tehát egy oldalfrissítés
     nem ad újabb kedvelést. */
  const like = useCallback((id) => likeReel(id), [likeReel]);

  /* Utántöltés. Három fotóval a vége előtt szólunk, hogy mire a vendég
     odaerül, már ott legyen a folytatás — így nem áll meg a görgetés. */
  useEffect(() => {
    if (reels.length === 0) return;
    if (activeIndex >= reels.length - 3) loadMoreReels();
  }, [activeIndex, reels.length]);

  /* Dupla koppintás kézzel. A két koppintás között 300 ms-ot engedünk, és
     csak akkor fogadjuk el, ha a két érintés egymáshoz közel esett -- így a
     gyors görgetés nem számít kedvelésnek. */
  const koppintas = (event, reel) => {
    const most = Date.now();
    const elozo = lastTapRef.current;
    const pont = event.changedTouches ? event.changedTouches[0] : event;

    if (elozo.id === reel.id && most - elozo.time < 300) {
      lastTapRef.current = { id: null, time: 0 };
      const doboz = event.currentTarget.getBoundingClientRect();
      // Dupla koppintás SOHA nem vonja vissza a kedvelést -- az Instagramon sem.
      // Aki már kedvelte, annak csak a szív pattan fel újra.
      if (!likedReelIds.includes(reel.id)) like(reel.id);
      setBurst({ id: reel.id, x: pont.clientX - doboz.left, y: pont.clientY - doboz.top, kulcs: most });
      // A kulcs biztosítja, hogy egymás utáni koppintásoknál újrainduljon az animáció.
      setTimeout(() => setBurst((b) => (b && b.kulcs === most ? null : b)), 900);
      return;
    }
    lastTapRef.current = { id: reel.id, time: most };
  };

  const megosztas = async (reel) => {
    const adat = {
      title: 'Orsolya-napi Vásár',
      text: reel.caption ? `${reel.caption} — ${reel.exhibitor_name}` : reel.exhibitor_name,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(adat);
        return;
      }
      await navigator.clipboard.writeText(`${adat.text}\n${adat.url}`);
      showToast('A link a vágólapra került.', 'success');
    } catch {
      // A megosztás megszakítása nem hiba, nem szólunk érte.
    }
  };

  const formatTimeShort = (isoString) => {
    if (!isoString) return 'Éppen most';
    const date = new Date(isoString);
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 60) return 'Éppen most';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}p`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}ó`;
    return `${date.getMonth() + 1}.${date.getDate()}.`;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white flex flex-col h-[100dvh] overflow-hidden">
      {/* Fejléc. A sorszám azt mondja meg, mennyi van még -- enélkül nem
          tudja az ember, hogy érdemes-e tovább görgetni. */}
      <div className="absolute top-0 left-0 right-0 p-4 z-50 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <h2 className="text-sm font-black tracking-widest text-white drop-shadow-md">
          FOTÓK
          {reels.length > 0 && (
            <span className="ml-2 font-bold text-white/70">
              {activeIndex + 1}/{reels.length}
              {hasMoreReels && '+'}
            </span>
          )}
        </h2>
        <button
          onClick={() => setActiveView('visitor')}
          className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors cursor-pointer shadow-lg pointer-events-auto"
          aria-label="Bezárás"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-none h-full w-full bg-stone-950 overscroll-contain"
      >
        {reels.length > 0 && loadingMoreReels && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-white/80 pointer-events-none">
            További fotók betöltése…
          </div>
        )}

        {reels.length === 0 && (
          <div className="flex items-center justify-center h-full text-white/50 text-sm font-bold">
            Még nincsenek fotók.
          </div>
        )}

        {reels.map((reel, index) => {
          const exhibitor = exhibitors.find((e) => e.id === reel.exhibitor_id);
          const isLiked = likedReelIds.includes(reel.id);
          // A szomszédos fotók azonnal, a tobbi lustan: igy a kovetkezo
          // gorgetesnel mar kesz a kep, de nem toltunk le mindent elore.
          const kozel = Math.abs(index - activeIndex) <= 1;
          const kirajzoljuk = Math.abs(index - activeIndex) <= ABLAK;
          const nyitottSzoveg = expandedId === reel.id;

          // Távolabbi fotó: csak a helye marad meg, hogy a görgetés és a
          // snap pontosan ott álljon meg, ahol kell.
          if (!kirajzoljuk) {
            return (
              <div
                key={reel.id}
                data-index={index}
                className="snap-start snap-always w-full h-[100dvh] bg-black"
                aria-hidden="true"
              />
            );
          }

          return (
            <div
              key={reel.id}
              data-index={index}
              className="snap-start snap-always w-full h-[100dvh] relative flex items-center justify-center bg-black overflow-hidden"
            >
              {/* Elmosott háttér ugyanabból a képből: így az álló fotó mellett
                  sem fekete sáv van, hanem a kép saját színei. */}
              <img
                src={reel.image}
                alt=""
                aria-hidden="true"
                loading={kozel ? 'eager' : 'lazy'}
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50"
              />
              <img
                src={reel.image}
                alt={reel.caption || reel.exhibitor_name || ''}
                loading={kozel ? 'eager' : 'lazy'}
                decoding="async"
                className="relative w-full h-full object-cover"
              />

              <div
                className="absolute inset-0 z-10 select-none"
                onTouchEnd={(e) => koppintas(e, reel)}
                onDoubleClick={(e) => {
                  // Asztali gépen az egér duplakattintása is kedvelés.
                  const doboz = e.currentTarget.getBoundingClientRect();
                  const most = Date.now();
                  if (!likedReelIds.includes(reel.id)) like(reel.id);
                  setBurst({ id: reel.id, x: e.clientX - doboz.left, y: e.clientY - doboz.top, kulcs: most });
                  setTimeout(() => setBurst((b) => (b && b.kulcs === most ? null : b)), 900);
                }}
              >
                {/* A felpattanó szív a koppintás helyén. */}
                {burst && burst.id === reel.id && (
                  <Heart
                    key={burst.kulcs}
                    className="absolute w-24 h-24 fill-rose-500 text-rose-500 drop-shadow-2xl pointer-events-none reel-burst"
                    style={{ left: burst.x - 48, top: burst.y - 48 }}
                  />
                )}

                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

                <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5 pointer-events-auto">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => like(reel.id)}
                      className={`p-3 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-lg cursor-pointer ${
                        isLiked ? 'bg-rose-500/20' : 'bg-white/10 hover:bg-white/20'
                      }`}
                      aria-label={isLiked ? 'Kedvelés visszavonása' : 'Kedvelés'}
                    >
                      <Heart
                        className={`w-8 h-8 transition-colors ${
                          isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'
                        }`}
                      />
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-md">{reel.likes || 0}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => megosztas(reel)}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all active:scale-90 shadow-lg cursor-pointer"
                      aria-label="Megosztás"
                    >
                      <Share2 className="w-7 h-7 text-white" />
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-md">Megosztás</span>
                  </div>

                  {exhibitor && (
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => {
                          setActiveView('map');
                          setTimeout(() => focusExhibitorOnMap(exhibitor.id), 100);
                        }}
                        className="p-3 rounded-full bg-amber-500/90 hover:bg-amber-400 backdrop-blur-md text-stone-950 transition-all active:scale-90 shadow-lg cursor-pointer"
                        aria-label="Stand a térképen"
                      >
                        <MapPin className="w-7 h-7" />
                      </button>
                      <span className="text-white text-xs font-bold drop-shadow-md">Stand</span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-6 left-4 right-20 space-y-2 pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center border-2 border-white shadow-lg overflow-hidden shrink-0">
                      {exhibitor?.image ? (
                        <img src={exhibitor.image} alt="" className="w-full h-full object-contain bg-white" />
                      ) : (
                        <span>{reel.exhibitor_name?.substring(0, 2).toUpperCase() || 'LÁ'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-white text-sm drop-shadow-md truncate">
                        {reel.exhibitor_name}
                      </h3>
                      <p className="text-xs text-white/80 font-bold drop-shadow-md">
                        {formatTimeShort(reel.created_at)}
                      </p>
                    </div>
                  </div>

                  {reel.caption && (
                    <p
                      onClick={() => setExpandedId(nyitottSzoveg ? null : reel.id)}
                      className={`text-sm font-medium text-white drop-shadow-md pr-4 cursor-pointer ${
                        nyitottSzoveg ? '' : 'line-clamp-2'
                      }`}
                    >
                      {reel.caption}
                    </p>
                  )}
                </div>

                {index < reels.length - 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce opacity-60 pointer-events-none">
                    <ChevronDown className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
