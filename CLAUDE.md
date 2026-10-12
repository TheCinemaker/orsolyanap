# Orsolya-napi Vásár — látogatói app

Kőszeg, 2026. október 17–18. A **Civil Ízek Utcája** (Diáksétány) standjait,
ételeit, térképét és programját mutatja a látogatóknak.

Ha standot vagy képet kell felvenni, **ne írj saját megoldást** — használd a
`scripts/` alatti szkripteket. A konvenciók ott kódban vannak, nem itt
leírásban, pont azért, mert kétszer is kiderült, hogy újraértelmezve más
eredmény születik.

---

## A legfontosabb szabályok

**Az élő adat a Supabase-ben van.** Az `src/data/orsolyaGastroCatalog.js`
fájlt **az app nem használja** — ellenőrizve: egyetlen modul sem importálja,
és a buildből teljesen kimarad. Aki abba dolgozik, a semmibe dolgozik.
A stand- és ételadat az `exhibitors` és a `menu_items` táblában él.

**Árat SEHOL nem használunk.** A vásáron jogilag nem értékesítés folyik,
hanem adománygyűjtés: amit a vendég fizet, az adomány. A `menu_items`
táblában **nincs `price` oszlop**. Ha a mentés payloadja mégis tartalmazza,
a Supabase `PGRST204`-cel az *egész* kérést elutasítja, és a standos nem tud
ételt szerkeszteni. Ez egyszer már megtörtént.

**Kép SOHA nem kerül a `public/` mappába.** A Vite onnan változtatás nélkül
átmásol mindent a `dist/`-be, és a deploy kiszállítja. Egyszer 36 MB PNG
ment ki így. A képek helye a Supabase Storage; az adatbázisba csak a
publikus URL kerül.

**A képeket tömöríteni kell.** Ételfotó 600×338 WebP (16:9, középre vágva),
logó 400px széles WebP. Így egy kép 30–60 kB. Tömörítés nélkül 2,5–3 MB
darabonként, ami egy zsúfolt fesztiválhálózaton használhatatlan.

**Platformspecifikus bináris nem kerülhet a `dependencies`-be.** A Netlify
linux-x64-en épít. Ha egy `@rolldown/binding-darwin-arm64`, `*-win32-*` vagy
hasonló csomag bekerül a `package.json`-ba, az npm ott `EBADPLATFORM`-mal eláll,
és a **deploy el sem jut az építésig**. Ez egyszer már megtörtént, és három napig
a régi oldal ment ki — nem tűnt fel, mert a Supabase-adat (új standok, képek,
leírások) közben látszódott, csak a kódváltozások nem.

A natív binárist **soha ne tedd be kézzel**: a vite és a rolldown mind a 15
platformváltozatot opcionális függőségként hirdeti, minden gép a sajátját veszi.
Ha hiányzik, a megoldás a `node_modules` törlése és `npm install`, nem egy új sor
a `package.json`-ban. Ellenőrzés, ahogy a Netlify látja:

```bash
npm ci --dry-run --os=linux --cpu=x64
```

**PIN kódot ne írj a kimenetre.** Éles belépési adatok: naplóba,
képernyőképbe és beszélgetés-előzménybe nem kerülhetnek. A
`scripts/pin-lista.mjs` fájlba írja őket.

---

## Szkriptek

Mindhez kell egy `.env` a repó gyökerében (gitignore-olt, **új gépen létre
kell hozni** a `.env.example` alapján). A `SUPABASE_SERVICE_ROLE_KEY`
kötelező: az anon kulcs nem tud Storage-ba írni.

```bash
node scripts/ellenorzes.mjs               # állapot: mi hiányzik még
node scripts/stand-felvetel.mjs uj.json   # új stand ételekkel, PIN-nel, pinnel
node scripts/kepek-feltoltese.mjs "Stand" # a stand ételfotói
node scripts/kepek-feltoltese.mjs --mind  # minden stand új fotói
node scripts/kepek-feltoltese.mjs --logok # logók a logok/ mappából
node scripts/koordinatak.mjs pontok.txt   # bemért stand-koordináták beírása
node scripts/program-leirasok.mjs x.json  # programleírások a szervező szövegéből
node scripts/stand-leirasok.mjs x.json    # standok bemutatkozó szövege
node scripts/szavazatok.mjs               # szavazás valódi állása a naplóból
node scripts/pin-lista.mjs                # PIN-lista és koordináta-állapot
```

Minden adatmódosítás után futtasd az `ellenorzes.mjs`-t.

### Új stand

A szervezőktől érkező szöveget alakítsd ilyen JSON-ná:

```json
{
  "nev": "Jimmy Gym",
  "etelek": [
    "Harcsa paprikás túrós csuszával",
    "Frissen sült lángos",
    { "nev": "Tea", "kategoria": "italok" }
  ],
  "gps": [47.38992583549108, 16.539408011205357],
  "helyszin": "Diáksétány",
  "mottó": "Várunk mindenkit szeretettel!",
  "uzenet": "Szombaton 17:00-kor zenélünk a vár udvarán!"
}
```

