# A helyszínen — mit hogyan

Ez a lap a vásár két napjára és az azt megelőző péntekre szól. Feltételezi,
hogy egy laptopnál állsz, sátorépítés közben, és valaki épp most szólt, hogy
„ezt még betennéd?".

**A legfontosabb szabály:** minden parancsnak van `--proba` kapcsolója, ami
megmutatja, mit csinálna, de nem ír semmit. Kapkodva, telefonos netről, zajban
ezt használd előbb. Egy rossz adat visszajavítása tízszer annyi idő.

---

## 0. Indulás a gépen (egyszer, otthon vagy induláskor)

```bash
git clone https://github.com/TheCinemaker/orsolyanap.git
cd orsolyanap
npm install
```

Majd **hozd létre a `.env` fájlt** a repó gyökerében:

```
VITE_SUPABASE_URL=https://qceznytdsqdcodgrgoxd.supabase.co
VITE_SUPABASE_ANON_KEY=<a Supabase Project Settings → API → anon public kulcs>
SUPABASE_SERVICE_ROLE_KEY=<ugyanott a service_role kulcs>
```

**A `.env` SOHA nem kerül a gitbe**, és nem is kerülhet: a `service_role`
kulccsal az egész adatbázis írható és törölhető. A repó nyilvános. Vidd át
kézzel — pendrive, jelszókezelő, magadnak küldött üzenet.

Ellenőrzés, hogy minden megvan:

```bash
node scripts/ellenorzes.mjs
```

Ha ez kiírja a standok és ételek számát, készen állsz.

**Ha ez egy másik gép** (például a MacBook a helyszínen), akkor az ott futó
Claude Code **nem tud semmit az otthoni beszélgetésekről**. Amit tudnia kell,
az ebben a két fájlban van, és a repóval együtt megjön:

| Fájl | Mit mond el |
|---|---|
| `CLAUDE.md` | a szabályok és a buktatók: miért nincs ár, miért nem megy kép a `public/`-ba, mi a halott kód |
| `HELYSZINEN.md` | ez a lap: minden parancs, sorrendben |
| `FEJLESZTOI_KEZIKONYV.md` | ha kódot kell írni: adatmodell, jogosultságok, komponensek, buktatók |

A beszélgetés-előzményt nem kell átvinni, és **ne is tedd fel a repóba**: a
repó nyilvános. Ami fontos volt belőle, az ebben a két fájlban van — ha a
helyszínen kiderül valami új, írd bele, ne a beszélgetésbe.

---

## 1. Belépési kódok

```bash
node scripts/pin-lista.mjs
```

Két fájlt ír a gépre: `KIALLITO_PIN_KODOK.txt` (minden stand kódja) és
`KOORDINATAK_ELLENORIZENDO.txt` (melyik térkép-pin becsült még).

Mindkettő gitignore-olt, és ez szándékos: a repó nyilvános, egy kiszivárgott
PIN-nel bárki beléphetne egy stand nevében és átírhatná az étlapját.

Új stand felvétele után **futtasd újra**, különben az ő kódja nem lesz a
listában.

### A standosoknak kiosztandó útmutató

```bash
node scripts/kezikonyvek.mjs              # mind a 38 stand
node scripts/kezikonyvek.mjs "Hajnal"     # csak egy stand
```

A `STANDOS_KEZIKONYV.txt` a nyomtatható alap — abban a stand neve és a PIN
helyén pontozott vonal van, mert a repó nyilvános. Ez a szkript abból készít
személyre szabott példányokat a `kezikonyvek/` mappába (gitignore-olt), a
stand nevével és **csak a saját kódjával** kitöltve. Ezt küldd át a
csapatnak Messengeren: így senki nem kapja meg a teljes PIN-listát.

Ha a kézikönyv szövegén változtatsz, **futtasd újra**, különben a kiosztott
példányok a régi szöveget tartalmazzák.

---

## 2. Jön egy új stand

