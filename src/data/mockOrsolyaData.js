export const INITIAL_EXHIBITORS = [
  {
    id: 'ex-1',
    name: 'Jurisics Vár Bográcsozója',
    location: 'Jurisics tér 1. (Önkormányzat előtt)',
    pin: '1234',
    category: 'bogracs',
    isOpen: true,
    description: 'Tradicionális kőszegi bográcsos ételek, szabad tűzön, helyi alapanyagokból főzve.',
    phone: '+36 94 563 100',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    notice: '🔥 A marhapörkölt most frissen rotyog! Várható elkészülés 12:45-kor.'
  },
  {
    id: 'ex-2',
    name: 'Kőszegi Borosgazdák Egyesülete',
    location: 'Jurisics tér 5. (Várostorony mellett)',
    pin: '2345',
    category: 'ital',
    isOpen: true,
    description: 'Eredeti kőszegi Kékfrankos, forralt bor fűszeres titkos recept alapján és friss szőlőmust.',
    phone: '+36 30 998 7654',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    notice: '🍷 Forró fűszeres forralt Kékfrankos azonnal kapható!'
  },
  {
    id: 'ex-3',
    name: 'Pékegér & Kőszegi Rétesház',
    location: 'Fő tér A-2 Stand',
    pin: '3456',
    category: 'desszert',
    isOpen: true,
    description: 'Hagyományos kézzel nyújtott házi rétesek és kemencés kézműves sós sütemények.',
    phone: '+36 30 445 1122',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    notice: '🥐 Friss meleg meggyes-mákos rétes a kemencéből 10 percenként!'
  },
  {
    id: 'ex-4',
    name: 'Kőszegi Kézműves Kürtőskalács',
    location: 'Fő tér A-6 Stand',
    pin: '4567',
    category: 'desszert',
    isOpen: true,
    description: 'Faszénparázson sült, kívül ropogós, belül puha kürtőskalácsok 8 féle ízben.',
    phone: '+36 20 334 5566',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    notice: '⚡ Előrendelhető frissen sütve, várakozás nélkül!'
  },
  {
    id: 'ex-5',
    name: 'Vasi Vadászok & Erdészklub',
    location: 'Jurisics Várudvar B-3',
    pin: '5678',
    category: 'bogracs',
    isOpen: true,
    description: 'Ínycsiklandó erdei vadételek kőszegi gombával és vasi dödöllével.',
    phone: '+36 30 777 8899',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    notice: '🌲 Szarvaspörkölt dödöllével kész a Várudvarban!'
  }
];

export const INITIAL_MENU_ITEMS = [
  {
    id: 'item-101',
    exhibitor_id: 'ex-1',
    name: 'Bográcsos Marhapörkölt Tarhonyával',
    description: 'Szabad tűzön, vörösborral és kőszegi fűszerpaprikával főzött szaftos marhapörkölt, házi tarhonyával.',
    price: 3200,
    stock: 18,
    initial_stock: 40,
    status: 'ready', // 'ready', 'cooking', 'sold_out'
    eta_minutes: 0,
    tags: ['🔥 Bográcsos', 'Kőszegi Recept', 'Tartalmas'],
    category: 'bogracs',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-102',
    exhibitor_id: 'ex-1',
    name: 'Kőszegi Szüretes Gulyásleves',
    description: 'Gazdag gulyásleves füstölt csülökkel, házi csipetkével és friss kőszegi kenyérrel.',
    price: 2400,
    stock: 12,
    initial_stock: 35,
    status: 'ready',
    eta_minutes: 0,
    tags: ['Friss kenyérrel', 'Klasszikus'],
    category: 'bogracs',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-201',
    exhibitor_id: 'ex-2',
    name: 'Fűszeres Forralt Kékfrankos (3dl)',
    description: 'Minőségi kőszegi Kékfrankos bor narancshéjjal, fahéjjal és szegfűszeggel melegítve.',
    price: 1100,
    stock: 85,
    initial_stock: 150,
    status: 'ready',
    eta_minutes: 0,
    tags: ['🍷 Forró', 'Helyi Bor', 'Őszi Kedvenc'],
    category: 'ital',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-202',
    exhibitor_id: 'ex-2',
    name: 'Friss Kőszegi Szőlőmust (3dl)',
    description: 'Alkoholmentes, frissen préselt édes Kőszegi Kékfrankos és Olaszrizling szőlőlé.',
    price: 700,
    stock: 50,
    initial_stock: 100,
    status: 'ready',
    eta_minutes: 0,
    tags: ['🍇 Alkoholmentes', '100% Gyümölcs'],
    category: 'ital',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-301',
    exhibitor_id: 'ex-3',
    name: 'Házi Meggyes-Mákos Rétes (Szelet)',
    description: 'Kézzel nyújtott vékony tészta, bőséges meggyes-mákos töltelékkel, porcukorral.',
    price: 850,
    stock: 24,
    initial_stock: 60,
    status: 'ready',
    eta_minutes: 0,
    tags: ['🥐 Kemencés', 'Kézműves'],
    category: 'desszert',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-302',
    exhibitor_id: 'ex-3',
    name: 'Vasi Tökös-Mákos Rétes (Szelet)',
    description: 'Tradicionális vas megyei sült tökös és darált mákos rétes különlegesség.',
    price: 850,
    stock: 15,
    initial_stock: 45,
    status: 'ready',
    eta_minutes: 0,
    tags: ['🎃 Vasi Specialitás'],
    category: 'desszert',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-401',
    exhibitor_id: 'ex-4',
    name: 'Klasszikus Diós Kürtőskalács',
    description: 'Faszénfelett forgatott, karamellizált dióburokban.',
    price: 1800,
    stock: 30,
    initial_stock: 80,
    status: 'ready',
    eta_minutes: 0,
    tags: ['🔥 Meleg', 'Diós'],
    category: 'desszert',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-501',
    exhibitor_id: 'ex-5',
    name: 'Erdei Gombás Szarvaspörkölt Dödöllével',
    description: 'Kőszegi erdei gombákkal, vörösborral párolt szarvascomb, serpenyőben pirított vasi dödöllével.',
    price: 3800,
    stock: 9,
    initial_stock: 30,
    status: 'ready',
    eta_minutes: 0,
    tags: ['🌲 Vadétel', 'Vasi Dödölle', 'Prémium'],
    category: 'bogracs',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'ORD-1001',
    user_name: 'Horváth Péter',
    user_phone: '+36 30 123 4567',
    exhibitor_id: 'ex-1',
    items: [
      { id: 'item-101', name: 'Bográcsos Marhapörkölt Tarhonyával', quantity: 2, price: 3200 }
    ],
    total_price: 6400,
    pickup_time: '12:30',
    status: 'ready', // 'pending', 'accepted', 'ready', 'completed', 'cancelled'
    created_at: new Date(Date.now() - 15 * 60000).toISOString()
  }
];
