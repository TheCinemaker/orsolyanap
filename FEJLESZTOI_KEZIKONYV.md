# Fejlesztői kézikönyv

Ez a lap arról szól, **hogyan kell ebben a projektben kódolni**. Azért van,
mert a tudás eddig egy beszélgetésben élt, és egy beszélgetés nem jön át egy
másik gépre.

Három lap van, és nem keverednek:

| Lap | Mit mond el | Mikor nyisd ki |
|---|---|---|
| `CLAUDE.md` | a megszeghetetlen szabályok, röviden | mindig, ez a rövid lista |
| `HELYSZINEN.md` | a vásár alatti műveletek, parancsonként | a sátorban, laptoppal |
| **ez a lap** | a rendszer felépítése és a kódolás szabályai | ha kódot írsz vagy olvasol |

Ha a három ütközik, a `CLAUDE.md` a mérvadó: az a legszűkebb, és azért rövid,
hogy mindig elolvassák.

---

## 1. Az első öt perc egy új gépen

```bash
git clone https://github.com/TheCinemaker/orsolyanap.git
cd orsolyanap
npm install
```

Majd `.env` a repó gyökerébe (**sosem kerül gitbe**, a repó nyilvános):

```
VITE_SUPABASE_URL=https://qceznytdsqdcodgrgoxd.supabase.co
VITE_SUPABASE_ANON_KEY=<Supabase → Project Settings → API → anon public>
SUPABASE_SERVICE_ROLE_KEY=<ugyanott a service_role>
```

A `VITE_` előtagúak a böngészőbe is bekerülnek — ez szándékos, az anon kulcs
publikus. A `service_role` **csak a `scripts/` alattiaknak** kell, és az
egész adatbázist írja, törli, az RLS-t megkerüli. Soha ne tedd `VITE_`
előtaggal semmilyen fájlba, és ne hivatkozz rá kliensoldali kódból.

```bash
npm run dev       # http://localhost:5173
npx vite --host   # telefonról, ugyanazon a WiFi-n
npm run build     # a dist ~850 kB; ha hirtelen MB-os, kép került a public/-ba
npm run lint      # oxlint
node scripts/ellenorzes.mjs   # az adat állapota: mi hiányzik
```

A dev szerver az ÉLES adatbázist használja. Nincs külön fejlesztői Supabase,
tehát **amit a dev felületen módosítasz, az éles.** Olvasni bátran, írni
gondolkodva. Próbának ott a `--proba` a szkripteken.

---

## 2. A rendszer térképe

```
         ┌─────────────────────────────────────────────┐
         │  Netlify (statikus hosting, nincs szerver)  │
         │  dist/ : index.html + egy JS + egy CSS      │
         │  public/ : manifest, ikonok, pillanatkép,   │
         │            mentett-kepek/ (227 kép)         │
         └───────────────┬─────────────────────────────┘
                         │  a böngésző letölti
                         ▼
         ┌─────────────────────────────────────────────┐
         │  React 19 + Vite + Tailwind 4               │
         │  minden adat egy helyen: OrsolyaContext     │
         └───────┬───────────────────────┬─────────────┘
                 │ anon kulcs            │ anon kulcs
                 ▼                       ▼
     ┌───────────────────────┐  ┌──────────────────────┐
     │ Supabase PostgREST    │  │ Supabase Realtime    │
     │ táblák + RPC          │  │ postgres_changes     │
     └───────────┬───────────┘  └──────────────────────┘
                 │                 Storage: etelek, logok,
                 │                 reels, feltoltes
                 ▼
     ┌───────────────────────────────────────────┐
     │ scripts/*.mjs  —  service_role kulccsal   │
     │ adatfelvétel, képfeltöltés, pillanatkép   │
     └───────────────────────────────────────────┘
```

Két dolog következik ebből, és mindkettő sokszor eldönti, hogyan kell
megoldani valamit:

**Nincs szerveroldali kódunk.** Nincs hova titkot tenni, és nincs mibe
proxyt tenni. Ezért hasalt el a kőszegi mérőállomás hívása: nem küld
CORS-fejlécet, és a kiemet.hu is a saját Netlify-függvényén keresztül kéri.
Amit a böngészőből nem lehet elérni, azt itt **nem lehet elérni** — vagy
keress olyan forrást, ami engedi (Open-Meteo), vagy hagyd ki.

**Az adatbázis a határ.** Minden szabály, amit nem az adatbázis tart be,
csak a kliens jóindulata. A letöltött JS-t bárki elolvassa, az anon kulcsot
kiszedi, és REST-ben bármit elküld. Ezért van a szavazás, a kedvelés és az
infótábla `security definer` függvényben, és ezért nincs a táblákon
insert policy.

