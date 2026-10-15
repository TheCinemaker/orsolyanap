import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_EXHIBITORS, INITIAL_MENU_ITEMS } from '../data/mockOrsolyaData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { deviceId } from '../lib/eszkoz';

/**
 * Szervezői PIN kód.
 *
 * FIGYELEM: ez kliensoldali kód, tehát a böngészőbe letöltött JS-ből
 * kiolvasható. A felületen semmi nem mutatja meg, és véletlenül nem lehet
 * ráakadni, de aki a bundle-t olvassa, megtalálja. Valódi védelemhez
 * szerveroldali hitelesítés kellene (Supabase Auth + RLS).
 */
const ORGANIZER_PIN = '0169';

/**
 * Mennyi fotó jöjjön le egyszerre.
 *
 * Harminc annyi, amennyit a vendég végiggörget amúgy is, és a megnyitás
 * ettől marad gyors függetlenül attól, hány ezer fotó van összesen.
 */
const REEL_PAGE = 30;

/**
 * Vészüzem: a Netlify-ról kiszolgált mentett adat.
 *
 * Minden adat és minden kép a Supabase-ből jön. Ha az nem válaszol — elfogy
 * a havi forgalmi keret, leáll a szolgáltatás, vagy csak gyenge a mobilnet a
 * tömegben —, az app korábban ÜRESEN töltődött be: a látogató azt látta,
 * hogy nincs egyetlen stand sem.
 *
 * A pillanatkép a `scripts/pillanatkep.mjs`-sel készül, és a buildben utazik.
 * Csak akkor töltődik le, ha tényleg kell — normál működésben nem kerül
 * semmibe.
 */
const PILLANATKEP = '/pillanatkep.json';

/**
 * A képeket a Netlify-ról szolgáljuk ki, ne a Supabase-ből.
 *
 * A képek adják a forgalom szinte egészét: egy látogató pár MB képet tölt le
 * és 20 kB adatot. A Supabase ingyenes csomagja havi 5 GB-ot ad, a Netlifyé
 * 100-at — így a keret gyakorlatilag nem fogyhat el a hétvégén.
 *
 * ÁRA: ha egy stand lecseréli a fotóját, az csak egy új pillanatkép és egy
 * `git push` után látszik. Az ADAT (új étel, elfogyott tétel, szavazat)
 * továbbra is élőben jön, ez csak a képekre vonatkozik.
 *
 * Kikapcsolás: állítsd `false`-ra. Ilyenkor minden kép a Supabase-ből jön,
 * ahogy korábban.
 */
const KEPEK_A_BUILDBOL = true;

/** A Storage-útvonalból ugyanaz a fájlnév, amit a pillanatkep.mjs használ. */
const mentettNev = (url) => {
  const jel = url?.split?.('/storage/v1/object/public/')?.[1];
  return jel ? jel.replace(/[^A-Za-z0-9._-]/g, '_') : null;
};

const OrsolyaContext = createContext();