Készíts egy JSON fájlt — csak a `nev` és az `etelek` kötelező:

```json
{
  "nev": "Valami Egyesület",
  "etelek": [
    "Gulyásleves",
    { "nev": "Tea", "kategoria": "italok" },
    { "nev": "Töltött káposzta", "nap": "sunday" }
  ],
  "gps": [47.38992583549108, 16.539408011205357],
  "napok": "both",
  "uzenet": "Szombaton 17:00-kor zenélünk!"
}
```

```bash
node scripts/stand-felvetel.mjs uj.json
```

Kap egyedi PIN-t, térkép-pint és fotómappát. **A PIN-t nem írja a képernyőre** —
a `pin-lista.mjs` adja meg.

GPS nélkül becsült helyet kap a sétányon, és figyelmeztet rá. Kategóriák:
`meleg_etel`, `street_food`, `sutemeny`, `italok`, `egyeb` — a szkript tippel a
név alapján, **nézd át a kiírt listát**, mert ez dönti el, melyik szekcióba
kerül az étel.

---

## 3. Egy meglévő stand még hoz valamit

Ez a gyakoribb eset a helyszínen.

```bash
echo '["Rakott krumpli", "Véres és májas hurka"]' > uj-etelek.json
node scripts/etel-felvetel.mjs "Cák" uj-etelek.json --proba
node scripts/etel-felvetel.mjs "Cák" uj-etelek.json
```

A standnevet elég részben megadni, de **ha többre illik, megáll és felsorolja
őket** — négy „Kőszegfalvi" és két „Dr. Nagy László EGYMI" van. Ami már bent
van, azt nem veszi fel újra.

Naponként eltérő fogás:

```json
[{ "nev": "Rakott krumpli", "nap": "saturday" },
 { "nev": "Hurka", "nap": "sunday" }]
```

---

## 4. Képek

### Hova

```
etelfotok/<stand neve>/<étel neve>.png     ételfotók
logok/<stand neve>.png                     logók
```

A nagy, eredeti fájlokat nyugodtan ide másold — **a szkript tömöríti őket**
(3 MB-ból ~50 kB lesz), és csak a kicsi változat megy fel. Ezek a mappák
gitignore-oltak, a nagy fájlok sosem kerülnek a buildbe.

### Feltöltés

```bash
node scripts/kepek-feltoltese.mjs --mind              # minden stand
node scripts/kepek-feltoltese.mjs "Jimmy Gym"         # egy stand
node scripts/kepek-feltoltese.mjs --logok             # logók
node scripts/kepek-feltoltese.mjs --logok "logok/uj"  # logók máshonnan
```

Csak azt tölti fel, ami még nincs fent **vagy frissebb a feltöltöttnél**. Egy
második futtatás nem csinál semmit — így néz ki, ha nincs teendő.

### Csere

Tedd be az új képet ugyanazzal a névvel, `_1` végződéssel:
`Babgulyás_1.png`. A régi maradhat. Ha kétszer cseréled, `_2`. A legmagasabb
sorszámú nyer.

**Miért a végződés és nem a puszta felülírás:** a szkript a fájl dátumából
dönti el, hogy újabb-e a feltöltöttnél. Egy letöltött vagy másolt fájl
dátuma gyakran RÉGEBBI, mint a feltöltés ideje — ilyenkor a csere némán
kimarad. A `_1`-gyel ez nem fordulhat elő. Ha mégis muszáj ugyanazzal a
névvel: `FORCE=1 node scripts/kepek-feltoltese.mjs "Stand"`.