---

## 3. Az adatmodell

Az ÉLES séma, lekérdezve. A `supabase-schema.sql` **elavult** — abból
oszlopot ne következtess, inkább kérdezd le.

### exhibitors — 38 stand

| oszlop | mit tart | megjegyzés |
|---|---|---|
| `id` | `text`, pl. `ex-dance-jam-koszeg` | nem uuid: a szkriptek névből képzik |
| `name` | a stand neve | ez a párosítás kulcsa a fotómappákhoz |
| `location` | pl. `Diáksétány` | |
| `coordinates` | `jsonb`, `[lat, lon]` | 6 tizedesjegy = bemért, több = becsült |
| `pin` | 4 jegyű belépési kód | **az anon kulcs NEM olvashatja** |
| `category` | `gasztro`, `civil`, `iskola`… | |
| `has_drinks` | van-e ital | a kliensben `hasDrinks` néven |
| `offerings` | kínálat egy sorban | `NOT NULL` |
| `days` | `both` / `saturday` / `sunday` | |
| `is_open` | | |
| `story` | bemutatkozás | |
| `cause` | jótékonysági cél | |
| `phone`, `email`, `facebook_url`, `instagram_url` | | |
| `image` | a logó publikus Storage-URL-je | |
| `notice` | **állandó** megjegyzés | nem időpontos hír, az az infótáblán van |
| `created_at` | | |

### menu_items — 189 étel és ital

| oszlop | mit tart | megjegyzés |
|---|---|---|
| `id` | `text`, `<stand>-<etel>` alapján | |
| `exhibitor_id` | → exhibitors.id | aki üresen hagyja, az étel eltűnik a katalógusból |
| `name`, `description` | `description` **nullable** | ezért kell mindenhol `?.` |
| `category` | `meleg_etel`, `street_food`, `sutemeny`, `italok`, `egyeb` | ez dönti el, melyik szekcióba kerül |
| `available_day` | `both` / `saturday` / `sunday` | a versenyétel-szekciók ebből válogatnak |
| `status` | `ready` / `cooking` / `sold_out` | a standos három gombja |
| `stock`, `initial_stock` | adagszámláló | |
| `votes` | **gyorsítótár** az `item_votes` naplón | soha ne írj bele abszolút értéket |
| `is_gluten_free`, `is_lactose_free`, `is_sugar_free`, `is_vegan` | | csak biztos tudás alapján |
| `is_competition` | nevezett versenyétel | |
| `is_hidden` | a vendég nem látja | |
| `tags` | `text[]` | |
| `image` | publikus Storage-URL | |

**NINCS `price` oszlop, és nem is lesz.** A vásáron adománygyűjtés folyik.
Ha a mentés payloadjába bekerül, a Supabase `PGRST204`-cel az *egész* kérést
elutasítja, és a standos egyetlen ételt sem tud szerkeszteni.

### events — 22 program

`id, title, description, event_date, start_time, end_time, location,
category, performer, is_free, image, created_at`

A szervezői szövegből **csak a `description`-t** frissítjük
(`program-leirasok.mjs`). Időpontot, helyszínt, címet nem: egy elcsúszott
kezdés rosszabb, mint egy hiányzó leírás.

### reels — fotófolyam

`id, exhibitor_id, exhibitor_name, caption, image, likes, created_at`

A `likes` szintén csak gyorsítótár a `reel_likes` naplón.

### stand_hirek — infótábla

`id (uuid), exhibitor_id (nullable), szerzo, szoveg, created_at, modositva`

Üres `exhibitor_id` = az admin írta, a szerző ilyenkor a `szerzo`
(`Admin`). Javításnál a `created_at` **nem változik**, csak a `modositva`
telik meg — különben a bejegyzés előreugrana, mintha most írták volna.

### Naplók és számláló

- `item_votes (device_id, item_id, created_at)` — egy készülék egy ételre egyszer
- `reel_likes (device_id, reel_id, created_at)` — visszavonható
- `app_stats (key, value)` — két sor: `opens`, `devices`

---

## 4. Adatbázis-függvények (RPC)

Ami íráshoz függvényen megy, annak oka van: a táblán nincs megfelelő policy,
tehát a böngészőből **csak** így lehet írni.

