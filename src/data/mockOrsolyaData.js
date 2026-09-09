export const FESTIVAL_BOUNDS = [
  [47.38890538441469, 16.538691475076607],
  [47.38953425187408, 16.537956904927757],
  [47.39001943732405, 16.539127719901042],
  [47.390622403025804, 16.539972560296093]
];

export const INITIAL_EXHIBITORS = [
  {
    id: 'ex-1',
    name: 'Jurisics Vár Bográcsozója',
    location: 'Diáksétány 1. (Vár felőli bejárat)',
    coordinates: [47.38988, 16.53895],
    pin: '1234',
    category: 'meleg_etel',
    hasDrinks: false,
    offerings: 'Bográcsos marhapörkölt, szüretes gulyásleves, tejfölös babgulyás, csülkös pacal',
    isOpen: true,
    story: 'Kőszegi hagyományőrző baráti társaság vagyunk. Minden évben szabad tűzön, eredeti vasi receptek alapján főzünk a Diáksétányon.',
    cause: 'A kőszegi gyermekmentők és a helyi cserkészcsapat javára gyűjtünk adományokat.',
    phone: '+36 94 563 100',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    notice: 'A marhapörkölt frissen rotyog a Diáksétányon!'
  },
  {
    id: 'ex-2',
    name: 'Kőszegi Borosgazdák Egyesülete',
    location: 'Diáksétány 3. (Gyöngyös-patak hídjánál)',
    coordinates: [47.38962, 16.53835],
    pin: '2345',
    category: 'ital',
    hasDrinks: true,
    offerings: 'Kőszegi Kékfrankos borok, forró fűszeres forralt bor, friss szőlőmust, borpárlat',
    isOpen: true,
    story: 'A Kőszegi Hegyközség szőlősgazdái. A kőszegi Kékfrankos és a helyi borkultúra ápolása a szívügyünk.',
    cause: 'A kőszegi szőlőjövő és a történelmi szőlőskert felújítására gyűjtünk.',
    phone: '+36 30 998 7654',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    notice: 'Forró fűszeres forralt bor és friss szőlőmust kapható a patakparton!'
  },
  {
    id: 'ex-3',
    name: 'Pékegér & Kőszegi Rétesház',
    location: 'Diáksétány 5. (Központi sétány)',
    coordinates: [47.38948, 16.53885],
    pin: '3456',
    category: 'retes',
    hasDrinks: true,
    offerings: 'Házi meggyes-mákos rétes, vasi tökös-mákos rétes, kézműves pogácsa, meleg almalé',
    isOpen: true,
    story: 'Kézműves családi pékség. Dédszüleink receptjei alapján, kézzel nyújtott tésztából sütjük a kőszegi réteseket.',
    cause: 'A helyi kézműves hagyományőrző iskola javára.',
    phone: '+36 30 445 1122',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    notice: 'Friss meleg meggyes-mákos rétes a kemencéből!'
  },
  {
    id: 'ex-4',
    name: 'Kőszegi Kürtőskalács & Kávézó',
    location: 'Diáksétány 8. (Park felőli oldal)',
    coordinates: [47.38918, 16.53870],
    pin: '4567',
    category: 'sutemeny',
    hasDrinks: true,
    offerings: 'Faszénen sült diós és fahéjas kürtőskalács, eszpresszó, cappuccino, forró csoki',
    isOpen: true,
    story: 'Hagyományos faszénparázson sült kürtőskalácsok mesterei.',
    cause: 'Gyermeknevelési alapítvány támogatása.',
    phone: '+36 20 334 5566',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    notice: 'Friss meleg kürtőskalács sütés és forró kávé folyamatosan!'
  },
  {
    id: 'ex-5',
    name: 'Vasi Vadászok & Erdészklub',
    location: 'Diáksétány 12. (Színpad mellett)',
    coordinates: [47.38935, 16.53950],
    pin: '5678',
    category: 'meleg_etel',
    hasDrinks: false,
    offerings: 'Erdei gombás szarvaspörkölt dödöllével, tepsis vasi dödölle pirított hagymával',
    isOpen: true,
    story: 'A Kőszegi-hegység erdészei és vadászai. Kőszegi erdei gombákkal és vadételekkel várunk mindenkit.',
    cause: 'Az erdei tanösvények és vadrezervátum támogatására.',
    phone: '+36 30 777 8899',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    notice: 'Erdei szarvaspörkölt dödöllével kész a Színpad mellett!'
  },
  {
    id: 'ex-6',
    name: 'Írott-kő Sajt- & Mézkészítők',
    location: 'Diáksétány 15. (Várpark sétány)',
    coordinates: [47.38960, 16.53970],
    pin: '6789',
    category: 'helyi_termek',
    hasDrinks: false,
    offerings: 'Bükki és kőszegi kézműves sajtok, fűszeres sajtgolyók, akácméz, erdei méz, mézkülönlegességek',
    isOpen: true,
    story: 'Alpokaljai családi gazdaság. Natúrparki kézműves sajtokat és erdei mézeket kóstoltatunk.',
    cause: 'A helyi méhészeti egyesület támogatására.',
    phone: '+36 94 360 220',
    image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80',
    notice: 'Kézműves sajtkóstoló friss kőszegi kenyérrel!'
  }
];