export function OrsolyaProvider({ children }) {
  // Active View Mode: 'visitor' | 'exhibitor' | 'map' | 'login' | 'reels'
  const [activeView, setActiveView] = useState('visitor');

  // Logged-in exhibitor ID (null if guest/visitor)
  const [activeExhibitorId, setActiveExhibitorId] = useState(() => {
    return localStorage.getItem('orsolya_logged_exhibitor_id') || null;
  });

  // Loading State for Supabase Initial Fetch
  const [isLoadingData, setIsLoadingData] = useState(true);

  // State: Exhibitors, Menu Items, Reels (Default strictly to empty arrays; all data comes from Supabase)
  const [exhibitors, setExhibitors] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [reels, setReels] = useState([]);
  const [events, setEvents] = useState([]);
  /* Infótábla: amit a standok üzennek a vásárnak. Minden üzenet külön sor,
     szerzővel és időponttal — a „Kész a gulyás!" tíz perc múlva még
     érdekes, két óra múlva félrevezető, és ezt csak az időpont mondja meg. */
  const [standHirek, setStandHirek] = useState([]);

  // Scanned Favorite Exhibitors
  const [favoriteExhibitorIds, setFavoriteExhibitorIds] = useState([]);

  // Favorite Dish IDs
  const [favoriteItemIds, setFavoriteItemIds] = useState([]);

  // Focused Exhibitor ID on Map
  const [focusedExhibitorIdOnMap, setFocusedExhibitorIdOnMap] = useState(null);

  // Szervezői (szuper admin) mód: a PIN-jegyzék és a standok közti váltás
  // kizárólag ezzel érhető el. SZÁNDÉKOSAN nem perzisztálódik: újratöltés
  // után ki kell lépni és újra belépni.
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Public Voting system: voted item IDs persisted in LocalStorage
  const [votedItemIds, setVotedItemIds] = useState([]);
  // Hányszor nyílt meg az app, és hány különböző készülékről.
  const [visitStats, setVisitStats] = useState(null);
  const [hasMoreReels, setHasMoreReels] = useState(false);
  /** Mentett adatból dolgozunk? Ilyenkor nincs szavazás és nincs szerkesztés. */
  const [mentettAdat, setMentettAdat] = useState(false);
  /** A buildben lévő képek fájlnevei. Üres halmaz = mindent a Supabase ad. */
  const mentettKepek = useRef(new Set());

  /**
   * Ha a képnek van helyi másolata, azt adjuk vissza.
   *
   * Csak az INDULÓ lekérésre alkalmazzuk. Egy menét közben feltöltött új
   * fotónak nincs helyi másolata, és az helyesen a Supabase-ből jön — azt
   * akár a feltöltés pillanatában látni akarjuk.
   */
  const kepUtvonal = (url) => {
    if (!KEPEK_A_BUILDBOL) return url;
    const nev = mentettNev(url);
    return nev && mentettKepek.current.has(nev) ? `/mentett-kepek/${nev}` : url;
  };
  /** Melyik fotón nyíljon meg a teljes képernyős folyám. */
  const [reelStartId, setReelStartId] = useState(null);
  const [loadingMoreReels, setLoadingMoreReels] = useState(false);
  // A kedvelt reelek: a szerver a hiteles forrás, a tároló csak gyors indítás.
  const [likedReelIds, setLikedReelIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('orsolya_liked_reel_ids') || '[]');
    } catch {
      return [];
    }
  });

  // Global Visitor Filter States (Day & Dietary Preferences)
  const [selectedDay, setSelectedDay] = useState('all'); // 'all' | 'saturday' | 'sunday'
  const [selectedDietary, setSelectedDietary] = useState('all'); // 'all' | 'gluten_free' | 'lactose_free' | 'sugar_free' | 'vegan'

  // Main tab state: 'food' | 'tents' | 'program' (Alapértelmezetten a gasztronómia / ételek nyílik meg)
  const [mainTab, setMainTab] = useState('food');
  const [searchQuery, setSearchQuery] = useState('');

  // Közönségszavazás időzítés: a rendezvény napján (2026. október 17. 08:00) nyílik meg
  const FESTIVAL_VOTING_START = new Date('2026-10-17T08:00:00+02:00').getTime();
  const [forceVotingOpen, setForceVotingOpen] = useState(() => {
    return localStorage.getItem('orsolya_force_voting_open') === 'true';
  });

  const isVotingOpen = Boolean(forceVotingOpen || Date.now() >= FESTIVAL_VOTING_START);

  const toggleForceVotingOpen = () => {
    setForceVotingOpen((prev) => {
      const next = !prev;
      localStorage.setItem('orsolya_force_voting_open', String(next));
      showToast(
        next
          ? '⚡ Szavazás tesztelése engedélyezve!'
          : '🔒 Szavazás lezárva a rendezvény napjáig.',
        'info'
      );
      return next;
    });
  };

  // Navigáció után mindig az új nézet tetejére állunk.
  // A scrollTo csak a kattintás pillanatában nem elég megbízható: a React
  // állapotfrissítés után a böngésző még visszaállíthatja az előző scrollpozíciót.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [activeView, mainTab]);

  const navigateToFoodCatalog = (query = '') => {
    setActiveView('visitor');
    setMainTab('food');
    if (typeof query === 'string' && query.trim() !== '') {
      setSearchQuery(query.trim());
    } else if (query && query.name) {
      setSearchQuery(query.name);
    } else {
      setSearchQuery('');
      setSelectedDay('all');
      setSelectedDietary('all');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStandFeed = () => {
    setActiveView('visitor');
    setMainTab('tents');
    setSearchQuery('');
    setSelectedDay('all');
    setSelectedDietary('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStand = (exhibitor) => {
    setActiveView('visitor');
    setMainTab('tents');
    if (exhibitor) {
      const name = typeof exhibitor === 'string' ? exhibitor : exhibitor.name;
      setSearchQuery(name || '');
    } else {
      setSearchQuery('');
    }
    setSelectedDay('all');
    setSelectedDietary('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toast message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === msg ? null : prev));
    }, 3500);
  };

  // Clear all local storage cache on load for clean testing
  useEffect(() => {
    try {
      localStorage.removeItem('orsolya_exhibitors');
      localStorage.removeItem('orsolya_menu_items');
      // A kosar es a foglalasok megszuntek; a regi kulcsokat is kitakaritjuk.
      localStorage.removeItem('orsolya_orders');
      localStorage.removeItem('orsolya_my_order_ids');
    } catch (e) {
      // ignore
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Supabase Initial Fetch & Real-time Subscriptions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let channel;

    const fetchSupabaseData = async () => {
      setIsLoadingData(true);
      try {
        const { data: exData, error: exErr } = await supabase.from('exhibitors').select('*');
        if (exErr) {
          console.error('Supabase exhibitors fetch error:', exErr.message);
          setExhibitors([]);
        } else if (exData) {
          const formattedEx = exData.map((e) => ({
            ...e,
            hasDrinks: e.has_drinks !== undefined ? e.has_drinks : e.hasDrinks,
            image: kepUtvonal(e.image),
            coordinates: e.coordinates || (e.latitude && e.longitude ? [Number(e.latitude), Number(e.longitude)] : null)
          }));
          setExhibitors(formattedEx);
        }

        const { data: itemData, error: itemErr } = await supabase.from('menu_items').select('*');
        if (itemErr) {
          console.error('Supabase menu_items fetch error:', itemErr.message);
          setMenuItems([]);
        } else if (itemData) {
          const validOrsolyaItems = itemData
            .filter((item) => item.exhibitor_id)
            .map((item) => ({ ...item, image: kepUtvonal(item.image) }));
          setMenuItems(validOrsolyaItems);
        }

        const { data: eventData, error: eventErr } = await supabase
          .from('events')
          .select('id,title,description,event_date,start_time,end_time,location,category,performer,is_free,image')
          .order('event_date', { ascending: true })
          .order('start_time', { ascending: true });
        if (!eventErr && eventData) setEvents(eventData);

        /* Infótábla. Ha a tábla még nem létezik (az SQL nincs lefuttatva),
           nem hiba: üres marad, és az app minden más része megy tovább. */
        const { data: hirData, error: hirErr } = await supabase
          .from('stand_hirek')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (hirErr) console.warn('Infotabla nem elerheto:', hirErr.message);
        else if (hirData) setStandHirek(hirData);

        /* Fotók: csak a legfrissebb adag.
           Korábban az ÖSSZES reel lejött minden megnyitásnál. Egy forgalmas
           hétvégén ez százakat jelent, és nem is a letöltés a nagyobb baj,
           hanem hogy a telefon mindet ki is rajzolja. A többi akkor jön,
           amikor a vendég odagörget. */
        const { data: reelData, error: reelErr } = await supabase
          .from('reels')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(REEL_PAGE);
        if (!reelErr && reelData) {
          setReels(reelData);
          setHasMoreReels(reelData.length === REEL_PAGE);
        }
      } catch (err) {
        console.error('Supabase fetch exception:', err);
        await mentettAdatra(err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchSupabaseData();

    // Subscribe to Realtime Postgres changes across all connected devices & screens
    try {
      channel = supabase
        .channel('orsolya-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'exhibitors' },
          (payload) => {
            if (payload.eventType === 'UPDATE' && payload.new) {
              setExhibitors((prev) =>
                prev.map((e) =>
                  e.id === payload.new.id
                    ? { ...e, ...payload.new, hasDrinks: payload.new.has_drinks ?? e.hasDrinks }
                    : e
                )
              );
            } else if (payload.eventType === 'INSERT' && payload.new) {
              setExhibitors((prev) => {
                if (prev.some((e) => e.id === payload.new.id)) return prev;
                return [...prev, { ...payload.new, hasDrinks: payload.new.has_drinks }];
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menu_items' },
          (payload) => {
            if (payload.eventType === 'UPDATE' && payload.new) {
              setMenuItems((prev) =>
                prev.map((item) => (item.id === payload.new.id ? { ...item, ...payload.new } : item))
              );
            } else if (payload.eventType === 'INSERT' && payload.new) {
              if (payload.new.exhibitor_id) {
                const handleInsert = async () => {
                  let newItem = { ...payload.new };
                  if (newItem.image && !newItem.image.startsWith('data:') && !newItem.image.startsWith('http')) {
                    const { data } = await supabase.from('menu_items').select('*').eq('id', newItem.id).single();
                    if (data) newItem = data;
                  }
                  setMenuItems((prev) => {
                    if (prev.some((item) => item.id === newItem.id)) return prev;
                    return [...prev, newItem];
                  });
                };
                handleInsert();
              }
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setMenuItems((prev) => prev.filter((item) => item.id !== payload.old.id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reels' },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              const handleInsert = async () => {
                let newReel = { ...payload.new };
                if (newReel.image && !newReel.image.startsWith('data:') && !newReel.image.startsWith('http')) {
                  const { data } = await supabase.from('reels').select('*').eq('id', newReel.id).single();
                  if (data) newReel = data;
                }
                setReels((prev) => {
                  if (prev.some((r) => r.id === newReel.id)) return prev;
                  return [newReel, ...prev];
                });
              };
              handleInsert();
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              setReels((prev) => prev.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r)));
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setReels((prev) => prev.filter((r) => r.id !== payload.old.id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'stand_hirek' },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              setStandHirek((prev) =>
                prev.some((h) => h.id === payload.new.id) ? prev : [payload.new, ...prev]
              );
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              // Javított üzenet: a szöveg cserélődik, a helye nem — a
              // created_at szándékosan marad az eredeti.
              setStandHirek((prev) =>
                prev.map((h) => (h.id === payload.new.id ? { ...h, ...payload.new } : h))
              );
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setStandHirek((prev) => prev.filter((h) => h.id !== payload.old.id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_stats' },
          (payload) => {
            // A látogatásszámláló élőben. Két kulcs van: 'opens' és 'devices',
            // külön sorban, tehát külön eseményként is érkezhetnek.
            const key = payload.new?.key;
            if (key !== 'opens' && key !== 'devices') return;
            setVisitStats((prev) => ({ ...(prev || {}), [key]: Number(payload.new.value) }));
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription fallback:', err);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Sync to LocalStorage & cross-tab sync
  useEffect(() => {
    // Exhibitors and menu items are server state. Do not persist them in
    // localStorage: menu item images are now Supabase Storage URLs and older
    // cached Base64 images can exceed the browser's ~5 MB storage quota.
    localStorage.removeItem('orsolya_exhibitors');
    localStorage.removeItem('orsolya_menu_items');
  }, [exhibitors, menuItems]);

  useEffect(() => {
    localStorage.setItem('orsolya_favorite_exhibitor_ids', JSON.stringify(favoriteExhibitorIds));
  }, [favoriteExhibitorIds]);

  useEffect(() => {
    localStorage.setItem('orsolya_favorite_item_ids', JSON.stringify(favoriteItemIds));
  }, [favoriteItemIds]);

  useEffect(() => {
    localStorage.setItem('orsolya_voted_item_ids', JSON.stringify(votedItemIds));
  }, [votedItemIds]);

  useEffect(() => {
    localStorage.setItem('orsolya_liked_reel_ids', JSON.stringify(likedReelIds));
  }, [likedReelIds]);

  /* Megnyitás rögzítése és a már leadott szavazatok visszaolvasása.
     Egyszer fut, az app betöltésekor.

     A szavazatokat a szerverről kérdezzük, nem csak a böngésző tárolójából:
     így a gomb egy tároló-törlés vagy másik lapfül után is "Szavazva"
     állapotban marad, és nem kínal fel egy második szavazatot, amit az
     adatbázis amúgy is visszautasítana. */
  /* A mentett képek jegyzékét még az adat előtt beolvassuk, hogy a képcseréhez
     már rendelkezésre álljon. Ha nincs meg, minden marad a Supabase-en. */
  useEffect(() => {
    if (!KEPEK_A_BUILDBOL) return;
    fetch('/mentett-kepek.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((lista) => {
        mentettKepek.current = new Set(Array.isArray(lista) ? lista : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let eldobva = false;

    (async () => {
      try {
        const { data } = await supabase.rpc('register_visit', { p_device_id: deviceId() });
        if (!eldobva && data) setVisitStats({ opens: data.opens, devices: data.devices });
      } catch (err) {
        // A számláló soha ne akadályozza az app használatát.
        console.warn('register_visit nem elérhető:', err?.message || err);
      }

      try {
        const { data } = await supabase.rpc('reel_likes_by_device', { p_device_id: deviceId() });
        if (!eldobva && Array.isArray(data)) setLikedReelIds(data);
      } catch (err) {
        console.warn('reel_likes_by_device nem elérhető:', err?.message || err);
      }

      try {
        const { data } = await supabase.rpc('votes_by_device', { p_device_id: deviceId() });
        if (!eldobva && Array.isArray(data) && data.length > 0) {
          setVotedItemIds((prev) => [...new Set([...prev, ...data])]);
        }
      } catch (err) {
        console.warn('votes_by_device nem elérhető:', err?.message || err);
      }
    })();

    return () => {
      eldobva = true;
    };
  }, []);

  /**
   * A következő adag fotó. A legrégebbi már betöltöttnél régebbiek jönnek
   * — nem oldalszám szerint, mert közben új fotó is érkezhet, és akkor a
   * lapozás elcsúszna: kihagyna vagy megduplazna sorokat.
   */
  const loadMoreReels = async () => {
    if (loadingMoreReels || !hasMoreReels || !isSupabaseConfigured) return;
    setLoadingMoreReels(true);
    try {
      const legregebbi = reels[reels.length - 1]?.created_at;
      let q = supabase.from('reels').select('*').order('created_at', { ascending: false }).limit(REEL_PAGE);
      if (legregebbi) q = q.lt('created_at', legregebbi);
      const { data, error } = await q;
      if (error) throw error;
      if (data && data.length > 0) {
        setReels((prev) => {
          const ismert = new Set(prev.map((r) => r.id));
          return [...prev, ...data.filter((r) => !ismert.has(r.id))];
        });
      }
      setHasMoreReels((data || []).length === REEL_PAGE);
    } catch (err) {
      console.warn('További fotók betöltése nem sikerült:', err?.message || err);
    } finally {
      setLoadingMoreReels(false);
    }
  };

  /**
   * A fotófolyám megnyitása, azon a képen, amire a vendég koppintott.
   *
   * Korábban a sáv egy középre tett kártyát nyitott: egy fotó, nincs
   * továbbgörgetés. A teljes képernyős folyám meg volt írva, csak semmi
   * nem hívta meg -- az `activeView === 'reels'` állapotba nem vezetett út.
   */
  const openReels = (reelId = null) => {
    setReelStartId(reelId);
    setActiveView('reels');
  };

  /**
   * Átváltás a mentett adatra.
   *
   * Üres listák helyett azt mutatjuk, ami a legutóbbi mentéskor igaz volt.
   * A szavazás, a kedvelés és a standos szerkesztés ilyenkor nem működik —
   * ezért állítjuk a jelzőt, hogy a felület meg tudja mondani a látogatónak,
   * miért.
   */
  const mentettAdatra = async (eredetiHiba) => {
    try {
      const r = await fetch(PILLANATKEP, { cache: 'no-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const mentes = await r.json();
      setExhibitors((mentes.exhibitors || []).map((x) => ({ ...x, hasDrinks: x.has_drinks })));
      setMenuItems(mentes.menuItems || []);
      setEvents(mentes.events || []);
      setReels([]); // A fotófolyám élő tartalom, mentett változata nincs.
      setMentettAdat(mentes.keszult || true);
      console.warn('Mentett adatra váltottam, mert a szerver nem válaszolt:', eredetiHiba?.message || eredetiHiba);
    } catch (err) {
      // Ha még ez sem megy, nincs mit tenni: marad az üres állapot.
      console.error('A mentett adat sem érhető el:', err?.message || err);
      setExhibitors([]);
      setMenuItems([]);
      setReels([]);
      setEvents([]);
    }
  };

  // Focus exhibitor on map
  const focusExhibitorOnMap = (exhibitorId) => {
    setFocusedExhibitorIdOnMap(exhibitorId);
    setActiveView('map');
  };

  // Vote for a dish / item with Supabase Realtime persistence
  const voteForItem = async (itemId) => {
    if (!isVotingOpen) {
      showToast('A közönségszavazás a rendezvény napján (október 17-én) nyílik meg!', 'info');
      return false;
    }

    if (votedItemIds.includes(itemId)) {
      showToast('Erre az ételre már leadtad a közönségszavazatodat!', 'error');
      return false;
    }

    // 1. A gomb azonnal átvált, hogy ne lehessen többször rákoppintani,
    //    amíg a kérés út van.
    setVotedItemIds((prev) => [...prev, itemId]);

    const targetItem = menuItems.find((i) => i.id === itemId);
    setMenuItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, votes: (targetItem?.votes || 0) + 1 } : item
      )
    );

    // 2. A szavazat rögzítése.
    //
    // AZ ÖSSZEADÁS ÉS A KORLÁTOZÁS IS AZ ADATBÁZISBAN TÖRTÉNIK.
    //
    // Korábban a "már szavaztam" csak a böngésző tárolójában élt, tehát a
    // szerver mindent elfogadott: egy oldalfrissítés után újra lehetett
    // szavazni ugyanarra az ételre. A vote_for_item függvény naplóba írja a
    // készülék és az étel párosát, és a második próbálkozást az adatbázis
    // zárja ki, nem a kliens jóindulata.
    try {
      const { data, error } = await supabase.rpc('vote_for_item', {
        p_item_id: itemId,
        p_device_id: deviceId(),
      });

      if (error) throw error;

      // A szerver száma a hiteles: ha közben mások is szavaztak, azt mutatjuk.
      if (data && typeof data.votes === 'number') {
        setMenuItems((prevItems) =>
          prevItems.map((item) => (item.id === itemId ? { ...item, votes: data.votes } : item))
        );
      }

      if (data && data.accepted === false) {
        // A napló szerint erről a készülékről már jött szavazat erre az ételre.
        // A gomb marad "Szavazva", csak nem számolunk hozzá újat.
        showToast('Erre az ételre már leadtad a szavazatodat.', 'info');
        return false;
      }

      showToast('Köszönjük a közönségszavazatot!', 'success');
    } catch (err) {
      // Nincs tartalék abszolút írásra. Az kikerülte volna a készülékenkénti
      // korlátot és feltülrírta volna mások szavazatát -- inkább vesszen el ez
      // az egy kattintás, mint hogy a végeredmény megbízhatatlan legyen.
      console.error('vote_for_item hiba:', err?.message || err);
      setVotedItemIds((prev) => prev.filter((id) => id !== itemId));
      setMenuItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, votes: targetItem?.votes || 0 } : item
        )
      );
      showToast('A szavazat most nem ment át. Próbáld újra.', 'error');
      return false;
    }

    return true;
  };

  // Favorite Dish helper functions
  const toggleFavoriteItem = (itemId) => {
    setFavoriteItemIds((prev) => {
      const isFav = prev.includes(itemId);
      if (isFav) {
        showToast('Étel eltávolítva a Kedvencek közül.');
        return prev.filter((id) => id !== itemId);
      } else {
        showToast('Étel elmentve a Kedvencek közé!', 'success');
        return [...prev, itemId];
      }
    });
  };

  // Favorite Stand helper functions
  const addFavoriteExhibitor = (exhibitorId) => {
    setFavoriteExhibitorIds((prev) => {
      if (!prev.includes(exhibitorId)) {
        showToast('Stand elmentve a Kedvencek közé!', 'success');
        return [...prev, exhibitorId];
      }
      return prev;
    });
  };

  const toggleFavoriteExhibitor = (exhibitorId) => {
    setFavoriteExhibitorIds((prev) => {
      const isFav = prev.includes(exhibitorId);
      if (isFav) {
        showToast('Stand eltávolítva a Kedvencek közül.');
        return prev.filter((id) => id !== exhibitorId);
      } else {
        showToast('Stand elmentve a Kedvencek közé!', 'success');
        return [...prev, exhibitorId];
      }
    });
  };

  /**
   * Üzenet kiírása az infótáblára.
   *
   * CSAK STAND ÍRHAT, és csak a saját nevében: az adatbázis a stand PIN-jéhez
   * köti a beszúrást (`post_stand_hir`), a táblára nincs insert policy. A
   * böngészőből tehát nem lehet idegen stand nevében posztolni — pedig a
   * táblát az anon kulccsal mindenki eléri.
   *
   * Az üzenetet nem felülírjuk, hanem hozzáírjuk: a vendégnek az időpont
   * mondja meg, hogy a „Kész a gulyás!" most szól-e vagy két órája.
   */
  const postStandHir = async (szoveg) => {
    const szov = String(szoveg ?? '').trim();
    if (!activeExhibitor || szov.length < 2) return false;
    try {
      const { data, error } = await supabase.rpc('post_stand_hir', {
        p_exhibitor_id: activeExhibitor.id,
        p_pin: activeExhibitor.pin,
        p_szoveg: szov,
      });
      if (error) throw error;
      // A realtime is elhozza, de a saját gépen ne kelljen rá várni.
      if (data) setStandHirek((prev) => (prev.some((h) => h.id === data.id) ? prev : [data, ...prev]));
      showToast('Kiírva az infótáblára', 'success');
      return true;
    } catch (err) {
      console.error('Infotabla poszt hiba:', err.message);
      showToast('Nem sikerült kiírni. Van internet?', 'error');
      return false;
    }
  };

  /**
   * A szervező üzenete az infótáblára.
   *
   * A szervezőnek nincs standja, ezért PIN-je sem: a szervezői kóddal ír, és
   * a bejegyzés mellé a neve kerül, nem egy standé. Így a vendég látja, hogy
   * ez a rendezvénytől jött.
   */
  const postSzervezoHir = async (szoveg, szerzo) => {
    const szov = String(szoveg ?? '').trim();
    if (!isSuperAdmin || szov.length < 2) return false;
    try {
      const { data, error } = await supabase.rpc('post_szervezo_hir', {
        p_kod: ORGANIZER_PIN,
        p_szoveg: szov,
        p_szerzo: szerzo || null,
      });
      if (error) throw error;
      if (data) setStandHirek((prev) => (prev.some((h) => h.id === data.id) ? prev : [data, ...prev]));
      showToast('Kiírva az infótáblára', 'success');
      return true;
    } catch (err) {
      console.error('Infotabla szervezoi poszt hiba:', err.message);
      showToast('Nem sikerült kiírni. Van internet?', 'error');
      return false;
    }
  };

  /**
   * Üzenet javítása.
   *
   * Elírás, vagy máshogy akarja fogalmazni. Mindenki a sajátját javíthatja, a
   * szervező bármelyiket — ugyanaz a kulcs dönt, mint a visszavételnél.
   *
   * Az időpont marad az eredeti: ha változna, a bejegyzés előreugrana a
   * táblán, mintha most írták volna.
   */
  const editStandHir = async (id, szoveg) => {
    const kod = isSuperAdmin ? ORGANIZER_PIN : activeExhibitor?.pin;
    const szov = String(szoveg ?? '').trim();
    if (!kod || szov.length < 2) return false;
    try {
      const { data, error } = await supabase.rpc('edit_stand_hir', {
        p_id: id,
        p_pin: kod,
        p_szoveg: szov,
      });
      if (error) throw error;
      if (data) setStandHirek((prev) => prev.map((h) => (h.id === id ? { ...h, ...data } : h)));
      showToast('Javítva', 'success');
      return true;
    } catch (err) {
      console.error('Infotabla javitas hiba:', err.message);
      showToast('Nem sikerült javítani.', 'error');
      return false;
    }
  };

  /**
   * Üzenet visszavétele.
   *
   * A stand a sajátját veheti vissza, a szervező bármelyiket: nyilvános
   * táblán kell legyen mód levenni azt, ami nem odavaló.
   */
  const deleteStandHir = async (id) => {
    const kod = isSuperAdmin ? ORGANIZER_PIN : activeExhibitor?.pin;
    if (!kod) return false;
    try {
      const { data, error } = await supabase.rpc('delete_stand_hir', {
        p_id: id,
        p_pin: kod,
      });
      if (error) throw error;
      if (data) setStandHirek((prev) => prev.filter((h) => h.id !== id));
      return Boolean(data);
    } catch (err) {
      console.error('Infotabla torles hiba:', err.message);
      showToast('Nem sikerült visszavenni.', 'error');
      return false;
    }
  };

  // Toggle exhibitor hasDrinks
  const updateExhibitorDrinks = async (exhibitorId, hasDrinks) => {
    setExhibitors((prev) =>
      prev.map((ex) => (ex.id === exhibitorId ? { ...ex, hasDrinks } : ex))
    );
    if (isSupabaseConfigured) {
      try {
        await supabase.from('exhibitors').update({ has_drinks: hasDrinks }).eq('id', exhibitorId);
      } catch (e) {
        console.warn('Supabase sync warning:', e);
      }
    }
    showToast(hasDrinks ? 'Ital elérhetőség bekapcsolva!' : 'Ital elérhetőség kikapcsolva.');
  };

  // Login as Exhibitor with PIN
  /**
   * Belépés PIN kóddal.
   *
   * Két eset van:
   *   - a szervezői kód (ORGANIZER_PIN): nem egy standba lép be, hanem
   *     megnyitja a csapat- és PIN-jegyzéket, ahonnan BÁRMELYIK stand
   *     felülete elérhető
   *   - egy stand kódja: az adott stand felületére lép be
   *
   * A hibaüzenet szándékosan nem ad példát kódra.
   */
  const loginExhibitor = (pin) => {
    const clean = String(pin ?? '').trim();

    if (clean === ORGANIZER_PIN) {
      setIsSuperAdmin(true);
      showToast('Szervezői belépés. Válaszd ki, melyik stand felületére lépsz.', 'success');
      return true;
    }

    const found = exhibitors.find((ex) => ex.pin === clean);
    if (found) {
      setIsSuperAdmin(false);
      setActiveExhibitorId(found.id);
      setActiveView('exhibitor');
      showToast(`Üdvözlünk, ${found.name}! Stand belépés sikeres.`, 'success');
      return true;
    }

    showToast('Hibás PIN kód.', 'error');
    return false;
  };

  /**
   * Belépés egy konkrét stand felületére a szervezői jegyzékből.
   * Csak szervezői módban hívható -- a jegyzék is csak ott érhető el.
   */
  const loginAsExhibitor = (exhibitorId) => {
    if (!isSuperAdmin) return false;
    const found = exhibitors.find((ex) => ex.id === exhibitorId);
    if (!found) return false;

    setActiveExhibitorId(found.id);
    setActiveView('exhibitor');
    showToast(`${found.name} felülete megnyitva (szervezői belépés).`, 'success');
    return true;
  };

  const logoutExhibitor = () => {
    setActiveExhibitorId(null);
    setIsSuperAdmin(false);
    setActiveView('visitor');
    showToast('Kijelentkeztél az árus felületről.');
  };

  // Add Brand New Exhibitor Team (Super Admin / Organizer helper)
  const addExhibitorTeam = async (teamData) => {
    const generatedPin = teamData.pin || Math.floor(1000 + Math.random() * 9000).toString();
    const newTeam = {
      id: `ex-${Date.now()}`,
      name: teamData.name.trim(),
      location: teamData.location?.trim() || 'Diáksétány',
      pin: generatedPin,
      category: teamData.category || 'meleg_etel',
      hasDrinks: !!teamData.hasDrinks,
      offerings: teamData.offerings.trim(),
      days: teamData.days || 'both',
      isOpen: true,
      story: teamData.story || '',
      cause: teamData.cause || '',
      phone: teamData.phone || '',
      email: teamData.email || '',
      facebook_url: teamData.facebook_url || '',
      instagram_url: teamData.instagram_url || '',
      image: teamData.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      notice: teamData.notice || ''
    };

    setExhibitors((prev) => [...prev, newTeam]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('exhibitors').insert([{
          id: newTeam.id,
          name: newTeam.name,
          location: newTeam.location,
          pin: newTeam.pin,
          category: newTeam.category,
          has_drinks: newTeam.hasDrinks,
          offerings: newTeam.offerings,
          days: newTeam.days,
          is_open: newTeam.isOpen,
          story: newTeam.story,
          cause: newTeam.cause,
          phone: newTeam.phone,
          email: newTeam.email,
          facebook_url: newTeam.facebook_url,
          instagram_url: newTeam.instagram_url,
          image: newTeam.image,
          notice: newTeam.notice
        }]);
      } catch (e) {
        console.warn('Supabase insert warning:', e);
      }
    }

    showToast(`Új csapat (${newTeam.name}) sikeresen regisztrálva! PIN: ${generatedPin}`, 'success');
    return newTeam;
  };

  // Local State Reset helper (Does NOT purge Supabase database)
  const clearAllDatabaseData = async () => {
    setExhibitors([]);
    setMenuItems([]);
    setFavoriteExhibitorIds([]);
    setFavoriteItemIds([]);
    setVotedItemIds([]);

    localStorage.removeItem('orsolya_exhibitors');
    localStorage.removeItem('orsolya_menu_items');
    localStorage.removeItem('orsolya_orders');
    localStorage.removeItem('orsolya_favorite_exhibitor_ids');
    localStorage.removeItem('orsolya_favorite_item_ids');
    localStorage.removeItem('orsolya_voted_item_ids');

    showToast('Helyi munkamenet kiürítve.', 'info');
  };

  // Update Exhibitor PIN (Organizer / Admin helper)
  const updateExhibitorPin = async (exhibitorId, newPin) => {
    const cleanPin = newPin.trim();
    if (!cleanPin || cleanPin.length < 4) {
      showToast('A PIN kódnak legalább 4 karakteresnek kell lennie!', 'error');
      return false;
    }

    setExhibitors((prev) =>
      prev.map((ex) => (ex.id === exhibitorId ? { ...ex, pin: cleanPin } : ex))
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('exhibitors').update({ pin: cleanPin }).eq('id', exhibitorId);
      } catch (e) {
        console.warn('Supabase PIN update warning:', e);
      }
    }

    showToast('PIN kód sikeresen frissítve!', 'success');
    return true;
  };

  // Exhibitor Profile update (Bio, Story, Cause, Contacts, Days)
  const updateExhibitorProfile = async (exhibitorId, updatedData) => {
    setExhibitors((prev) =>
      prev.map((ex) => (ex.id === exhibitorId ? { ...ex, ...updatedData } : ex))
    );
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('exhibitors').update({
          name: updatedData.name,
          category: updatedData.category,
          story: updatedData.story,
          cause: updatedData.cause,
          notice: updatedData.notice,
          location: updatedData.location,
          offerings: updatedData.offerings,
          has_drinks: updatedData.hasDrinks,
          phone: updatedData.phone,
          email: updatedData.email,
          facebook_url: updatedData.facebook_url,
          instagram_url: updatedData.instagram_url,
          days: updatedData.days,
          image: updatedData.image || null
        }).eq('id', exhibitorId);
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase sync warning:', e);
      }
    }
    showToast('Stand adatok és történet frissítve!', 'success');
  };

  // Real-time Stock Adjustments
  const updateItemStock = async (itemId, delta) => {
    let targetStock = 0;
    let targetStatus = 'ready';

    setMenuItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          targetStock = Math.max(0, item.stock + delta);
          targetStatus = targetStock === 0 ? 'sold_out' : item.status === 'sold_out' ? 'ready' : item.status;
          return { ...item, stock: targetStock, status: targetStatus };
        }
        return item;
      })
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('menu_items').update({ stock: targetStock, status: targetStatus }).eq('id', itemId);
      } catch (e) {
        console.warn('Supabase sync warning:', e);
      }
    }
  };

  // Update item status
  const updateItemStatus = async (itemId, status, etaMinutes = 0) => {
    setMenuItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return { ...item, status, eta_minutes: etaMinutes };
        }
        return item;
      })
    );
    if (isSupabaseConfigured) {
      try {
        await supabase.from('menu_items').update({ status }).eq('id', itemId);
      } catch (e) {
        console.warn('Supabase sync warning:', e);
      }
    }
    showToast('Állapot frissítve!');
  };

  // Automatic Friday noon (12:00) activation state (Persisted in LocalStorage)
  const [isSaturdayActive, setIsSaturdayActive] = useState(() => {
    return localStorage.getItem('orsolya_force_saturday_active') === 'true';
  });

  const toggleSaturdayActivation = () => {
    setIsSaturdayActive((prev) => {
      const next = !prev;
      localStorage.setItem('orsolya_force_saturday_active', String(next));
      showToast(
        next
          ? '⚡ Péntek déli élesítés aktiválva! Minden rejtett étel nyilvánossá vált.'
          : '🙈 Péntek déli élesítés kikapcsolva. A rejtett ételek péntek délig rejtve maradnak.',
        'info'
      );
      return next;
    });
  };

  // Helper: Is today Friday 12:00 (noon) or later in festival week?
  const isAutoActivatedForVisitors = () => {
    if (isSaturdayActive) return true;
    const now = new Date();
    const day = now.getDay(); // 5 = Friday, 6 = Saturday, 0 = Sunday
    const hours = now.getHours();

    if (day === 5 && hours >= 12) return true;
    if (day === 6 || day === 0) return true;
    return false;
  };

  // Visitor visibility filter helper
  const isItemVisibleToVisitors = (item) => {
    if (!item) return false;
    if (!item.is_hidden) return true;
    return isAutoActivatedForVisitors();
  };

  // Toggle item hidden status (Rejtett / Nyilvános) by exhibitor in admin panel
  const toggleItemHiddenStatus = async (itemId) => {
    let newHiddenState = false;
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          newHiddenState = !item.is_hidden;
          return { ...item, is_hidden: newHiddenState };
        }
        return item;
      })
    );

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('menu_items').update({ is_hidden: newHiddenState }).eq('id', itemId);
        if (error && (error.message?.includes('is_hidden') || error.code === 'PGRST204')) {
          console.warn('is_hidden column missing in Supabase menu_items table');
        }
      } catch (e) {
        console.warn('Supabase sync warning:', e);
      }
    }

    showToast(
      newHiddenState
        ? '🙈 Étel rejtett módba állítva (péntek délig rátok tartozik).'
        : '👁️ Étel mostantól nyilvános a látogatóknak!',
      'info'
    );
  };

  // Étel mentése / felvétele (allergén jelölések, nap, rejtett mód).
  //
  // ÁR NINCS: a vásáron nem értékesítés folyik, hanem adománygyűjtés, ezért
  // árat sehol nem tartunk nyilván. A menu_items táblában nincs is price
  // oszlop -- ha a payload mégis tartalmazza, a Supabase PGRST204 hibával
  // elutasítja az egész mentést, és a standos nem tud ételt szerkeszteni.
  const saveMenuItem = async (itemData) => {
    const formattedItem = {
      ...itemData,
      is_gluten_free: !!itemData.is_gluten_free,
      is_lactose_free: !!itemData.is_lactose_free,
      is_sugar_free: !!itemData.is_sugar_free,
      is_vegan: !!itemData.is_vegan,
      is_hidden: !!itemData.is_hidden,
      available_day: itemData.available_day || 'both'
    };

    const isDrink = formattedItem.category === 'italok';

    if (itemData.id) {
      setMenuItems((prev) => prev.map((i) => (i.id === itemData.id ? { ...i, ...formattedItem } : i)));

      if (isSupabaseConfigured) {
        const updatePayload = {
          name: formattedItem.name,
          description: formattedItem.description || '',
          initial_stock: Number(formattedItem.initial_stock) || 30,
          category: formattedItem.category,
            tags: formattedItem.tags || [],
          available_day: formattedItem.available_day,
          is_gluten_free: formattedItem.is_gluten_free,
          is_lactose_free: formattedItem.is_lactose_free,
          is_sugar_free: formattedItem.is_sugar_free,
          is_vegan: formattedItem.is_vegan,
          image: formattedItem.image || null
        };

        try {
          let { error: updErr } = await supabase
            .from('menu_items')
            .update({ ...updatePayload, is_hidden: formattedItem.is_hidden })
            .eq('id', itemData.id);

          if (updErr && (updErr.message?.includes('is_hidden') || updErr.code === 'PGRST204')) {
            const { error: retryErr } = await supabase
              .from('menu_items')
              .update(updatePayload)
              .eq('id', itemData.id);
            if (retryErr) {
              console.error('Supabase menu_items update error:', retryErr.message);
              showToast('Hiba az étel Supabase mentésekor!', 'error');
            }
          } else if (updErr) {
            console.error('Supabase menu_items update error:', updErr.message);
            showToast('Hiba az étel Supabase mentésekor!', 'error');
          }
        } catch (e) {
          console.warn('Supabase sync warning:', e);
        }
      }
      showToast(isDrink ? 'Ital frissítve!' : 'Étel frissítve!', 'success');
    } else {
      const newItem = {
        ...formattedItem,
        id: `item-${Date.now()}`,
        exhibitor_id: activeExhibitorId,
        stock: Number(formattedItem.initial_stock) || 30,
        initial_stock: Number(formattedItem.initial_stock) || 30,
        status: 'ready',
        votes: 0
      };

      setMenuItems((prev) => [...prev, newItem]);

      if (isSupabaseConfigured) {
        const dbPayload = {
          id: newItem.id,
          exhibitor_id: newItem.exhibitor_id,
          name: newItem.name,
          description: newItem.description || '',
          initial_stock: newItem.initial_stock,
          stock: newItem.stock,
          status: newItem.status,
          votes: 0,
          category: newItem.category || 'meleg_etel',
          available_day: newItem.available_day || 'both',
          is_gluten_free: newItem.is_gluten_free,
          is_lactose_free: newItem.is_lactose_free,
          is_sugar_free: newItem.is_sugar_free,
          is_vegan: newItem.is_vegan,
          tags: newItem.tags || [],
          image: newItem.image || null
        };

        try {
          let { error: insErr } = await supabase
            .from('menu_items')
            .insert([{ ...dbPayload, is_hidden: newItem.is_hidden }]);

          if (insErr && (insErr.message?.includes('is_hidden') || insErr.code === 'PGRST204')) {
            const { error: retryErr } = await supabase.from('menu_items').insert([dbPayload]);
            if (retryErr) {
              console.error('Supabase menu_items insert retry error:', retryErr.message);
              showToast('Hiba az étel Supabase mentésekor!', 'error');
            } else {
              console.log('Supabase insert succeeded without is_hidden column!');
            }
          } else if (insErr) {
            console.error('Supabase menu_items insert error:', insErr.message);
            showToast('Hiba az étel Supabase mentésekor!', 'error');
          } else {
            console.log('Supabase insert succeeded!');
          }
        } catch (e) {
          console.warn('Supabase sync warning:', e);
        }
      }

      showToast(
        newItem.is_hidden
          ? '🙈 Új rejtett étel hozzáadva (péntek délben aktiválódik)!'
          : isDrink
          ? 'Új ital hozzáadva a standodhoz!'
          : 'Új étel hozzáadva a standodhoz!',
        'success'
      );
    }
  };

  // Delete menu item
  const deleteMenuItem = async (itemId) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('menu_items').delete().eq('id', itemId);
      } catch (e) {
        console.warn('Supabase sync warning:', e);
      }
    }
    showToast('Étel eltávolítva.');
  };

  // File to Base64 Image Conversion Helper with automatic Canvas compression (max 800px JPEG)
  /**
   * Feltoltott kep elokeszitese es feltoltese a Storage-ba.
   *
   * Ket dolgot old meg egyszerre:
   *
   * MINOSEG. Korabban minden kep 800 pixelre zsugorodott, JPEG 0.82-vel. Egy
   * mai telefon kijelzoje 1080-1290 pixel szeles, tehat a teljes kepernyos
   * fotofolyamban ez lathatoan mosodott. A reel most 1440 pixel es WebP:
   * ugyanakkora fajlmeretbol a WebP erezhetoen tobbet hoz ki, mint a JPEG.
   *
   * SULY. A kep nem az adatbazis soraban utazik tobbe. A base64 minden
   * latogatonak lejott minden megnyitaskor, mielott barmit latott volna --
   * egyetlen 3 MB-os kep egyszer mar tizennegyszeresere hizlalta az indulast.
   * Storage-bol a kep kulon, lustan, gyorsitotarazva jon.
   *
   * Ha a feltoltes nem megy (nincs halozat, nem futott le a
   * supabase-kepfeltoltes.sql), base64-re esunk vissza: jobb egy nehez kep,
   * mint egy stand, aki nem tudja menteni a fotojat.
   */
  const KEP_BEALLITAS = {
    reel: { bucket: 'reels', maxDim: 1440, quality: 0.85 },
    etel: { bucket: 'etelek', maxDim: 1000, quality: 0.84 },
    logo: { bucket: 'logok', maxDim: 600, quality: 0.84 },
  };

  /** Atmeretezes es WebP-be tomorites a bongeszoben. */
  const kepElokeszites = (file, spec) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('A kep nem olvashato.'));
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          // Csak kicsinyitunk. Egy kis kepet felnagyitani nem javit rajta,
          // csak nagyobb fajlt csinal belole.
          if (w > spec.maxDim || h > spec.maxDim) {
            const arany = spec.maxDim / Math.max(w, h);
            w = Math.round(w * arany);
            h = Math.round(h * arany);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          // Jobb minosegu atmeretezes: enelkul a lekicsinyites recesre huzza
          // a reszleteket.
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('A tomorites nem sikerult.'))),
            'image/webp',
            spec.quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  const blobBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });

  const uploadImage = async (file, kind = 'etel') => {
    const spec = KEP_BEALLITAS[kind] || KEP_BEALLITAS.etel;
    const blob = await kepElokeszites(file, spec);

    if (!isSupabaseConfigured) return blobBase64(blob);

    try {
      // A `feltoltes/` mappa szandekos: a bongeszo csak ide irhat, igy egy
      // kitalalt nevvel nem lehet felulirni egy stand logojat vagy egy etel
      // fotojat.
      const nev = `feltoltes/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;
      const { error } = await supabase.storage
        .from(spec.bucket)
        .upload(nev, blob, { contentType: 'image/webp', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(spec.bucket).getPublicUrl(nev);
      if (!data?.publicUrl) throw new Error('Nincs publikus URL.');
      return data.publicUrl;
    } catch (err) {
      console.warn('Storage feltoltes nem sikerult, base64-re esunk vissza:', err?.message || err);
      return blobBase64(blob);
    }
  };


  // Post a new live Reel / Story (by Exhibitor OR Visitor)
  const postReel = async (caption, image, customName = null, exhibitorId = null) => {
    if (!caption || !image) {
      showToast('Kérjük tölts fel egy fotót és írj hozzá rövid leírást!', 'error');
      return null;
    }

    const name = customName ? customName.trim() : activeExhibitor ? activeExhibitor.name : 'Vásári Látogató';
    const exId = exhibitorId || activeExhibitor?.id || null;

    const newReel = {
      id: `reel-${Date.now()}`,
      exhibitor_id: exId,
      exhibitor_name: name,
      caption: caption.trim(),
      image: image,
      likes: 0,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('reels')
        .insert([newReel])
        .select()
        .single();

      if (error) {
        console.warn('Supabase reel insert notice:', error.message);
      }

      const savedReel = data || newReel;
      setReels((prev) => {
        if (prev.some((r) => r.id === savedReel.id)) return prev;
        return [savedReel, ...prev];
      });

      showToast('📸 Élő pillanat közzétéve!', 'success');
      return savedReel;
    } catch (e) {
      setReels((prev) => [newReel, ...prev]);
      showToast('📸 Élő pillanat közzétéve!', 'success');
      return newReel;
    }
  };

  // Like a live Reel / Story
  /**
   * Kedvelés be/ki. Egy készülék egy reelt egyszer, de visszavonhatóan — az
   * Instagramon is így működik, és a vendég ezt várja.
   *
   * A számolás és a korlátozás is az adatbázisban van. Korábban a kliens a
   * saját, esetleg elavult számából írt abszolút értéket: két egyidejű
   * kedvelés felülírta egymást, és egy oldalfrissítés után ugyanaz a telefon
   * újra kedvelhetett.
   *
   * @returns {Promise<boolean>} igaz, ha a kedvelés most lett bekapcsolva
   */
  const likeReel = async (reelId) => {
    const elozo = reels.find((r) => r.id === reelId);
    const voltKedvelve = likedReelIds.includes(reelId);

    // Azonnali visszajelzés: a szív nem várhat a hálózatra.
    setLikedReelIds((prev) => (voltKedvelve ? prev.filter((id) => id !== reelId) : [...prev, reelId]));
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId ? { ...r, likes: Math.max(0, (r.likes || 0) + (voltKedvelve ? -1 : 1)) } : r
      )
    );

    try {
      const { data, error } = await supabase.rpc('toggle_reel_like', {
        p_reel_id: reelId,
        p_device_id: deviceId(),
      });
      if (error) throw error;

      if (data && typeof data.likes === 'number') {
        setReels((prev) => prev.map((r) => (r.id === reelId ? { ...r, likes: data.likes } : r)));
      }
      if (data && typeof data.liked === 'boolean') {
        setLikedReelIds((prev) =>
          data.liked ? [...new Set([...prev, reelId])] : prev.filter((id) => id !== reelId)
        );
        return data.liked;
      }
      return !voltKedvelve;
    } catch (err) {
      // Nincs tartalék abszolút írásra: az kikerülte volna a készülékenkénti
      // korlátot. Inkább visszaforgatjuk, amit mutattunk.
      console.error('toggle_reel_like hiba:', err?.message || err);
      setLikedReelIds((prev) => (voltKedvelve ? [...new Set([...prev, reelId])] : prev.filter((id) => id !== reelId)));
      setReels((prev) => prev.map((r) => (r.id === reelId ? { ...r, likes: elozo?.likes || 0 } : r)));
      return voltKedvelve;
    }
  };

  const activeExhibitor = exhibitors.find((ex) => ex.id === activeExhibitorId) || null;

  return (
    <OrsolyaContext.Provider
      value={{
        activeView,
        setActiveView,
        activeExhibitorId,
        activeExhibitor,
        isLoadingData,
        loginExhibitor,
        loginAsExhibitor,
        isSuperAdmin,
        logoutExhibitor,
        exhibitors,
        menuItems,
        reels,
        events,
        standHirek,
        postStandHir,
        postSzervezoHir,
        editStandHir,
        deleteStandHir,
        postReel,
        likeReel,
        uploadImage,
        favoriteExhibitorIds,
        addFavoriteExhibitor,
        toggleFavoriteExhibitor,
        favoriteItemIds,
        toggleFavoriteItem,
        focusedExhibitorIdOnMap,
        focusExhibitorOnMap,
        updateExhibitorDrinks,
        votedItemIds,
        voteForItem,
        visitStats,
        mentettAdat,
        likedReelIds,
        openReels,
        reelStartId,
        loadMoreReels,
        hasMoreReels,
        loadingMoreReels,
        isVotingOpen,
        toggleForceVotingOpen,
        updateItemStock,
        updateItemStatus,
        saveMenuItem,
        deleteMenuItem,
        isSaturdayActive,
        toggleSaturdayActivation,
        isItemVisibleToVisitors,
        toggleItemHiddenStatus,
        addExhibitorTeam,
        updateExhibitorPin,
        updateExhibitorProfile,
        selectedDay,
        setSelectedDay,
        selectedDietary,
        setSelectedDietary,
        mainTab,
        setMainTab,
        searchQuery,
        setSearchQuery,
        navigateToFoodCatalog,
        navigateToStandFeed,
        navigateToStand,
        toastMessage,
        showToast
      }}
    >
      {children}
    </OrsolyaContext.Provider>
  );
}


export function useOrsolya() {
  const context = useContext(OrsolyaContext);
  if (!context) {
    throw new Error('useOrsolya must be used within an OrsolyaProvider');
  }
  return context;
}