| függvény | mit tesz | ki hívhatja |
|---|---|---|
| `vote_for_item(item_id, device_id)` | naplóba ír, a `votes`-ot újraszámolja | anon |
| `votes_by_device(device_id)` | mire szavazott már ez a készülék | anon |
| `vote_standings()`, `vote_totals()` | hiteles állás a naplóból | anon |
| `recount_votes()` | a gyorsítótár helyreállítása | csak service_role |
| `toggle_reel_like(reel_id, device_id)` | kedvelés be/ki | anon |
| `reel_likes_by_device(device_id)` | mit kedvelt | anon |
| `register_visit(device_id)` | megnyitás- és készülékszámláló | anon |
| `app_counters()` | a két szám kiolvasása | anon |
| `post_stand_hir(exhibitor_id, pin, szoveg)` | stand üzenete | PIN-nel vagy admin kóddal |
| `post_szervezo_hir(kod, szoveg, szerzo)` | admin üzenete | admin kóddal |
| `edit_stand_hir(id, pin, szoveg)` | javítás | saját, vagy admin bármit |
| `delete_stand_hir(id, pin)` | levétel | saját, vagy admin bármit |
| `login_exhibitor(pin)` | a kódra ad vissza egy standot | anon |
| `pin_jegyzek(kod)` | a teljes PIN-lista | admin kóddal |
| `set_exhibitor_pin(id, kod, uj)` | PIN átírása | admin kóddal |

Mindegyik `security definer`, `set search_path = public`, és a jogokat
**a `public` szereptől kell megvonni**, nem csak az `anon`-tól: a PostgreSQL
minden új funkcióra alapból a `public`-nak ad `EXECUTE` jogot, és az `anon`
annak tagja. Ez egyszer már látszólagos tiltást eredményezett — a
`increment_item_votes` hónapokig hívható volt a böngészőből, pedig „meg volt
vonva".

Az SQL-fájlok újrafuttathatók (`create or replace`, `if not exists`,
`drop policy if exists`). Új migrációt is így írj: a helyszínen senki nem
fog kitalálni, lefutott-e már.

---

## 5. Jogosultsági modell

**Amit az anon kulcs olvashat:** az `exhibitors` minden oszlopa a `pin`
KIVÉTELÉVEL, a `menu_items`, `events`, `reels`, `stand_hirek`, `app_stats`.
A naplókat (`item_votes`, `reel_likes`) nem.

**Amit írhat:** a profil- és ételmezőket (a standos felület ezeket mentí),
reelt szúrhat be, Storage-ba a `feltoltes/` alá tölthet. A `pin` oszlopot
nem írhatja, és a naplókat sem.

**Ami csak függvényen megy:** szavazás, kedvelés, látogatásszámláló,
infótábla, belépés, PIN-jegyzék, PIN-átírás.

**A `0169` admin kód a kliensoldali kódban van**, tehát a letöltött JS-ből
kiolvasható. A véletlen hozzáférést zárja, a szándékos keresőt nem. A
rendezvény két napjára ez tudatos döntés. Amit viszont NEM szabad: minden
látogató telefonjára automatikusan odaadni a PIN-eket — ez történt, amíg az
app `select('*')`-ot kért, és amíg a `pillanatkep.mjs` is kiírta őket a
nyilvános JSON-ba.

A belépés egyetlen bejárata a fejléc VisitKőszeg logójának **5 másodperces
lenyomása**. PIN-t a belépő oldalon soha nem jelenítünk meg.

---

## 6. A kliens felépítése

### Útvonalválasztás

Nincs router. Két állapot dönt el mindent, és mindkettő a contextben van:

```
activeView:  'visitor' | 'exhibitor' | 'login' | 'map' | 'reels' | 'signage'
mainTab:     'food' | 'tents' | 'program' | 'info'      (csak visitor alatt)
```

**Az app a `food` fülön nyílik** (`mainTab` alapértéke). Ez megtévesztő, ha
új blokkot teszel a „főlapra": az időjárás-kártya egy napig a `tents` fül
alatt volt, és a látogatók többsége soha nem látta. Ha minden fülön kell
látszania, a fülválasztó ELÉ tedd, a címsor köré.

A `?view=signage` URL-paraméter a standra kitett kijelzőt nyitja
(`SignageView`), ezt az `App.jsx` kezeli.

### A context

`src/context/OrsolyaContext.jsx` (1657 sor) — **minden** adat és művelet
egy helyen. A kiadott felület csoportosítva:

- **nézet:** `activeView`, `setActiveView`, `mainTab`, `setMainTab`,
  `navigateToFoodCatalog`, `navigateToStandFeed`, `navigateToStand`,
  `openReels`, `reelStartId`
