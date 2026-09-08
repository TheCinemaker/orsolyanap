export const INITIAL_EXHIBITORS = [
  {
    id: 'ex-1',
    name: 'Jurisics Vár Bográcsozója',
    location: 'Jurisics tér 1.',
    pin: '1234',
    category: 'bogracs',
    isOpen: true,
    story: 'Kőszegi hagyományőrző baráti társaság vagyunk. Minden évben szabad tűzön, eredeti vasi receptek alapján főzünk a városapáknak és a látogatóknak.',
    cause: 'A kőszegi gyermekmentők és a helyi cserkészcsapat javára gyűjtünk adományokat.',
    phone: '+36 94 563 100',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    notice: 'A marhapörkölt frissen rotyog, várható elkészülés: 12:45!'
  },
  {
    id: 'ex-2',
    name: 'Kőszegi Borosgazdák Egyesülete',
    location: 'Jurisics tér 5.',
    pin: '2345',
    category: 'ital',
    isOpen: true,
    story: 'A Kőszegi Hegyközség szőlősgazdái. A kőszegi Kékfrankos és a helyi borkultúra ápolása a szívügyünk.',
    cause: 'A kőszegi szőlőjövő és a történelmi szőlőskert felújítására gyűjtünk.',
    phone: '+36 30 998 7654',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    notice: 'Forró fűszeres forralt bor és friss szőlőmust kapható!'
  },
  {
    id: 'ex-3',
    name: 'Pékegér & Kőszegi Rétesház',
    location: 'Fő tér A-2 Stand',
    pin: '3456',
    category: 'desszert',
    isOpen: true,
    story: 'Kézműves családi pékség. Dédszüleink receptjei alapján, kézzel nyújtott tésztából sütjük a kőszegi réteseket.',
    cause: 'A helyi kézműves hagyományőrző iskola javára.',
    phone: '+36 30 445 1122',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    notice: 'Friss meleg meggyes-mákos rétes a kemencéből!'
  },
  {
    id: 'ex-4',
    name: 'Kőszegi Kürtőskalács',
    location: 'Fő tér A-6 Stand',
    pin: '4567',
    category: 'desszert',
    isOpen: true,
    story: 'Hagyományos faszénparázson sült kürtőskalácsok mesterei.',
    cause: 'Gyermeknevelési alapítvány támogatása.',
    phone: '+36 20 334 5566',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    notice: 'Friss meleg kürtőskalács sütés folyamatosan!'
  },
  {
    id: 'ex-5',
    name: 'Vasi Vadászok & Erdészklub',
    location: 'Jurisics Várudvar B-3',
    pin: '5678',
    category: 'bogracs',
    isOpen: true,
    story: 'A Kőszegi-hegység erdészei és vadászai. Kőszegi erdei gombákkal és vadételekkel várunk mindenkit.',
    cause: 'Az erdei tanösvények és vadrezervátum támogatására.',
    phone: '+36 30 777 8899',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    notice: 'Erdei szarvaspörkölt dödöllével kész a Várudvarban!'
  }
];

export const INITIAL_MENU_ITEMS = [
  {
    id: 'item-101',
    exhibitor_id: 'ex-1',
    name: 'Bográcsos Marhapörkölt Tarhonyával',
    description: 'Szabad tűzön, vörösborral és kőszegi fűszerpaprikával főzött szaftos marhapörkölt, házi tarhonyával.',
    stock: 25,
    initial_stock: 40,
    status: 'ready', // 'ready', 'cooking', 'sold_out'
    eta_minutes: 0,
    tags: ['Bográcsos', 'Kőszegi Recept'],
    category: 'bogracs',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-102',
    exhibitor_id: 'ex-1',
    name: 'Kőszegi Szüretes Gulyásleves',
    description: 'Gazdag gulyásleves füstölt csülökkel, házi csipetkével és friss kőszegi kenyérrel.',
    stock: 15,
    initial_stock: 35,
    status: 'ready',
    eta_minutes: 0,
    tags: ['Gulyás', 'Friss kenyérrel'],
    category: 'bogracs',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-201',
    exhibitor_id: 'ex-2',
    name: 'Fűszeres Forralt Kékfrankos',
    description: 'Minőségi kőszegi Kékfrankos bor narancshéjjal, fahéjjal és szegfűszeggel melegítve.',
    stock: 80,
    initial_stock: 150,
    status: 'ready',
    eta_minutes: 0,
    tags: ['Forró bor', 'Helyi Kékfrankos'],
    category: 'ital',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-202',
    exhibitor_id: 'ex-2',
    name: 'Friss Kőszegi Szőlőmust',
    description: 'Alkoholmentes, frissen préselt édes Kőszegi Kékfrankos szőlőlé.',
    stock: 45,
    initial_stock: 100,
    status: 'ready',
    eta_minutes: 0,
    tags: ['Alkoholmentes', '100% Gyümölcs'],
    category: 'ital',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-301',
    exhibitor_id: 'ex-3',
    name: 'Házi Meggyes-Mákos Rétes',
    description: 'Kézzel nyújtott vékony tészta, bőséges meggyes-mákos töltelékkel.',
    stock: 20,
    initial_stock: 60,
    status: 'ready',
    eta_minutes: 0,
    tags: ['Házi Rétes', 'Kemencés'],
    category: 'desszert',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-302',
    exhibitor_id: 'ex-3',
    name: 'Vasi Tökös-Mákos Rétes',
    description: 'Tradicionális vas megyei sült tökös és darált mákos rétes különlegesség.',
    stock: 12,
    initial_stock: 45,
    status: 'ready',
    eta_minutes: 0,
    tags: ['Vasi Specialitás'],
    category: 'desszert',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-401',
    exhibitor_id: 'ex-4',
    name: 'Diós Kürtőskalács',
    description: 'Faszénfelett forgatott, karamellizált dióburokban.',
    stock: 28,
    initial_stock: 80,
    status: 'ready',
    eta_minutes: 0,
    tags: ['Friss Kürtős', 'Meleg'],
    category: 'desszert',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-501',
    exhibitor_id: 'ex-5',
    name: 'Erdei Gombás Szarvaspörkölt Dödöllével',
    description: 'Kőszegi erdei gombákkal párolt szarvascomb, serpenyőben pirított vasi dödöllével.',
    stock: 10,
    initial_stock: 30,
    status: 'ready',
    eta_minutes: 0,
    tags: ['Erdei Vadétel', 'Dödölle'],
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
      { id: 'item-101', name: 'Bográcsos Marhapörkölt Tarhonyával', quantity: 2 }
    ],
    pickup_time: '12:30',
    status: 'ready',
    created_at: new Date(Date.now() - 15 * 60000).toISOString()
  }
];