export const INITIAL_MENU_ITEMS = [
  {
    id: 'item-101',
    exhibitor_id: 'ex-1',
    name: 'Bográcsos Marhapörkölt Tarhonyával',
    description: 'Szabad tűzön, vörösborral és kőszegi fűszerpaprikával főzött szaftos marhapörkölt, házi tarhonyával.',
    status: 'ready',
    votes: 42,
    tags: ['Meleg étel', 'Bográcsos', 'Pörkölt'],
    category: 'meleg_etel',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-102',
    exhibitor_id: 'ex-1',
    name: 'Kőszegi Szüretes Gulyásleves',
    description: 'Gazdag gulyásleves füstölt csülökkel, házi csipetkével és friss kőszegi kenyérrel.',
    status: 'ready',
    votes: 38,
    tags: ['Meleg étel', 'Gulyás', 'Leves'],
    category: 'meleg_etel',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-103',
    exhibitor_id: 'ex-1',
    name: 'Tejfölös Csülkös Babgulyás',
    description: 'Bográcsban rotyogott tarkabab gulyás füstölt csülökkel, csipetkével és friss tormával.',
    status: 'ready',
    votes: 29,
    tags: ['Meleg étel', 'Gulyás', 'Babgulyás'],
    category: 'meleg_etel',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-104',
    exhibitor_id: 'ex-1',
    name: 'Bográcsos Csülkös Pacalpörkölt',
    description: 'Hagyományos fűszeres pacalpörkölt abált csülökkel és főtt burgonyával.',
    status: 'ready',
    votes: 31,
    tags: ['Meleg étel', 'Pacal', 'Pörkölt'],
    category: 'meleg_etel',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-201',
    exhibitor_id: 'ex-2',
    name: 'Fűszeres Forralt Kékfrankos',
    description: 'Minőségi kőszegi Kékfrankos bor narancshéjjal, fahéjjal és szegfűszeggel melegítve.',
    status: 'ready',
    votes: 35,
    tags: ['Ital', 'Forralt bor', 'Kékfrankos'],
    category: 'ital',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-202',
    exhibitor_id: 'ex-2',
    name: 'Friss Kőszegi Szőlőmust',
    description: 'Alkoholmentes, frissen préselt édes Kőszegi Kékfrankos szőlőlé.',
    status: 'ready',
    votes: 19,
    tags: ['Ital', 'Must', 'Alkoholmentes'],
    category: 'ital',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-301',
    exhibitor_id: 'ex-3',
    name: 'Házi Meggyes-Mákos Rétes',
    description: 'Kézzel nyújtott vékony tészta, bőséges meggyes-mákos töltelékkel.',
    status: 'ready',
    votes: 51,
    tags: ['Rétes', 'Meggyes rétes', 'Házi'],
    category: 'retes',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-302',
    exhibitor_id: 'ex-3',
    name: 'Vasi Tökös-Mákos Rétes',
    description: 'Tradicionális vas megyei sült tökös és darált mákos rétes különlegesség.',
    status: 'ready',
    votes: 23,
    tags: ['Rétes', 'Vasi Specialitás'],
    category: 'retes',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-401',
    exhibitor_id: 'ex-4',
    name: 'Diós Kürtőskalács',
    description: 'Faszénfelett forgatott, karamellizált dióburokban.',
    status: 'ready',
    votes: 31,
    tags: ['Sütemény', 'Kürtőskalács'],
    category: 'sutemeny',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-501',
    exhibitor_id: 'ex-5',
    name: 'Erdei Gombás Szarvaspörkölt Dödöllével',
    description: 'Kőszegi erdei gombákkal párolt szarvascomb, serpenyőben pirított vasi dödöllével.',
    status: 'ready',
    votes: 47,
    tags: ['Meleg étel', 'Dödölle', 'Szarvas'],
    category: 'meleg_etel',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'item-502',
    exhibitor_id: 'ex-5',
    name: 'Tepsis Vasi Dödölle Pirított Hagymával',
    description: 'Burgonyás dödölle ropogósra pirítva, házi fokhagymás tejföllel és sült hagymával.',
    status: 'ready',
    votes: 36,
    tags: ['Meleg étel', 'Dödölle'],
    category: 'meleg_etel',
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
