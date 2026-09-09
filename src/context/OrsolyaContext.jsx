import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_EXHIBITORS, INITIAL_MENU_ITEMS, INITIAL_ORDERS } from '../data/mockOrsolyaData';

const OrsolyaContext = createContext();

export function OrsolyaProvider({ children }) {
  // Active View Mode: 'visitor' | 'exhibitor' | 'map' | 'login'
  const [activeView, setActiveView] = useState('visitor');

  // Logged-in exhibitor ID (null if guest/visitor)
  const [activeExhibitorId, setActiveExhibitorId] = useState(() => {
    return localStorage.getItem('orsolya_logged_exhibitor_id') || null;
  });

  // State: Exhibitors, Menu Items, Orders
  const [exhibitors, setExhibitors] = useState(() => {
    const saved = localStorage.getItem('orsolya_exhibitors');
    return saved ? JSON.parse(saved) : INITIAL_EXHIBITORS;
  });

  const [menuItems, setMenuItems] = useState(() => {
    const saved = localStorage.getItem('orsolya_menu_items');
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('orsolya_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Scanned Favorite Exhibitors (by QR code or manual favorite)
  const [favoriteExhibitorIds, setFavoriteExhibitorIds] = useState(() => {
    const saved = localStorage.getItem('orsolya_favorite_exhibitor_ids');
    return saved ? JSON.parse(saved) : ['ex-1'];
  });

  // Visitor Cart state (Portions reservation)
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [myOrderIds, setMyOrderIds] = useState(() => {
    const saved = localStorage.getItem('orsolya_my_order_ids');
    return saved ? JSON.parse(saved) : ['ORD-1001'];
  });

  // Public Voting system: voted item IDs persisted in LocalStorage
  const [votedItemIds, setVotedItemIds] = useState(() => {
    const saved = localStorage.getItem('orsolya_voted_item_ids');
    return saved ? JSON.parse(saved) : [];
  });

  // Toast message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === msg ? null : prev));
    }, 3500);
  };

  // Sync to LocalStorage & cross-tab sync
  useEffect(() => {
    localStorage.setItem('orsolya_exhibitors', JSON.stringify(exhibitors));
  }, [exhibitors]);

  useEffect(() => {
    localStorage.setItem('orsolya_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);

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
    localStorage.setItem('orsolya_voted_item_ids', JSON.stringify(votedItemIds));
  }, [votedItemIds]);

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

  useEffect(() => {
    if (activeExhibitorId) {
      localStorage.setItem('orsolya_logged_exhibitor_id', activeExhibitorId);
    } else {
      localStorage.removeItem('orsolya_logged_exhibitor_id');
    }
  }, [activeExhibitorId]);

  // Check URL query parameters for QR code scans (e.g. ?stand=ex-1 or ?qr=ex-1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scannedStandParam = params.get('stand') || params.get('qr');
    if (scannedStandParam) {
      const found = exhibitors.find((ex) => ex.id === scannedStandParam || ex.pin === scannedStandParam);
      if (found) {
        addFavoriteExhibitor(found.id);
        showToast(`${found.name} beszkennelve és hozzáadva a Kedvencekhez!`, 'success');
      }
    }
  }, []);

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
    setFavoriteExhibitorIds((prev) =>
      prev.includes(exhibitorId) ? prev.filter((id) => id !== exhibitorId) : [...prev, exhibitorId]
    );
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

  // Exhibitor Profile update (Bio, Story, Cause)
  const updateExhibitorProfile = (exhibitorId, updatedData) => {
    setExhibitors((prev) =>
      prev.map((ex) => (ex.id === exhibitorId ? { ...ex, ...updatedData } : ex))
    );
    showToast('Stand adatok és történet frissítve!', 'success');
  };

  // Real-time Stock Adjustments
  const updateItemStock = (itemId, delta) => {
    setMenuItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const newStock = Math.max(0, item.stock + delta);
          const newStatus = newStock === 0 ? 'sold_out' : item.status === 'sold_out' ? 'ready' : item.status;
          return { ...item, stock: newStock, status: newStatus };
        }
        return item;
      })
    );
  };

  // Update item status
  const updateItemStatus = (itemId, status, etaMinutes = 0) => {
    setMenuItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return { ...item, status, eta_minutes: etaMinutes };
        }
        return item;
      })
    );
    showToast('Állapot frissítve!');
  };

  // Save/Add menu item dynamically
  const saveMenuItem = (itemData) => {
    if (itemData.id) {
      setMenuItems((prev) => prev.map((i) => (i.id === itemData.id ? { ...i, ...itemData } : i)));
      showToast('Étel frissítve!', 'success');
    } else {
      const newItem = {
        ...itemData,
        id: `item-${Date.now()}`,
        exhibitor_id: activeExhibitorId,
        stock: itemData.initial_stock || 20,
        initial_stock: itemData.initial_stock || 20,
        status: 'ready'
      };
      setMenuItems((prev) => [...prev, newItem]);
      showToast('Új étel hozzáadva a standodhoz!', 'success');
    }
  };

  // Delete menu item
  const deleteMenuItem = (itemId) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
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
        votedItemIds,
        voteForItem,
        placeOrder,
        updateItemStock,
        updateItemStatus,
        saveMenuItem,
        deleteMenuItem,
        updateExhibitorProfile,
        updateOrderStatus,
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