**Csere után futtasd a pillanatképet** (7b.). A kép CÍME cserénél nem
változik, és normál működésben is a buildbe mentett másolatot szolgáljuk ki —
ha a pillanatkép nem fut le, a vendég a régi fotót látja, miközben a
Supabase-ben már az új van. A szkript magától észreveszi: a tárhelyi
időpontot összeveti a helyi másolattal, és csak az elavultat tölti le újra
(„1 lecserélt").

### Sok kép egyszerre, egy mappában

Ha a fájlnév az **étel neve**, nem kell standonként szétpakolni:

```bash
node scripts/kepek-feltoltese.mjs --koteg <mappa> --proba
node scripts/kepek-feltoltese.mjs --koteg <mappa>
```

Amelyik nevet több stand is használja, **mindegyik megkapja**. A szkript elnézi
az időbélyeget a fájlnévben, a levágott neveket és az elgépelést is — de amit
nem tud biztosan, azt kiírja és nem tölti fel.

### Amit tudni kell

- **Logónál nincs tippelés.** A fájlnév legyen betűre a stand neve. Ha nem az,
  írd be a `logok/parositas.json`-ba: `{ "noe.png": "Nagycsaládosok Országos…" }`
- **Két logó védett** és nem cserélhető: Kovács Miklós, Kőszeg Város
  Fúvószenekara. A tiltás a `VEDETT_LOGOK` listában van a szkript tetején.
- **Kép SOHA nem kerül a `public/` mappába.** Onnan a build változtatás nélkül
  kiszállítja. Egyszer 36 MB ment ki így. Kivétel csak a `megosztas.jpg` és az
  ikonok, azoknak fix címen kell lenniük.

### Mi hiányzik még

```bash
node scripts/mi-kell-meg.mjs
```

Standonként megmondja, melyik ételhez kell fotó és milyen néven, meg hol
hiányzik logó.

---

## 5. Péntek: a térkép-pinek bemérése

### A gyors út: az app méri be, nem te írod be

A telefonodon lépj be a `0169` kóddal, és nyomd meg a **„Koordináta-felvétel
a helyszínen"** gombot. Egy lista jön fel, elöl a még becsült standokkal.

**Odaállsz a sátor elé, és rákoppintasz a nevére.** Pár másodpercig mér,
aztán magától beírja. Nincs jegyzetelés, nincs fájl, nincs szkript.

Amit magától megtesz:

- **Hat másodpercig figyel, és a legjobb olvasatot tartja meg.** A telefon
  első GPS-válasza gyakran 30-50 méteres, és csak utána javul. Ha már 8 méter
  alatti, korán megáll.
- **A 25 méternél pontatlanabbat nem fogadja el.** Annyival a szomszéd
  sátorhoz vinné a látogatót, és az rosszabb, mint a becsült pin. Ilyenkor
  várj pár másodpercet, és nyomd meg újra.
- **A Kőszegen kívüli pontot elutasítja.**
- **Hálózat nélkül is megtartja a mérést.** A pont a készülékre kerül, és
  felmegy, amint van net; a fejlécben látszik, hány vár. Nem kell visszamenni
  a sátorhoz.
- A bemért standot pipával mutatja, a koordinátájával együtt. Ha félrement,
  az „Újra" gombbal újramérhető.

Közben a térképen azonnal a helyén lesz a pin, tehát menet közben
ellenőrizheted.

Jelenleg 31 pin **becsült** — egy szabályos rács a sétány két oldalán, aminek
semmi köze a valósághoz. Ez a leglátványosabb hibalehetőség: a vendég
rákoppint, odamegy, és nincs ott a stand. Az appos felvétellel viszont
nyugodtan menj végig mind a 31-en: egy koppintás sátranként.

### A tartalék út: szövegfájl és szkript

Ha a telefonos felvétel nem járható (nincs GPS-engedély, lemerült telefon),
a mért pontok jöhetnek szövegfájlban is, soronként egy stand. Ekkor nem kell
mind a 31 ponton megállni:

1. Sétáld végig a sort, és írd le a sátrak **sorrendjét**.
2. Minden **ötödik** sátornál állj meg és vedd fel a GPS-pontot.
3. A sor **két végét** mindenképp mérd be.

A köztes helyeket ebből kiszámolom. Két bemért pont között a hiba egy méter
alatt marad, ami egy 3×3-as sátorhoz pontos.

Ha mégis pontonként mérnél, a bemenet egy szövegfájl, soronként egy stand,
akárhogy:

```
Hajnalcsillag: 47.38919270798614, 16.539153584867744
KTSZE stand 47.38986871225532, 16.539555530929338
```

```bash
node scripts/koordinatak.mjs pontok.txt --proba
node scripts/koordinatak.mjs pontok.txt
```

**Négy dolgot utasít el**, mert mind a négy rossz sátorhoz vinné a látogatót:
kétértelmű standnév, Kőszegen kívüli pont (ez fogja meg a felcserélt
szélesség/hosszúságot), hat tizedesjegynél pontatlanabb szám (csonkult
beillesztés), és ugyanannak a pontnak a kétszeri megadása.

---

## 6. Szövegek

```bash
node scripts/stand-leirasok.mjs x.json      # standok bemutatkozása
node scripts/program-leirasok.mjs x.json    # programleírások
node scripts/versenyetelek.mjs              # versenyételek jelölése
```

A két leírás-szkript JSON-t vár: `{ "Név": "szöveg" }`. A `null` érték törli a
szöveget. Mindkettő **pontos névegyezést** kér, nem tippel.

A `versenyetelek.mjs` a nevezési listából dolgozik, ami a szkript tetején van
kiírva. Ha a szervezők frissítik a kiírást, azt a listát kell bővíteni.
Újrafuttatható: előbb mindenhonnan leveszi a jelölést, aztán felteszi.

**A szervezői szöveg gyakran tartalmaz nekünk szóló megjegyzést** („a pontos
műfajt a szervezővel egyeztetni kell"). Az ilyen mondat nem mehet az appba — a
látogató értelmetlennek látja.

---

## 6b. Infótábla — amit a standok üzennek

A látogatói appban külön oldal (alsó sáv, hangszóró ikon). A standok ide
írják, hogy „Kész a gulyás!", „Elfogyott a csülök" — minden üzenet külön
bejegyzés, a stand nevével és a pontos időponttal.

**Írni csak a standok tudnak**, a saját PIN-jükkel, a stand kezelőjének
tetejéről. Az adatbázis köti a PIN-hez (`post_stand_hir`), a táblára nincs
insert policy — a böngészőből nem lehet idegen stand nevében posztolni.

Ehhez a `supabase-infotabla.sql`-nek le kell futnia a Supabase SQL
Editorban. Ha nem futott le, a tábla üresen marad, a kiírás hibát ad, és a
naplóban ez látszik: `Infotabla nem elerheto`. **Egyszeri dolog**, nem kell
megismételni.

Ha egy standos szól, hogy nem tud kiírni:

1. Be van léptetve? Az írólap csak belépés után látszik.
2. Van neki internet? A toast megmondja: „Nem sikerült kiírni. Van internet?"
3. Lefutott az SQL? Ha nem, senki nem tud kiírni, nem csak ő.

**Az admin is írhat.** Neki nincs standja, ezért a PIN-jegyzék oldalán van az
írólapja: `0169`-cel belépve, a szavazás állása fölött. A bejegyzés mellé
„Admin" kerül, csillaggal, nem egy stand logójával.

**Minden beírás javítható.** A stand a sajátját, a szervező bármelyiket: a
bejegyzés mellett ceruza, a javítás a helyén nyílik. Az **időpont marad az
eredeti**, és a szöveg után megjelenik a „· javítva" — egy fél órája kiírt
üzenet nem ugorhat előre a táblán csak azért, mert elírás volt benne.

Az admin kóddal bármelyik üzenet le is vehető a tábláról, magán a tábla
oldalán, a kuka ikonnal.

A **standok állandó megjegyzése** (`exhibitors.notice`) más dolog: az, ami
egész hétvégén igaz (allergén-infó, hol a sátor). Az a stand kártyáján
látszik, és nem az infótáblán. Az időpontos hír megy a táblára.

---

## 7. Szavazás

```bash
node scripts/szavazatok.mjs                 # valódi állás a naplóból
node scripts/szavazatok.mjs --ujraszamol    # a kiírt szám javítása
```

A `menu_items.votes` oszlop csak **gyorsítótár**. Az igazság az `item_votes`
napló, amit a böngészőből nem lehet írni. **Eredményt csak a naplóból hirdess.**
Ugyanez látszik a szervezői nézetben is: a `0169` kóddal belépve a PIN-jegyzék
fölött ott az élő állás, és jelzi, ha a kiírt szám eltér a naplótól.

---

## 7b. Pillanatkép — a vészüzem frissítése

```bash
node scripts/pillanatkep.mjs
git add -A public && git commit -m "pillanatkep" && git push
```

Ez kimenti az egész adatot és **minden képet** a `public/` mappába, ahonnan a
Netlify szolgálja ki őket. Két dolgot ad:

**1. Vészüzem.** Ha a Supabase nem válaszol — elfogy a keret, leáll, vagy csak
gyenge a net a tömegben —, az app ebből dolgozik tovább: standok, ételek,
leírások, fotók, program. Egy sárga sáv megmondja a látogatónak, hogy mentett
adatot lát, és hogy a szavazás addig nem megy. Enélkül **üresen** töltött be,
mintha egyetlen stand sem lenne.

**2. A képek innen jönnek alapból is.** A forgalom szinte egészét a képek
adják; a Supabase havi 5 GB-ot ad, a Netlify 100-at. Így a keret nem fogyhat el.

**ÁRA:** ha egy stand lecseréli a fotóját, az csak új pillanatkép és push után
látszik. Az ADAT élőben jön: új étel, elfogyott tétel, szavazat azonnal
látszik, ehhez nem kell semmit kirakni.

**Futtasd minden nagyobb változás után**, és mindenképp a rendezvény előtti
utolsó körben. A pillanatkép annyit ér, amennyire friss.

Kikapcsolható: `KEPEK_A_BUILDBOL = false` az `OrsolyaContext.jsx` tetején —
onnantól minden kép újra a Supabase-ből jön.

## 8. Kirakás az internetre

**Adatváltozáshoz nem kell semmit kirakni.** A standok, ételek, képek,
programok mind az adatbázisból jönnek — amint a szkript lefutott, a telefonokon
is ott van. A szavazás és a látogatásszámláló élőben frissül.

**Kódváltozáshoz** viszont igen:

```bash
git add -A && git commit -m "…" && git push
```

A Netlify magától épít a `main` ágról, nagyjából egy perc. Ellenőrzés:

```bash
npm run build     # előbb helyben: ha itt elhasal, ott is fog
```

---

## 8b. Az utolsó kör, mielőtt gépet váltasz

Ezt a sorrendet fusd végig, amikor minden adat bent van, és a következő
munka már a MacBookon lesz. Nyolc perc, és utána a repó önmagában elég.

```bash
node scripts/ellenorzes.mjs                 # nincs hiányzó kép, PIN, koordináta
node scripts/kezikonyvek.mjs                # standos útmutatók a legfrissebb szöveggel
node scripts/pin-lista.mjs                  # PIN-lista és koordináta-állapot
node scripts/pillanatkep.mjs                # vészüzem + a buildből szolgált képek
npm run build                               # a dist ~850 kB; ha MB-os, kép került a public/-ba
npm ci --dry-run --os=linux --cpu=x64       # ahogy a Netlify látja
git add -A && git commit -m "…" && git push
```

Utána **nyisd meg a telefonon az éles oldalt**, és nézd meg, hogy a legutóbbi
változás látszik-e. A build átmehet úgy is, hogy az oldal fehér marad (egy
hiányzó import ilyen), és ezt csak a megnyitás mutatja meg.

**Amit a git NEM visz át** — ezek gitignore-oltak, és ez szándékos:

| Mi | Mi a megoldás a másik gépen |
|---|---|
| `.env` | kézzel létrehozni (0. fejezet), a kulcsokat magadnak átküldeni |
| `KIALLITO_PIN_KODOK.txt` | `node scripts/pin-lista.mjs` újra legenerálja |
| `kezikonyvek/` | `node scripts/kezikonyvek.mjs` újra legenerálja |
| `etelfotok/`, `logok/` | a képek már fent vannak a Storage-ban; az új fotók a helyszínen készülnek, új mappába |

---

## 9. Ha valami elromlik

**Először mindig:**

```bash
node scripts/ellenorzes.mjs
```

Ez megmondja, hiányzik-e PIN, kép, koordináta, vagy van-e étel nélküli stand.

**Nem jelenik meg egy új stand a katalógusban** → nincs egyetlen étele sem. Az
`ellenorzes.mjs` külön kiírja.

**Nem töltődnek be a képek, de az app megy** → elfogyott a Supabase havi
forgalmi kerete. Ezt csak a Supabase felületén lehet megoldani (csomagváltás),
kódból nem.

**A Netlify nem épít** → nézd meg a deploy logot. A két ismert ok: egy
platformspecifikus bináris került a `package.json`-ba (macOS-en futtatott
`npm install` nyoma), vagy JS-hiba. Helyben az `npm run build` ugyanazt mutatja.

**Egy stand nem tudja menteni az ételét** → valószínűleg `price` mező került a
mentésbe. A `menu_items` táblában nincs ilyen oszlop, és a Supabase emiatt az
*egész* kérést visszautasítja.

**Elromlott egy adat** → a legtöbb szkript naplózza, mit csinált, és a
képfeltöltés sosem töröl: a régi fájl a gépen marad.

---

## 10. Amit soha

- **Árat kiírni.** Sehol. A vásáron adománygyűjtés folyik; a `menu_items`
  táblában nincs `price` oszlop, és ha a mentés mégis küld ilyet, egyetlen
  stand sem tud ételt szerkeszteni.
- **PIN kódot a repóba, képernyőre, képernyőképre.** A repó nyilvános.
- **A `.env`-et commitolni.**
- **Az `src/data/orsolyaGastroCatalog.js`-t szerkeszteni.** Halott fájl, az app
  nem használja; aki abba dolgozik, a semmibe dolgozik.
- **Képet a `public/` mappába tenni.**
- **Élő adaton tesztelni.** Erre való a `--proba`. (Egyszer három stand fotóját
  írtam felül egy teszttel — fél óra volt visszaállítani.)

---

## Gyorslista

| Mit | Parancs |
|---|---|
| Mi az állás | `node scripts/ellenorzes.mjs` |
| Mihez kell még kép | `node scripts/mi-kell-meg.mjs` |
| PIN kódok | `node scripts/pin-lista.mjs` |
| Új stand | `node scripts/stand-felvetel.mjs uj.json` |
| Új étel meglévő standhoz | `node scripts/etel-felvetel.mjs "Stand" etelek.json` |
| Képek fel | `node scripts/kepek-feltoltese.mjs --mind` |
| Logók fel | `node scripts/kepek-feltoltese.mjs --logok` |
| Egy mappa, étel-nevekkel | `node scripts/kepek-feltoltese.mjs --koteg <mappa>` |
| Koordináták | `node scripts/koordinatak.mjs pontok.txt` |
| Versenyételek | `node scripts/versenyetelek.mjs` |
| Szavazás állása | `node scripts/szavazatok.mjs` |
| Standos útmutatók PIN-nel | `node scripts/kezikonyvek.mjs` |
| Vészüzemi pillanatkép | `node scripts/pillanatkep.mjs` |
| Kirakás | `git add -A && git commit -m "…" && git push` |

Mindegyikhez `--proba` (a `pin-lista` és az `ellenorzes` kivételével, azok nem
írnak semmit).
