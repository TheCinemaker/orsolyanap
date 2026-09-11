import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_EXHIBITORS, INITIAL_MENU_ITEMS, INITIAL_ORDERS } from '../data/mockOrsolyaData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

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

  // State: Exhibitors, Menu Items, Orders, Reels (Default strictly to empty arrays; all data comes from Supabase)
  const [exhibitors, setExhibitors] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reels, setReels] = useState([]);

  // Scanned Favorite Exhibitors
  const [favoriteExhibitorIds, setFavoriteExhibitorIds] = useState([]);

  // Favorite Dish IDs
  const [favoriteItemIds, setFavoriteItemIds] = useState([]);

  // Focused Exhibitor ID on Map
  const [focusedExhibitorIdOnMap, setFocusedExhibitorIdOnMap] = useState(null);

  // Visitor Cart state (Portions reservation)
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [myOrderIds, setMyOrderIds] = useState([]);

  // Public Voting system: voted item IDs persisted in LocalStorage
  const [votedItemIds, setVotedItemIds] = useState([]);

  // Global Visitor Filter States (Day & Dietary Preferences)
  const [selectedDay, setSelectedDay] = useState('all'); // 'all' | 'saturday' | 'sunday'
  const [selectedDietary, setSelectedDietary] = useState('all'); // 'all' | 'gluten_free' | 'lactose_free' | 'sugar_free' | 'vegan'

  // Main tab state: 'tents' | 'food'
  const [mainTab, setMainTab] = useState('tents');
  const [searchQuery, setSearchQuery] = useState('');

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
      localStorage.removeItem('orsolya_orders');
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
            coordinates: e.coordinates || (e.latitude && e.longitude ? [Number(e.latitude), Number(e.longitude)] : null)
          }));
          setExhibitors(formattedEx);
        }

        const { data: itemData, error: itemErr } = await supabase.from('menu_items').select('*');
        if (itemErr) {
          console.error('Supabase menu_items fetch error:', itemErr.message);
          setMenuItems([]);
        } else if (itemData) {
          const validOrsolyaItems = itemData.filter((item) => item.exhibitor_id);
          setMenuItems(validOrsolyaItems);
        }

        const { data: reelData, error: reelErr } = await supabase.from('reels').select('*').order('created_at', { ascending: false });
        if (!reelErr && reelData) {
          setReels(reelData);
        }
      } catch (err) {
        console.error('Supabase fetch exception:', err);
        setExhibitors([]);
        setMenuItems([]);
        setReels([]);
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
    // Exhibitors, menu items and orders are server state. Do not persist them in
    // localStorage: menu item images are now Supabase Storage URLs and older
    // cached Base64 images can exceed the browser's ~5 MB storage quota.
    localStorage.removeItem('orsolya_exhibitors');
    localStorage.removeItem('orsolya_menu_items');
  }, [exhibitors, menuItems]);

  useEffect(() => {
    localStorage.setItem('orsolya_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('orsolya_my_order_ids', JSON.stringify(myOrderIds));
  }, [myOrderIds]);

  useEffect(() => {
    localStorage.setItem('orsolya_favorite_exhibitor_ids', JSON.stringify(favoriteExhibitorIds));
  }, [favoriteExhibitorIds]);

  useEffect(() => {
    localStorage.setItem('orsolya_favorite_item_ids', JSON.stringify(favoriteItemIds));
  }, [favoriteItemIds]);

  useEffect(() => {
    localStorage.setItem('orsolya_voted_item_ids', JSON.stringify(votedItemIds));
  }, [votedItemIds]);

  // Focus exhibitor on map
  const focusExhibitorOnMap = (exhibitorId) => {
    setFocusedExhibitorIdOnMap(exhibitorId);
    setActiveView('map');
  };

  // Vote for a dish / item with Supabase Realtime persistence
  const voteForItem = async (itemId) => {
    if (votedItemIds.includes(itemId)) {
      showToast('Erre az ételre már leadtad a közönségszavazatodat!', 'error');
      return false;
    }

    // 1. Mark device as voted in LocalStorage
    setVotedItemIds((prev) => [...prev, itemId]);

    // 2. Optimistic UI update
    const targetItem = menuItems.find((i) => i.id === itemId);
    const newVotes = (targetItem?.votes || 0) + 1;

    setMenuItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return { ...item, votes: newVotes };
        }
        return item;
      })
    );

    showToast('Köszönjük a közönségszavazatot!', 'success');

    // 3. Write vote to Supabase (broadcasts REALTIME to all devices via Postgres changes)
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ votes: newVotes })
        .eq('id', itemId);

      if (error) {
        console.error('Supabase vote update error:', error.message);
      }
    } catch (err) {
      console.error('Supabase vote exception:', err);
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
  const loginExhibitor = (pin) => {
    const found = exhibitors.find((ex) => ex.pin === pin.trim());
    if (found) {
      setActiveExhibitorId(found.id);
      setActiveView('exhibitor');
      showToast(`Üdvözlünk, ${found.name}! Stand belépés sikeres.`, 'success');
      return true;
    } else {
      showToast('Hibás PIN kód! Próbáld újra (pl. 1234, 2345, 3456).', 'error');
      return false;
    }
  };

  const logoutExhibitor = () => {
    setActiveExhibitorId(null);
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
    setOrders([]);
    setCart([]);
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

  // Save/Add menu item dynamically (with Allergen flags, Available day, Hidden mode, and optional Price)
  const saveMenuItem = async (itemData) => {
    const formattedItem = {
      ...itemData,
      price: itemData.price !== undefined ? itemData.price : '',
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
          price: formattedItem.price || null,
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
          price: newItem.price || null,
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

  // Cart operations (Portions reservation)
  const addToCart = (item, quantity = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((c) => c.item.id === item.id);
      if (existing) {
        return prevCart.map((c) =>
          c.item.id === item.id ? { ...c, quantity: Math.min(item.stock, c.quantity + quantity) } : c
        );
      }
      return [...prevCart, { item, quantity: Math.min(item.stock, quantity) }];
    });
    showToast(`"${item.name}" hozzáadva a kóstoló foglaláshoz!`, 'success');
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Order Placement
  const placeOrder = (userName, userPhone, pickupTime, exhibitorId) => {
    if (cart.length === 0) return null;

    const exhibitorCartItems = cart.filter((c) => c.item.exhibitor_id === exhibitorId);
    if (exhibitorCartItems.length === 0) return null;

    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      user_name: userName,
      user_phone: userPhone,
      exhibitor_id: exhibitorId,
      items: exhibitorCartItems.map((c) => ({
        id: c.item.id,
        name: c.item.name,
        quantity: c.quantity
      })),
      pickup_time: pickupTime,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Deduct stock for ordered items
    exhibitorCartItems.forEach((c) => {
      updateItemStock(c.item.id, -c.quantity);
    });

    setOrders((prev) => [newOrder, ...prev]);
    setMyOrderIds((prev) => [newOrder.id, ...prev]);
    setCart((prev) => prev.filter((c) => c.item.exhibitor_id !== exhibitorId));

    showToast(`Kóstoló foglalás elküldve! Azonosító: #${newOrder.id}`, 'success');
    return newOrder;
  };

  // Update order status (by Exhibitor)
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
    showToast(`Foglalás #${orderId} frissítve!`);
  };

  // File to Base64 Image Conversion Helper with automatic Canvas compression (max 800px JPEG)
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(e.target.result);
      };
      reader.onerror = (error) => reject(error);
    });
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
  const likeReel = async (reelId) => {
    setReels((prev) =>
      prev.map((r) => (r.id === reelId ? { ...r, likes: (r.likes || 0) + 1 } : r))
    );

    try {
      const reel = reels.find((r) => r.id === reelId);
      const newLikes = (reel?.likes || 0) + 1;
      await supabase.from('reels').update({ likes: newLikes }).eq('id', reelId);
    } catch (e) {
      console.warn('Supabase reel like notice:', e);
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
        logoutExhibitor,
        exhibitors,
        menuItems,
        orders,
        reels,
        postReel,
        likeReel,
        convertFileToBase64,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isMyOrdersOpen,
        setIsMyOrdersOpen,
        myOrderIds,
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
        placeOrder,
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
        updateOrderStatus,
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

export const formatPrice = (price) => {
  if (price === undefined || price === null || String(price).trim() === '') {
    return 'Adományos';
  }
  const pStr = String(price).trim();
  if (pStr === '0' || pStr.toLowerCase() === 'ingyenes') return 'Ingyenes / Adományos';
  if (!isNaN(Number(pStr))) return `${Number(pStr).toLocaleString('hu-HU')} Ft`;
  if (pStr.toLowerCase().includes('ft')) return pStr;
  return `${pStr} Ft`;
};

export function useOrsolya() {
  const context = useContext(OrsolyaContext);
  if (!context) {
    throw new Error('useOrsolya must be used within an OrsolyaProvider');
  }
  return context;
}