Csak a `nev` és az `etelek` kötelező. GPS nélkül a szkript becsült helyet ad
a sétány mentén, és figyelmeztet, hogy a helyszínen pontosítani kell.

Kategóriák: `meleg_etel`, `street_food`, `sutemeny`, `italok`, `egyeb`.
A szkript tippel a név alapján — **ellenőrizd a kiírt listát**, mert ez
dönti el, melyik katalógus-szekcióba kerül az étel.

### Koordináták

A helyszíni körön mért pontokat ne kézzel írd be. Egy szövegfájlba jönnek,
soronként egy stand, akármilyen formában:

```
Hajnalcsillag: 47.38919270798614, 16.539153584867744
KTSZE stand 47.38986871225532, 16.539555530929338
```

```bash
node scripts/koordinatak.mjs pontok.txt --proba   # elobb mutasd meg
node scripts/koordinatak.mjs pontok.txt           # aztan irja be
```

A szkript négy dolgot utasít el, mert mind a négy rossz sátorhoz vinné a
látogatót: kétértelmű standnév, Kőszegen kívüli pont (ez fogja meg a
felcserélt szélesség/hosszúságot), hat tizedesjegynél pontatlanabb szám
(csonkult beillesztés), és ugyanannak a pontnak a kétszeri megadása.

### Képek

```
etelfotok/<stand neve>/<étel neve>.png     ételfotók
logok/<bármi, amiben a stand neve szerepel>.png
```

A mappák standonként külön vannak, mert az ételnevek ismétlődnek: a „Házi
sütemények" kilenc standnál szerepel. Puszta fájlnévből nem lehetne
eldönteni, melyikhez tartozik.

