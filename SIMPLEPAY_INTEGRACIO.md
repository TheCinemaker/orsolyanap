# SimplePay v2 adománymodul — telepítés és üzembe helyezés

Bankkártyás (CARD) és Qvik (azonnali átutalás) adománygyűjtés, szabadon
beírható összeggel.

---

## 1. Fájlszerkezet

Az architektúra **Netlify Functions + Supabase** — nincs külön futó szerver.

```
orsolyaapp/
├── netlify/
│   ├── functions/                    ← a "backend": Netlify Functions 2.0
│   │   ├── payment-start.mjs         POST /api/payment/start
│   │   ├── payment-status.mjs        GET  /api/payment/status/:orderRef
│   │   ├── payment-ipn.mjs           POST /api/payment/ipn   (webhook)
│   │   ├── payment-back.mjs          GET  /api/payment/back  (visszairányítás)
│   │   └── payment-config.mjs        GET  /api/payment/config
│   └── lib/                          ← közös modulok
│       ├── config.js                 minden környezetfüggő érték egy helyen
│       ├── simplepay.js              HMAC-SHA384, dátum, HTTP hívás, státusz
│       ├── payloads.js               kártyás és Qvik payload
│       ├── validation.js             összeg, mód, e-mail ellenőrzés
│       └── store.js                  Supabase tranzakció-tár
├── supabase-donations.sql            a donations tábla sémája
├── netlify.toml                      build + functions beállítás
└── src/
    ├── DonationPage.jsx              önálló belépési pont a /adomany-hoz
    ├── components/DonationForm.jsx   az adományűrlap
    ├── components/DonationResult.jsx fizetés utáni visszajelzés
    ├── hooks/useDonationStatus.js    rövid polling
    └── lib/donationApi.js            fetch réteg
```

Az útvonalakat maguk a függvények regisztrálják
(`export const config = { path: '/api/payment/start' }`), ezért a
`netlify.toml`-ban nem kell hozzájuk redirect.

> A repóban lévő `server/` mappa az eredeti Express változat. A Netlify
> felállásban nincs rá szükség — nyugodtan törölhető.

---

## 2. Telepítés és helyi futtatás

Új csomag nem kell: a függvények a Node beépített `fetch`-ét és `crypto`-ját
használják, a Supabase kliens (`@supabase/supabase-js`) pedig már fent van.

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Töltsd ki a `.env`-ben a `SUPABASE_SERVICE_ROLE_KEY`-t (Supabase Dashboard →
Project Settings → API → `service_role`), majd futtasd le a
`supabase-donations.sql`-t a Supabase SQL Editorban.

Helyi futtatás a függvényekkel együtt:

```bash
npx netlify dev             # http://localhost:8888
```

Ez egyszerre indítja a Vite dev szervert és a függvényeket, és a `.env`-et is
beolvassa. A sima `npm run dev` csak a frontendet adja, fizetés nélkül.

---

## 3. Használat

```jsx
import DonationForm from './components/DonationForm';

<DonationForm
  title="Támogasd az Orsolya-napokat"
  onSuccess={({ orderRef, amount }) => console.log('Adomány:', orderRef, amount)}
/>
```

A kártyás fizetés utáni visszatérés kezelése (az app már SPA-fallbackkel fut,
így elég az útvonalra figyelni):

```jsx
import DonationResult from './components/DonationResult';

const isDonationResult = window.location.pathname === '/adomany/visszajelzes';
if (isDonationResult) return <DonationResult onClose={() => window.location.assign('/')} />;
```

---

## 4. SimplePay kereskedői fiók beállításai

A `sandbox.simplepay.hu` (majd az éles) admin felületen:

| Beállítás | Érték |
|---|---|
| IPN URL | `https://<backend-domain>/api/payment/ipn` |
| Vissza URL | `https://<backend-domain>/api/payment/back` |
| Engedélyezett fizetési módok | CARD, Qvik |

A localhostot a SimplePay nem éri el. Fejlesztéshez alagút kell:

```bash
npx cloudflared tunnel --url http://localhost:4000
# vagy: ngrok http 4000
```

A kapott publikus URL-t írd a `PUBLIC_BACKEND_URL`-be **és** a SimplePay
admin felületére is.

---

## 5. Folyamatábra

### Bankkártya

```
React                      Backend                     SimplePay
  │  POST /start ────────────►│
  │                           │  POST /payment/v2/start ──►│
  │                           │◄── paymentUrl ─────────────│
  │◄── { paymentUrl } ────────│
  │  window.location.href = paymentUrl
  │────────────────────────────────────────────────────────►│  (fizetőoldal)
  │                           │◄── IPN (szerver-szerver) ───│
  │                           │─── aláírt nyugta ──────────►│
  │◄── GET /back?r=..&s=.. ── (böngésző visszairányítás) ───│
  │  redirect: /adomany/visszajelzes?status=SUCCESS
```