- **adat:** `exhibitors`, `menuItems`, `events`, `reels`, `standHirek`,
  `isLoadingData`, `mentettAdat` (vészüzem jelzése)
- **belépés:** `loginExhibitor`, `loginAsExhibitor`, `logoutExhibitor`,
  `activeExhibitor`, `isSuperAdmin`, `pinJegyzek`, `loadPinJegyzek`,
  `updateExhibitorPin`
- **standos műveletek:** `saveMenuItem`, `deleteMenuItem`,
  `updateItemStatus`, `updateItemStock`, `toggleItemHiddenStatus`,
  `updateExhibitorProfile`, `updateExhibitorDrinks`, `addExhibitorTeam`,
  `uploadImage`
- **infótábla:** `postStandHir`, `postSzervezoHir`, `editStandHir`,
  `deleteStandHir`, `infoOlvasva`, `infotablaOlvasott`
- **közönség:** `voteForItem`, `votedItemIds`, `isVotingOpen`, `likeReel`,
  `likedReelIds`, `postReel`, `visitStats`
- **kedvencek, szűrők:** `favoriteExhibitorIds`, `favoriteItemIds`,
  `toggleFavorite*`, `selectedDay`, `selectedDietary`, `searchQuery`
- **visszajelzés:** `showToast`, `toastMessage`

Új művelet is ide jön. Ne hívj `supabase`-t komponensből: a realtime
összefésülés, a vészüzemi tartalék és a kép-URL kezelés mind itt van, és
komponensben megkerülve mindhárom elromlik.

### Realtime

Egy csatorna, négy tábla: `exhibitors`, `menu_items`, `reels`,
`stand_hirek`, plus `app_stats`. Mindhárom eseményt kezelni kell:
**INSERT, UPDATE, DELETE.** Az infótábla javítása UPDATE — amíg csak
beszúrást és törlést kezeltünk, a javított szöveg a többi telefonon nem
változott.

### Vészüzem és a buildből szolgált képek

```
KEPEK_A_BUILDBOL = true     // OrsolyaContext.jsx teteje
```

- `public/pillanatkep.json` — az egész adat (131 kB)
- `public/mentett-kepek/` — 227 kép (7,3 MB), a Storage-ból letöltve
- `public/mentett-kepek.json` — a jegyzék, ebből tudja a kliens, van-e
  helyi másolat

**Normál működésben is a helyi másolatot szolgáljuk ki**, hogy a Supabase
havi 5 GB-os forgalmi kerete ne fogyjon el (a Netlify 100 GB-ot ad). Ha a
Supabase nem válaszol, az app a `pillanatkep.json`-ból dolgozik, és egy
sárga sáv megmondja a látogatónak, hogy a szavazás addig nem megy.

Ennek két következménye van, és mindkettőbe beléptünk már:

1. **Képcsere után futtasd a `pillanatkep.mjs`-t.** A kép címe nem változik
   cserénél, tehát a régi helyi másolat maradna. A szkript ma már a tárhelyi
   időpontot veti össze a fájl dátumával, és magától letölti az elavultat.
2. **A megjelenített kép-útvonalat nem szabad visszaírni az adatbázisba.**
   A standos felület a form állapotát menti, abban pedig a
   `/mentett-kepek/...` útvonal van. Erre van a `tarhelyUrl()` a
   contextben: minden `image` mentés előtt visszaalakít Storage-címmé.
   Nélküle a Supabase-cím elveszett — a Kovács Miklós logónál pontosan ez
   történt, és csak az `ellenorzes.mjs` szúrta ki, mert az app a helyi
   másolattal továbbra is mutatta a képet.

---

## 7. Komponens-térkép

**Látogatói felület**

| fájl | mit csinál |
|---|---|
| `App.jsx` | útvonalválasztás, a látogatói lap összerakása |
| `Header.jsx` | fejléc, kereső, fülek, az alsó sáv és a modálok beszúrása |
| `MobileBottomNav.jsx` | öt gomb; középen kiemelve az Ételek |
| `FoodCatalogView.jsx` | **a fő felület**: katalógus, keresés, szűrők |
| `MenuItemCard.jsx` | egy étel kártyája, szavazógombbal |
| `CompactExhibitorCard.jsx` | a standlista kártyája |
| `ExhibitorDetailModal.jsx` | stand részletei |
| `DishLocationModal.jsx` | „Hol találom?" kis térkép |
| `MapView.jsx` | Leaflet térkép, stand-pinek, kézműves vásár területe |
| `EventProgramBook.jsx` | programfüzet az `events` táblából |
| `InfoTabla.jsx` | infótábla (olvasás) |
| `LiveReelBar.jsx` | fotósáv + feltöltő ablak |
| `ReelsGallery.jsx` | teljes képernyős fotófolyam (Insta-érzet) |
| `IdojarasKartya.jsx` | kőszegi időjárás, Open-Meteo |
| `FavoritesModal.jsx`, `OrsolyaInfoModal.jsx`, `HamburgerMenuDrawer.jsx` | |
| `TelepitesSav.jsx` | „tedd ki a főképernyőre" |
| `SignageView.jsx` | a standra kitett kijelző (`?view=signage`) |