A párosítás elnézi az ékezetet, a kis/nagybetűt és az elírást
(`hentesmesetr.png` → „Hentesmester káposztája"). **Ami bizonytalan, azt a
szkript nem tölti fel**, hanem kiírja. Ilyenkor kérdezd meg a felhasználót,
ne tippelj — egy allergénes tétel mellé rossz képet tenni rosszabb, mint kép
nélkül hagyni.

Már feltöltött képet nem ír felül. Szándékos csere: `FORCE=1`.

Ahol tippelni nem szabad, ott `parositas.json` kerül a képek mappájába:

```json
{ "NOE.png": "Nagycsaládosok Országos Egyesületének Kőszeg és Kőszeghegyalja Szervezete" }
{ "italok.png": ["Kávé", "Tea", "Üdítő"] }
```

Két eset van rá: **rövidítés**, amit semmilyen hasonlóság nem köt a teljes
névhez (`NOE.png`), és **egy kép több tételhez** (egy italos fotó a kávéhoz,
teához, üdítőhöz). Amit itt megadsz, az pontos egyezés, a szkript nem bírálja
felül.

### Programok

A füzér a Supabase `events` táblájából jön. A szervező szövegéből csak a
**leírás** frissül; az időpontot, a helyszínt és a címet nem bántjuk, mert egy
elcsúszott kezdés rosszabb, mint egy hiányzó leírás.

A szervezői szöveg gyakran **nekünk szóló megjegyzést** is tartalmaz („a pontos
műfajt a szervezővel ellenőrizni kell"). Az ilyen mondat NEM mehet az appba: a
látogató értelmetlennek látja. Csak az igazolt, neki szóló rész kerül be, a
többi marad rövid.

---

## Felépítés

React 19 + Vite + Tailwind 4, Supabase (adat + Storage), Netlify (statikus
hosting, nincs szerveroldali kód).

```
src/App.jsx              útvonalválasztás: ?view=signage vagy a látogatói app
src/context/OrsolyaContext.jsx   minden adat és művelet egy helyen
src/components/
  FoodCatalogView.jsx    gasztro-katalógus, keresés, szűrők  (a fő felület)
  MapView.jsx            Leaflet térkép, stand-pinek, kézműves vásár területe
  EventProgramBook.jsx   programfüzet az events táblából
  SignageView.jsx        a standra kitett kijelző  (?view=signage)
  ExhibitorAdmin/        standosok felülete
scripts/                 adatkezelő szkriptek (lásd fent)
src/data/helyszinek.js   színpadok, mosdók, parkolók — a fix infrastruktúra
supabase-*.sql           séma- és migrációs szkriptek
```

### Amit tudni kell a kódról

**Keresés.** Egy kereső van, a fejlécben, azonnali találati listával. A
`FoodCatalogView` szűrőlogikája ehhez tartozik — ha a mezőt kiszedi valaki,
a logikát **hagyja meg**, különben a fejlécből nem szűr semmi. Ez egyszer
már megtörtént és visszavonásra szorult.

**Minden szöveges mezőt opcionális láncolással olvass** (`item.name?.toLowerCase?.()`).
A `description` nullable, és a legtöbb ételnek nincs leírása — egy nyers
`.toLowerCase()` az első leütött karakternél elhasalt és magával vitte az
egész nézetet.

**Szavazás.** Egy készülék egy ételre egyszer. Mindent a
`vote_for_item(p_item_id, p_device_id)` függvény végez: naplóba ír
(`item_votes`), és az adatbázis zárja ki a második szavazatot — nem a kliens
jóindulata. A készülékazonosító a `src/lib/eszkoz.js`-ben készül.

Soha ne írj abszolút `votes` értéket és ne készíts tartalék útvonalat a
függvény megkerülésére: két egyidejű szavazat felülírná egymást (mérve: ötből
négy elveszett), és a készülékenkénti korlát is kiesne. A régi
`increment_item_votes` már nem hívható a böngészőből, pont ezért.

A `menu_items.votes` oszlop csak **gyorsítótár** a naplón. Ha elcsúszik, a
`recount_votes()` (csak service_role) visszaállítja a valódi állást.

**Modálok.** Minden `fixed inset-0` réteg hívja a `useScrollLock`-ot, a
komponens korai `return null`-ja **előtt**, különben feltételes hook lesz.
A zárolás számlálóval működik, mert két réteg egymásra nyílhat.

**Térképfeliratok.** Hosszú standnévhez rövid formát kell adni a
`getShortExhibitorName`-ben, különben a teljes név kerül a pinre és
egymásra csúsznak. A tesztek sorrendje számít: a specifikusabb elöl
(`szakiskola` a `egymi` előtt).

**AI-jelölés.** Az ételfotók generált illusztrációk. Ezt négy helyen kiírjuk
(kártyákon sarokfelirat, kijelzőn lábléc, infó-modálban bekezdés). Ne vedd
ki: jelölés nélkül a fotó ígéretnek látszik.

**Tailwind árnyalatok.** Csak létező érték (`50`, `100`…`950`). A
`text-amber-5` és a `bg-stone-150` nem generál CSS-t, hibát sem jelez —
csak nem működik. Ez egy olvashatatlan fejlécet okozott.

### Belépés a standos felületre

Egyetlen bejárat: a fejléc VisitKőszeg logóját 5 másodpercig lenyomva.
Utána a stand 4 jegyű PIN kódja. A szervezői kód (`0169`) nem egy standba
lép be, hanem megnyitja a csapat- és PIN-jegyzéket, ahonnan bármelyik stand
felülete elérhető.

PIN-t sehol nem jelenítünk meg a belépő oldalon. Korábban kiírta az első
négy stand kódját és volt egy védelem nélküli „jegyzék" gombja, a Reels
feedből pedig egy látható gomb vezetett oda — így bárki beléphetett bármelyik
stand nevében.

A `0169` a kliensoldali kódban van, tehát a letöltött JS-ből kiolvasható. A
véletlen hozzáférést zárja, a szándékos keresőt nem. Két napra ez tudatos
döntés volt.

---

## Helyi futtatás

```bash
npm install
npm run dev            # http://localhost:5173
npx vite --host        # telefonról is elérhető ugyanazon a WiFi-n
npm run build          # a dist ~850 kB; ha hirtelen MB-os, kép került a public/-ba
npm run lint
```

Az `ExhibitorDashboard.jsx` 8 hook-figyelmeztetést ad. **Meglévő dolog**, nem
új hiba: egy `if (!activeExhibitor) return null;` áll az összes `useState`
előtt. Nem egysoros javítás, mert a `profileData` kezdőértéke
`activeExhibitor.story`-t olvas. Ne kezdj bele határidő előtt.

---

## Ami nyitott

- **14 stand térkép-pinje becsült** (21 standból). A helyszíni körön kell
  pontosítani a `koordinatak.mjs`-szel; a `KOORDINATAK_ELLENORIZENDO.txt`
  listázza őket. A fájl a tizedesjegyek száma alapján válogat, tehát
  magától frissül.
- **A helyszíni pontok (színpad, mosdó, parkoló) készen vannak**, a szervező
  mérte be mind a 19-et. Ezek a `src/data/helyszinek.js`-ben vannak és nem az
  adatbázisban, mert a rendezvény fix infrastruktúrája. Újat egy sor felvenni.
- **A Fitt-Box Egyesületnek nincs étele** felvéve, így a katalógusban nem
  jelenik meg. Nem hiba, hanem hiányzó étlap.
- **A standos felület base64-be ír képet**, nem Storage-ba. Ha egy standos
  a saját dashboardján tölt fel fotót, visszahozza a régi problémát.
- **A `supabase-schema.sql` és az élő adatbázis eltér** (pl. nincs `price`,
  nincs `short_name`). Új oszlopot ne a séma-fájlból következtess, hanem
  kérdezd le.