### Qvik

```
React                      Backend                     SimplePay
  │  POST /start ────────────►│
  │                           │  POST /payment/rtp/start ─►│   ← NEM /v2 !
  │                           │◄── paymentUrl ─────────────│
  │◄── { paymentUrl } ────────│
  │  (nincs azonnali átirányítás)
  │  mobil : gomb  -> paymentUrl
  │  asztali: QR-kód a paymentUrl-ből, telefonnal beolvasva
  │────────────────────────────────────────────────────────►│  (RTP oldal)
  │                                    banki app ──────────►│
  │                           │◄── IPN ────────────────────│
  │  GET /status/:orderRef ──►│   (3s-től induló polling,
  │◄── { status: SUCCESS } ───│    a v2 /query is megtalálja)
```

---

## 6. Biztonsági pontok — ezeken ne lazíts

1. **A titkos kulcs csak a szerveren él.** Soha nem kerülhet `VITE_`
   előtagú változóba, mert az bekerül a kliens bundle-be.
2. **Az aláírás a nyers byte-okra készül.** Ezért szerializálunk egyszer
   (`JSON.stringify`), és azt a stringet küldjük ki, illetve az `express.json`
   `verify` hookja menti a beérkező nyers body-t. Újraszerializálás → érvénytelen aláírás.
3. **Az összeget a szerver ellenőrzi** (`lib/validation.js`), nem a kliens.
4. **A siker forrása az IPN, nem a böngésző.** A `/back` visszairányítást a
   felhasználó megpiszkálhatná; az aláírás-ellenőrzés kiszűri, de a rögzítés
   akkor is az IPN-hez kötött.
5. **Az IPN-feldolgozás idempotens.** Ugyanaz az `orderRef` többször is
   megérkezhet; a végállapotot nem írjuk felül.
6. **A válasz aláírását is ellenőrizzük** (`callSimplePay`), nem csak a kérését.

---

## 7. Qvik = Request To Pay (RTP) — külön API, nem `methods` érték

Ez volt az integráció legfontosabb felismerése, ezért érdemes rögzíteni.

**A Qvik NEM a v2 `/start` végpont `methods` mezőjének egy értéke.** Aki így
próbálja (`methods: ["QVIK"]`), az `5014`-es hibát kap — ez vezetett félre
minket is az elején. A SimplePay a Qviket **„Fizetési kérelem / Request To Pay
(RTP)"** néven, külön dokumentációban, külön SDK-ban és **külön végponton**
adja ki.

### A két ág

| | Kártya | Qvik |
|---|---|---|
| Végpont | `https://sandbox.simplepay.hu/payment/v2/start` | `https://sandbox.simplepay.hu/payment/rtp/start` |
| `methods` mező | `["CARD"]` | **nincs** |
| Határidő mezőneve | `timeout` | `deadline` |
| Extra mezők | — | `customer`, `additionalInfo` |
| Válasz | `paymentUrl` | `paymentUrl` |

Figyeld meg: az RTP végpont **nincs a `/v2` alatt**, hanem egy szinttel
feljebb, a `/payment` alatt. A `/payment/v2/rtp/start` és a
`/payment/v2.1/rtp/start` egyaránt 404-et ad.

Az aláírás mindkettőnél ugyanaz a HMAC-SHA384 séma, és az RTP válasz aláírása
is ellenőrizhető — leteszteltük, érvényes.

### Nincs nyers QR string és deep link

Az RTP válasz csak ennyit ad vissza:

```json
{
  "orderRef": "...",
  "transactionId": 509078081,
  "paymentUrl": "https://sandbox.simplepay.hu/pay/rtp/pspHU/QvjHdeCc...",
  "currency": "HUF",
  "total": 2500,
  "merchant": "PUBLICTESTHUF",
  "salt": "..."
}
```

**A QR-kódot és a banki app megnyitását a SimplePay a saját fizetőoldalán
intézi** — az API nem ad nyers QR stringet vagy deep linket. Ezért a kód nem is
rajzol sajátot: a `paymentUrl`-t használja. Mobilon a gomb odanavigál, asztali
gépen QR-kódot mutatunk belőle, hogy telefonról is fizethető legyen.

### Státusz-lekérdezés