**Standos és admin felület**

| fájl | mit csinál |
|---|---|
| `ExhibitorAuthPage.jsx` | PIN-beíró; admin kóddal a PIN-jegyzék |
| `ExhibitorAdmin/ExhibitorDashboard.jsx` | a stand kezelője (1127 sor) |
| `ExhibitorAdmin/InfoTablaIro.jsx` | írólap az infótáblához, stand és admin módban |
| `ExhibitorAdmin/SzavazasPanel.jsx` | hiteles szavazásállás a naplóból |
| `ExhibitorAdmin/KoordinataFelvetel.jsx` | térkép-pin bemérése a telefon GPS-éből, a helyszínen |

**Segédek**

`lib/supabaseClient.js`, `lib/eszkoz.js` (készülékazonosító),
`lib/bezaras.js` (háttérre kattintás), `lib/infotabla.js` (olvasottság),
`lib/idojaras.js`, `hooks/useScrollLock.js`, `data/helyszinek.js` (19 bemért
pont), `data/napok.js`.

**Halott kód — ne dolgozz bele:**

- `data/orsolyaGastroCatalog.js` (182 sor) — egyetlen modul sem importálja
- `components/ExhibitorCard.jsx` (67 sor) — a standlista a
  `CompactExhibitorCard`-ot használja. Emiatt az `exhibitors.notice`
  hónapokig sehol nem jelent meg: a standos beírta, mentette, és csak ebben
  a nem használt komponensben lett volna látható.
- `components/ReelsGalleryPage.jsx` — 0 bájt

Ha olyan mezőt keresel, ami „látszania kellene", **előbb nézd meg, hogy a
kiíró komponenst rendereljük-e egyáltalán.**

---

## 8. Konvenciók

**Nyelv.** A felület és a kommentek magyarul, ékezetesen. A commit-üzenetek
angolul, és azt mondják el, MIÉRT — a mit a diff is megmutatja. A kódban a
régi, angol azonosítók megmaradnak (`menuItems`, `exhibitors`), az újak
magyarul vannak (`standHirek`, `belepesiKod`) — ez nem szép, de a felénél
nevet váltani rosszabb lett volna.

**Minden szöveges mezőt opcionális láncolással olvass:**
`item.name?.toLowerCase?.()`. A `description` nullable, és a legtöbb ételnek
nincs leírása; egy nyers `.toLowerCase()` a keresőben az első leütött
karakternél elhasalt, és magával vitte az egész nézetet.

**Tailwind.** Csak létező árnyalat (`50`, `100`…`950`). A `text-amber-5` és a
`bg-stone-150` nem generál CSS-t, hibát sem jelez — csak nem működik, és egy
olvashatatlan fejlécet okozott. Töréspont: a Tailwind legkisebbje az `sm`
(640px), ami telefonon már mindent elrejt; ha ennél kisebb kell, `@theme`-be
kell töréspontot felvenni (és ne hagyd ott, ha nem használod).

**Modálok.** Minden `fixed inset-0` réteg:
- hívja a `useScrollLock`-ot a korai `return null` **előtt**, különben
  feltételes hook lesz (a zárolás számlálóval működik, mert két réteg
  egymásra nyílhat),
- kapja meg a `hatterBezaras(onClose)`-t a háttér divre — kivéve ahol a
  felhasználó beír vagy képet választ, mert ott egy félrekoppintás eldobná a
  munkáját,
- az X-je legalább ~40 px koppintási célpont legyen (`p-2.5`), és az ikont
  ne takarja absolute elem `pointer-events-none` nélkül.

**Ikonok:** `lucide-react`, ami már függőség. **Új npm csomagot ne vegyél
fel**, különösen ne platformspecifikus binárist: a Netlify linux-x64-en
épít, és egy `@rolldown/binding-darwin-arm64` a `dependencies`-ben
`EBADPLATFORM`-mal megállítja a telepítést, tehát a **deploy el sem jut az
építésig**. Ez három napig észrevétlen maradt, mert a Supabase-adat közben
látszódott, csak a kódváltozások nem. Ellenőrzés, ahogy a Netlify látja:

