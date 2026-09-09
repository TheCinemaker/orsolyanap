import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_EXHIBITORS, INITIAL_MENU_ITEMS, INITIAL_ORDERS } from '../data/mockOrsolyaData';
import { supabase } from '../lib/supabaseClient';

const OrsolyaContext = createContext();

export function OrsolyaProvider({ children }) {
  // Active View Mode: 'visitor' | 'exhibitor' | 'map' | 'login' | 'tv'
  const [activeView, setActiveView] = useState('visitor');

  // Logged-in exhibitor ID (null if guest/visitor)
  const [activeExhibitorId, setActiveExhibitorId] = useState(() => {
    return localStorage.getItem('orsolya_logged_exhibitor_id') || null;
  });

  // State: Exhibitors, Menu Items, Orders, Reels (Default to empty arrays for clean testing)
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

  // Toast message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === msg ? null : prev));
    }, 3500);
  };

  // Clear all local storage cache on load for clean production testing
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
      try {
        const { data: exData, error: exErr } = await supabase.from('exhibitors').select('*');
        if (exErr) {
          console.warn('Supabase exhibitors notice:', exErr.message);
          setExhibitors([]);
        } else if (exData) {
          const formattedEx = exData.map((e) => ({
            ...e,
            hasDrinks: e.has_drinks !== undefined ? e.has_drinks : e.hasDrinks
          }));
          setExhibitors(formattedEx);
        }

        const { data: itemData, error: itemErr } = await supabase.from('menu_items').select('*');
        if (itemErr) {
          console.warn('Supabase menu_items notice:', itemErr.message);
          setMenuItems([]);
        } else if (itemData) {
          // Filter out legacy restaurant food items (items without exhibitor_id)
          const validOrsolyaItems = itemData.filter((item) => item.exhibitor_id);
          setMenuItems(validOrsolyaItems);
        }

        const { data: reelData, error: reelErr } = await supabase.from('reels').select('*').order('created_at', { ascending: false });
        if (!reelErr && reelData) {
          setReels(reelData);
        }
      } catch (err) {
        console.warn('Supabase fetch notice: Using clean empty state', err);
        setExhibitors([]);
        setMenuItems([]);
        setReels([]);
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
                setMenuItems((prev) => {
                  if (prev.some((item) => item.id === payload.new.id)) return prev;
                  return [...prev, payload.new];
                });
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
              setReels((prev) => {
                if (prev.some((r) => r.id === payload.new.id)) return prev;
                return [payload.new, ...prev];
              });
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

  // Vote for a dish / item
  const voteForItem = (itemId) => {
    if (votedItemIds.includes(itemId)) {
      showToast('Erre az ételre már leadtad a közönségszavazatodat!', 'error');
      return false;
    }

    setVotedItemIds((prev) => [...prev, itemId]);
    setMenuItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return { ...item, votes: (item.votes || 0) + 1 };
        }
        return item;
      })
    );
    showToast('Köszönjük a közönségszavazatot!', 'success');
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
    try {
      await supabase.from('exhibitors').update({ has_drinks: hasDrinks }).eq('id', exhibitorId);
    } catch (e) {
      console.warn('Supabase sync warning:', e);
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

    showToast(`Új csapat (${newTeam.name}) sikeresen regisztrálva! PIN: ${generatedPin}`, 'success');
    return newTeam;
  };

  // Full Database & State Purge (Super Admin helper)
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

    try {
      await supabase.from('menu_items').delete().neq('id', '0');
      await supabase.from('exhibitors').delete().neq('id', '0');
      await supabase.from('orders').delete().neq('id', '0');
      await supabase.from('votes').delete().neq('id', '0');
    } catch (e) {
      console.warn('Supabase purge error:', e);
    }

    showToast('Az adatbázis és az összes teszt adat sikeresen kitörölve!', 'success');
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

    try {
      await supabase.from('exhibitors').update({ pin: cleanPin }).eq('id', exhibitorId);
    } catch (e) {
      console.warn('Supabase PIN update warning:', e);
    }

    showToast('PIN kód sikeresen frissítve!', 'success');
    return true;
  };

  // Exhibitor Profile update (Bio, Story, Cause, Contacts, Days)
  const updateExhibitorProfile = async (exhibitorId, updatedData) => {
    setExhibitors((prev) =>
      prev.map((ex) => (ex.id === exhibitorId ? { ...ex, ...updatedData } : ex))
    );
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

    try {
      await supabase.from('menu_items').update({ stock: targetStock, status: targetStatus }).eq('id', itemId);
    } catch (e) {
      console.warn('Supabase sync warning:', e);
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
    try {
      await supabase.from('menu_items').update({ status }).eq('id', itemId);
    } catch (e) {
      console.warn('Supabase sync warning:', e);
    }
    showToast('Állapot frissítve!');
  };

  // Save/Add menu item dynamically (with Allergen flags and Available day)
  const saveMenuItem = async (itemData) => {
    const formattedItem = {
      ...itemData,
      is_gluten_free: !!itemData.is_gluten_free,
      is_lactose_free: !!itemData.is_lactose_free,
      is_sugar_free: !!itemData.is_sugar_free,
      is_vegan: !!itemData.is_vegan,
      available_day: itemData.available_day || 'both'
    };

    if (itemData.id) {
      setMenuItems((prev) => prev.map((i) => (i.id === itemData.id ? { ...i, ...formattedItem } : i)));
      try {
        await supabase.from('menu_items').update({
          name: formattedItem.name,
          description: formattedItem.description,
          initial_stock: Number(formattedItem.initial_stock),
          category: formattedItem.category,
          tags: formattedItem.tags,
          available_day: formattedItem.available_day,
          is_gluten_free: formattedItem.is_gluten_free,
          is_lactose_free: formattedItem.is_lactose_free,
          is_sugar_free: formattedItem.is_sugar_free,
          is_vegan: formattedItem.is_vegan,
          image: formattedItem.image || null
        }).eq('id', itemData.id);
      } catch (e) {
        console.warn('Supabase sync warning:', e);
      }
      showToast('Étel frissítve!', 'success');
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
      try {
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
        const { error: insErr } = await supabase.from('menu_items').insert([dbPayload]);
        if (insErr) {
          console.error('Supabase menu_items insert error:', insErr.message);
        }
      } catch (e) {
        console.warn('Supabase sync warning:', e);
      }
      showToast('Új étel hozzáadva a standodhoz!', 'success');
    }
  };

  // Delete menu item
  const deleteMenuItem = async (itemId) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await supabase.from('menu_items').delete().eq('id', itemId);
    } catch (e) {
      console.warn('Supabase sync warning:', e);
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

  // File to Base64 Image Conversion Helper
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
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
        console.error('Supabase reel insert error:', error);
        showToast(`A fotó mentése nem sikerült: ${error.message}`, 'error');
        return null;
      }

      const savedReel = data || newReel;
      setReels((prev) => {
        if (prev.some((r) => r.id === savedReel.id)) return prev;
        return [savedReel, ...prev];
      });

      showToast('📸 Élő pillanat sikeresen közzétéve!', 'success');
      return savedReel;
    } catch (e) {
      console.error('Supabase reel insert exception:', e);
      showToast('A fotó mentése nem sikerült. Ellenőrizd a kapcsolatot!', 'error');
      return null;
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
        addExhibitorTeam,
        updateExhibitorPin,
        updateExhibitorProfile,
        updateOrderStatus,
        selectedDay,
        setSelectedDay,
        selectedDietary,
        setSelectedDietary,
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