Az RTP tranzakciókat a **megszokott `/payment/v2/query` végpont megtalálja**
(leteszteltük: `status: INIT` jött vissza egy friss RTP rendelésre). Tehát a
polling és az IPN-kezelés változtatás nélkül működik mindkét ágra.

Az `/rtp/query` végpont a nyilvános teszt-fiókkal `5113`-mal válaszolt; mivel a
v2 query működik, ezt nem hajszoltuk tovább.

### Hol van a hivatalos forrás

A [SimplePay fejlesztői oldalról](https://simplepay.hu/fejlesztoknek/):

- RTP dokumentáció: `https://simplepartner.hu/download.php?target=v21rtpdochu`
- RTP PHP SDK mintakód: `https://simplepartner.hu/download.php?target=v21rtpsdk`

Az SDK-ban a `src/SimplePayV21Rtp.php` sorolja fel a végpontokat
(`/rtp/start`, `/rtp/do`, `/rtp/query`, `/rtp/refund`, `/rtp/reverse`), az
`rtpstart.php` pedig a kérés mezőit.

**`/rtp/do`** egy másik felhasználási eset: ott `customerBankAccount` alapján
lehet fizetési kérelmet kiküldeni ismert számlaszámra, kötegelten. Pultnál
nem ez kell, hanem az `/rtp/start`.

### Éles üzem

Az éles RTP útvonal a sandbox mintájának megfelelője
(`https://secure.simplepay.hu/payment/rtp/start`) — ezt élesítés előtt
érdemes visszaigazoltatni a SimplePay-jel, mert élesben nem tudtuk tesztelni.

### Gyakori SimplePay hibakódok

| Kód | Jelentés | Teendő |
|---|---|---|
| 5014 | A fizetési mód a fiókon nem elérhető | Qviknél: rossz végpontot hívsz, lásd fent |
| 5219 | Hiányzó `customerEmail` | Kötelező mező, de bármilyen érvényes cím jó |
| 5113 | Érvénytelen kérés az RTP query-n | Használd a v2 `/query`-t |
| 2003 | Érvénytelen aláírás | A body újraszerializálódott — lásd 6. pont |

## 7/b. Mit teszteltünk ténylegesen

| Ellenőrzés | Eredmény |
|---|---|
| HMAC-SHA384 aláírás hossza/formátuma | 64 karakteres base64 ✔ |
| Aláírás-ellenőrzés jó/rossz kulccsal | elfogad / elutasít ✔ |
| 32 karakteres salt, ISO dátum `+02:00` offszettel | ✔ |
| `POST /start` CARD a valódi sandbox ellen | `paymentUrl` + érvényes válasz-aláírás ✔ |
| Összeg/mód/e-mail validáció | magyar hibaüzenettel elutasít ✔ |
| IPN érvényes aláírással | HTTP 200, aláírt nyugta `receiveDate`-tel ✔ |
| IPN hamis aláírással | HTTP 401 ✔ |
| Ismételt IPN (TIMEOUT a SUCCESS után) | nem írja felül ✔ |
| `GET /back` jó/rossz aláírással | helyes / `ERROR` átirányítás ✔ |
| `GET /status/:orderRef` polling | `SUCCESS`, `isFinal: true` ✔ |
| `npm run build` az új komponensekkel | hiba nélkül lefut ✔ |

A Qvik ág végpontról végpontra nem volt tesztelhető, mert a nyilvános
sandbox fiók nem támogatja (lásd fent).

---

## 8. Éles üzembe helyezés

1. `SIMPLEPAY_SANDBOX=false`
2. Éles `SIMPLEPAY_MERCHANT` és `SIMPLEPAY_SECRET_KEY` a szolgáltatótól.
3. `PUBLIC_BACKEND_URL` https-sel (az `assertConfig()` ezt kikényszeríti).
4. IPN és vissza URL frissítése az éles admin felületen.
5. A `store/transactions.js` lecserélése adatbázisra (lásd lent).
6. Az adatkezelési tájékoztatóba be kell kerülnie az OTP Mobil Kft. felé történő
   adattovábbításnak (a nyilatkozat checkboxa már benne van az űrlapban).

### Supabase tábla a memóriabeli tár helyett

```sql
create table if not exists public.donations (
  id                       uuid primary key default gen_random_uuid(),
  order_ref                text unique not null,
  amount                   integer not null check (amount > 0),
  method                   text not null check (method in ('card','qvik')),
  status                   text not null default 'INIT',
  simplepay_transaction_id text,
  donor_email              text,
  donor_name               text,
  paid_at                  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists donations_status_idx on public.donations (status);

-- A táblát csak a backend írja (service role kulccsal), a kliens nem éri el.
alter table public.donations enable row level security;
```

A cseréhez elég a `store/transactions.js` öt exportált függvényét átírni —
a `routes/*` fájlokhoz nem kell hozzányúlni.

---

## 9. Értesítés a Qvik fizetés sikeréről — polling vs. WebSocket

**A probléma:** a Qvik fizetés a felhasználó banki appjában zajlik. A böngésző
nem vesz részt benne, így magától nem tud a sikerről. A SimplePay az IPN
webhookon a **backendet** értesíti — kell tehát egy csatorna backend → böngésző.

### A) Rövid polling — ez van megvalósítva

`src/hooks/useDonationStatus.js` + `GET /api/payment/status/:orderRef`.

Miért ez az alapértelmezett: nem kell állandó kapcsolat, nem kell külön
infrastruktúra, és egy 1–2 perces fizetés alatt néhány tucat kérésről van szó.

A megvalósításban három dolog számít éles üzemben:

- `setTimeout` lánc `setInterval` helyett — egy lassú válasz így nem torlaszol
  fel újabb kéréseket;
- **fokozatosan növekvő időköz** (3s → 4,5s → … → 10s) — a hosszabb várakozás
  nem terheli feleslegesen a szervert;
- **szünet rejtett böngészőfülön** (`visibilitychange`), és azonnali frissítés
  a fül visszahozásakor;
- **kemény határidő** (10 perc), ami után a hook magától leáll.

A szerver oldalán a `/status` végpont elsőként a saját tárolt állapotot adja
vissza (ezt az IPN frissíti), és csak 10 másodpercenként legfeljebb egyszer
kérdez rá a SimplePay `/query` végpontján — így egy elveszett IPN sem okoz
beragadt „várakozás" állapotot.

### B) Supabase Realtime — a legkisebb lépés ebben a projektben

Mivel a Supabase már használatban van, a polling kiváltható kód-minimummal:
a backend IPN-kezelője írja a `donations` táblát, a frontend pedig feliratkozik
a sor változására.

```jsx
useEffect(() => {
  if (!orderRef) return;
  const channel = supabase
    .channel(`donation:${orderRef}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'donations', filter: `order_ref=eq.${orderRef}` },
      (payload) => {
        if (payload.new.status === 'SUCCESS') setPaid(true);
      }
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [orderRef]);
```

A polling ilyenkor sem felesleges: tartsd meg ritkított (15–20 s) tartaléknak
arra az esetre, ha a realtime kapcsolat megszakad.

### C) Server-Sent Events (SSE)

Ha nem akarsz Supabase Realtime-ot, de valós idejű értesítés kell:
`GET /api/payment/stream/:orderRef` egy `text/event-stream` válasszal, amit az
IPN-kezelő bök meg. Egyirányú, `EventSource`-szal pár sor a kliensen, és nem
igényel WebSocket-infrastruktúrát. Figyelni kell a proxy időtúllépésekre
(keepalive komment 20–30 másodpercenként).

### D) WebSocket

Csak akkor éri meg, ha amúgy is van kétirányú valós idejű igény az appban
(pl. élő pult-státusz). Egyetlen fizetés visszaigazolásához túl sok
többletmunka: kapcsolatkezelés, újracsatlakozás, skálázás több szerverpéldányra.

---

## 10. Netlify-specifikus megjegyzés

Ez a projekt Netlify-ra épül (`netlify.toml`), ahol nincs futó Express
szerver. Két járható út:

**1. Külön backend szolgáltatón** (Render, Railway, Fly.io) — a `server/`
mappa változtatás nélkül fut. A frontendben `VITE_PAYMENT_API_URL` mutasson rá.

**2. Netlify Functions** — a route-ok logikája változatlanul újrahasznosítható,
mert a SimplePay-hívás és az aláírás külön modulokban van:

```
netlify/functions/payment-start.js   → routes/payment.js /start ága
netlify/functions/payment-ipn.js     → routes/ipn.js
netlify/functions/payment-status.js  → routes/payment.js /status ága
```

Egy dologra figyelj: a függvényben a **nyers** kérés-body-t kell aláírás-
ellenőrzéshez használni (`event.body`, `JSON.parse` előtt), ahogy az Express
változatban a `req.rawBody`-t. És a `netlify.toml` SPA-fallback elé kell egy
kivétel:

```toml
[[redirects]]
  from = "/api/payment/*"
  to = "/.netlify/functions/payment-:splat"
  status = 200
```

A memóriabeli tár itt nem működik (a függvények nem osztoznak állapoton) —
ebben az esetben a Supabase tábla nem opció, hanem előfeltétel.