```bash
npm ci --dry-run --os=linux --cpu=x64
```

**Harmadik féltől jövő adat** (időjárás, bármi): `AbortController`
időkorláttal, `try/catch`-ben, és ha nincs adat, a blokk NE jelenjen meg.
Kitalált értéket nem írunk ki. Gyorsítótár a `sessionStorage`-ban, mert egy
forgalmas napon ezer telefon nyitja az appot.

---

## 9. Hogyan adj hozzá egy funkciót

A legutóbbi (infótábla) végig így épült, és ez a sorrend bevált:

1. **Mit tart be az adatbázis?** Ha írásról van szó, tábla + `security
   definer` függvény + grantok egy új `supabase-<nev>.sql`-be,
   újrafuttathatóan. A kliens ne tudja megkerülni.
2. **A kliens mindig legyen tűrő a hiányzó függvényre.** Az SQL-t ember
   futtatja, és nem feltétlenül a kód kirakása előtt. Ha a tábla vagy a
   függvény még nincs meg, legyen `console.warn` és üres állapot, ne fehér
   képernyő. Ahol belépés vagy adatbetöltés a tét, legyen tartalék út a
   régi viselkedésre.
3. **Context:** állapot, betöltés a kezdeti `fetch`-be, realtime ág
   (INSERT/UPDATE/DELETE), művelet-függvények, és a `value`-ba felvenni.
4. **Komponens**, a fenti konvenciókkal.
5. **Elérhetőség:** ha új felület, kell neki bejárat — alsó sáv, fejléc-fül,
   hamburger menü. Egy funkció, amire nem vezet gomb, nem létezik: a Reels
   feedet napokig nem lehetett megnyitni, mert semmi nem állította be az
   `activeView`-t.
6. **Doksi:** `CLAUDE.md` (ha szabály lett belőle), `HELYSZINEN.md` (ha a
   helyszínen kell tudni), `STANDOS_KEZIKONYV.txt` (ha a standosnak), és
   utána `node scripts/kezikonyvek.mjs`, különben a kiosztott példányok a
   régi szöveget tartalmazzák.
7. **`npm run build` és `npm run lint`.** A build átmehet úgy is, hogy az
   oldal fehér marad: egy hiányzó import (`useRef is not defined`) futásidejű
   hiba, a fordító nem szól. **Nyisd meg a kirakott oldalt**, és nézd meg,
   hogy a változás látszik-e.
8. **Commit és push.** Adatváltozáshoz nem kell push, kódváltozáshoz igen.

### Új adatoszlop felvétele

A `pin` elrejtése óta az `exhibitors` betöltése FELSOROLT oszlopokat kér.
Új oszlopot **két helyen** kell felvenni, különben az app nem látja:

- `EXHIBITOR_OSZLOPOK` az `OrsolyaContext.jsx` tetején
- `EXHIBITOR_OSZLOPOK` a `scripts/pillanatkep.mjs`-ben

A `pin` egyikbe sem kerülhet vissza. A pillanatkép ezt ellenőrzi is, és
megáll, ha mégis ott van.

---

## 10. A szkriptek

Mind `node scripts/<nev>.mjs`, mind a repó gyökeréből fut, mind a `.env`-ből
olvas, és **mindnek van `--proba` kapcsolója** (az `ellenorzes` és a
`pin-lista` kivételével, azok nem írnak).

| szkript | mit tesz |
|---|---|
| `ellenorzes.mjs` | állapot: mi hiányzik. **Minden adatmódosítás után.** |
| `mi-kell-meg.mjs` | melyik ételhez kell fotó, milyen néven |
| `stand-felvetel.mjs` | új stand ételekkel, PIN-nel, térkép-pinnel |
| `etel-felvetel.mjs` | új étel meglévő standhoz |
| `kepek-feltoltese.mjs` | ételfotók, logók, köteg, `--mind` |
| `koordinatak.mjs` | bemért GPS-pontok beírása |
| `becsult-elhelyezes.mjs` | a becsült pinek egyenletes szétosztása |
| `stand-leirasok.mjs`, `program-leirasok.mjs` | szövegek a szervezőtől |
| `versenyetelek.mjs` | a nevezett ételek megjelölése, átnevezése |
| `szavazatok.mjs` | hiteles állás a naplóból, `--ujraszamol` |
| `pin-lista.mjs` | PIN-lista fájlba (sosem a kimenetre) |
| `kezikonyvek.mjs` | standonkénti útmutató, PIN-nel kitöltve |
| `pillanatkep.mjs` | vészüzemi mentés + a buildből szolgált képek |

### `scripts/lib.mjs` — amit használni kell

```js
env()                       // .env beolvasás, hibával ha hiányzik a kulcs
api(e).select(tabla, query) // PostgREST GET
api(e).patch(tabla, id, {}) // egy sor módosítása — HIBÁT DOB, ha nem talált
api(e).insert(tabla, sorok)
api(e).upload(bucket, nev, buf)  // → publikus URL
api(e).listBucket(bucket)   // Map(fájlnév → updated_at)
norm(s)                     // ékezet- és kisbetű-tűrő összehasonlításhoz
matchFiles(files, items)    // fájlnév → tétel párosítás, bizonytalanra nem tippel
compress(glob, outDir, FOOD|LOGO)
isRealGps(coords)           // bemért vagy becsült
freeEstimatedSpot(existing) // szabad becsült hely a sétány mentén
guessCategory(nev)
newPin(meglevok)
```

**A `patch` hibát dob, ha nulla sort talált**, és ennek oka van: a PostgREST
a nulla találatra is sikerrel válaszol, tehát egy elírt azonosítóra a
szkript boldogan kiírta, hogy „kész". Három módosítás veszett el így némán
— két ételleírás, egy kínálat-szöveg és egy elírás javítása —, és csak egy
véletlen visszaolvasáskor derült ki.

### Ha új szkriptet írsz

- a `lib.mjs`-ből dolgozz, ne írj saját konvenciót (ez kétszer kiderült)
- `--proba` ELŐBB, és a próba **tényleg ne írjon semmit**: a
  `kepek-feltoltese.mjs` ételfotós ága hónapokig úgy „próbált", hogy közben
  feltöltött
- éles adaton ne teszteld, és ha mégis muszáj, dobható mappán
- PIN-t fájlba írj, soha a kimenetre
- `process.exit` helyett `process.exitCode` + szabályos visszatérés:
  Windowson az előbbi libuv-hibát dob, ha hálózati kérés még nyitva van

---

## 11. Tesztelés

Nincs automata teszt, és a rendezvény előtt nem is lesz. Ami van:

```bash
npm run build        # fordul-e, és mekkora a dist
npm run lint         # oxlint
node scripts/ellenorzes.mjs   # hiányzó kép, PIN, koordináta, üres stand
```

Amit a gép nem mond meg, azt **kézzel kell végignézni**, és a legutóbbi
hibák pont ezek voltak:

- megnyílik-e a kirakott oldal (a fehér képernyő a build után is lehet)
- látszik-e a változás ott, ahol a látogató jár — **az app az Ételek fülön
  nyílik**, nem a standlistán
- telefonon is jó-e, nem csak gépen (a PIN mezőbe gépen nem lehetett
  beírni, mert egy ikon lógott fölötte)
- a jogosultság tényleg zár-e: éles anon kulccsal próbáld ki, hogy a
  tiltott kérés elutasít. Egy ilyen körrel derült ki, hogy a `select('*')`
  minden látogatónak odaadta a PIN-eket.

Jogosultság-ellenőrzés anon kulccsal, a `.env`-ből:

```bash
curl -s -H "apikey: $ANON" "$URL/rest/v1/exhibitors?select=pin&limit=1"
# permission denied for table exhibitors  ← ennek kell jönnie
```

---

## 12. Kirakás

**Adatváltozáshoz nem kell push.** A standok, ételek, képek, programok az
adatbázisból jönnek; amint a szkript lefutott, a telefonokon is ott van.

**Kódváltozáshoz** `git push origin main`, a Netlify magától épít. A deploy
~1-2 perc. Ellenőrizd, hogy az új bundle tényleg kiment:

```bash
js=$(curl -s https://orsolya.netlify.app/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js' | head -1)
curl -s "https://orsolya.netlify.app/$js" | grep -c "<egy új szövegrész>"
```

**Sorrend, ha séma is változik:** előbb a kód, utána az SQL. A régi kód + új
séma kombináció vészüzembe küldi az appot (ez megtörtént: a `select('*')`
`permission denied`-et kapott, és a látogatók a mentett adatot látták).

---

## 13. Amibe már belefutottunk

Ez a lap leghasznosabb része. Mindegyik megtörtént, és mindegyik időbe
került.

| Mi történt | Mi volt az ok | Mi lett a szabály |
|---|---|---|
| A deploy három napig nem ment ki | `@rolldown/binding-darwin-arm64` a `dependencies`-ben, `EBADPLATFORM` linuxon | platformspecifikus bináris sosem kerül be; `npm ci --dry-run --os=linux --cpu=x64` |
| 36 MB PNG ment ki a felhasználóknak | kép a `public/` mappában | kép csak Storage-ba; kivétel a dokumentált `mentett-kepek/` |
| A standos nem tudott ételt szerkeszteni | a payload `price`-t tartalmazott, `PGRST204` | árat sehol nem használunk |
| Minden látogató letöltötte mind a 38 PIN-t | `select('*')` + oszlopszintű jog | felsorolt oszlopok, `login_exhibitor`, `pin_jegyzek` |
| A PIN-ek a nyilvános JSON-ban is kimentek | `pillanatkep.mjs` `select=*` service_role kulccsal | felsorolt oszlopok + ellenőrzés a kiírás előtt |
| Ötből négy egyidejű szavazat elveszett | a kliens abszolút `votes` értéket írt | csak `vote_for_item`, a napló az igazság |
| A tiltás nem tiltott | a `public` szerepnek maradt `EXECUTE` joga | `revoke … from public`, nem csak `anon`-tól |
| Az élő üzenet sehol nem jelent meg | a kiíró komponens halott kód volt | előbb nézd meg, renderelődik-e a komponens |
| A javított üzenet nem változott a többi telefonon | a realtime ág csak INSERT/DELETE-et kezelt | mindhárom eseményt kezelni kell |
| Az új blokk nem látszott a főlapon | az app a `food` fülön nyílik, a blokk a `tents` alatt volt | tudd, hol landol a látogató |
| A próba feltöltött | a `--proba` az ételfotós ágban nem volt kiolvasva | a próba egy helyen dől el, és tényleg nem ír |
| Három módosítás némán elveszett | `patch` elírt azonosítóval, a PostgREST 204-et ad | a `patch` visszaolvas, és hibát dob |
| Egy logó URL-je helyi útvonalra cserélődött | a form a megjelenített útvonalat mentette | `tarhelyUrl()` minden `image` mentés előtt |
| Az oldal elfehéredett éles üzemben | `useRef` import nélkül — futásidejű hiba, a build átmegy | a kirakott oldalt meg kell nyitni |
| A katalógus minden szavazásnál átrendeződött | a véletlen sorrend minden `menuItems` változásra újraszámolt | a véletlen szám egyszer dől el tételenként |
| A TOP 5 öt ételt mutatott nulla szavazattal | nem volt szűrés | `votes > 0` |
| Egy sütemény fotója a „Tea" mellé került | a hasonlóság rövid neveknél hízelgett | 3 karakter minimum, szűrés rangsor előtt |
| A tömörítés nem talált fájlt | a glob a visszaperjelet escape-nek veszi | előre perjel, idézőjel, közös kép-glob |
| A mérőállomás adata nem jött meg | nem küld CORS-fejlécet, és nincs hova proxyt tenni | böngészőből hívható forrást keress |
| A PIN mezőbe gépen nem lehetett írni | absolute ikon lógott fölötte | `pointer-events-none`, `htmlFor`, fókusz a sorra |

---

## 14. Ami nyitott

- **31 stand térkép-pinje becsült.** A `KOORDINATAK_ELLENORIZENDO.txt`
  listázza őket, és a tizedesjegyek száma alapján magától frissül. A
  helyszínen a `KoordinataFelvetel` felület méri be őket a telefon GPS-éből
  (admin kóddal), a `koordinatak.mjs` pedig a tartalék út szövegfájlból.
- **Az `ExhibitorDashboard.jsx` 8 hook-figyelmeztetést ad.** Meglévő dolog:
  egy `if (!activeExhibitor) return null;` áll az összes `useState` előtt.
  Nem egysoros javítás, mert a `profileData` kezdőértéke
  `activeExhibitor.story`-t olvas. A rendezvény után.
- **A `supabase-schema.sql` elavult.** Oszlopot ne abból következtess.
- **A Fitt-Box Egyesületnek nincs étele** felvéve, így a katalógusban nem
  jelenik meg. Hiányzó étlap, nem hiba.
- **Nincs automata teszt.** A legkisebb értelmes első lépés a
  `scripts/lib.mjs` tiszta függvényeire írni párat (`norm`, `matchFiles`,
  `isRealGps`, `guessCategory`): ezek döntik el, melyik fotó melyik ételhez
  kerül, és egy elrontott párosítás allergénes tétel mellé tehet rossz
  képet.
