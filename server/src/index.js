/**
 * Express alkalmazás belépési pontja.
 *
 * Futtatás:
 *   cd server && npm install && cp .env.example .env && npm run dev
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import {
  assertConfig,
  CORS_ORIGINS,
  SANDBOX,
  MERCHANT,
  IPN_URL,
  BACK_URL,
} from './config/simplepay.js';
import paymentRouter from './routes/payment.js';
import ipnRouter from './routes/ipn.js';
import { ValidationError } from './lib/validation.js';
import { SimplePayError } from './lib/simplepay.js';

assertConfig();

const app = express();

// A reverse proxy (Netlify, Nginx, Render...) mögött ez kell a helyes
// protokoll- és IP-felismeréshez.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ---------------------------------------------------------------------------
// CORS
//
// A SimplePay szerverei NEM böngészőből hívnak minket (az IPN szerver-szerver),
// ezért elég a saját frontendünket engedélyezni.
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin(origin, callback) {
      // origin nélküli kérés: szerver-szerver hívás vagy curl -- átengedjük,
      // a védelmet ezeknél az aláírás-ellenőrzés adja.
      if (!origin || CORS_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: nem engedelyezett origin (${origin})`));
    },
    methods: ['GET', 'POST'],
    maxAge: 86_400,
  })
);

// ---------------------------------------------------------------------------
// Body parser
//
// A `verify` callback elteszi a NYERS body-t, mert az IPN aláírás-ellenőrzése
// pontosan azokra a byte-okra vonatkozik, amiket megkaptunk. Az express.json()
// által visszaadott objektum újraszerializálása más stringet adna.
// ---------------------------------------------------------------------------
app.use(
  express.json({
    limit: '64kb',
    verify: (req, _res, buffer) => {
      req.rawBody = buffer.toString('utf8');
    },
  })
);

// ---------------------------------------------------------------------------
// Egyszerű, memóriabeli rate limit a /start végpontra.
// Éles üzemben érdemes megosztott tárral (Redis) vagy a platform WAF-jával
// kiváltani, de egy alap visszaélés-védelem függőség nélkül is kell.
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
/** @type {Map<string, number[]>} */
const requestLog = new Map();

app.use('/api/payment/start', (req, res, next) => {
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ ok: false, error: 'Túl sok kérés. Próbáld újra egy perc múlva.' });
  }

  recent.push(now);
  requestLog.set(key, recent);
  next();
});

// ---------------------------------------------------------------------------
// Útvonalak
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, sandbox: SANDBOX, merchant: MERCHANT });
});

app.use('/api/payment', paymentRouter);
app.use('/api/payment', ipnRouter);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Nincs ilyen végpont.' });
});

// ---------------------------------------------------------------------------
// Központi hibakezelő
//
// A kliens felé csak annyit adunk vissza, amennyi a felhasználónak segít;
// a részletek a szerver naplójába kerülnek.
// ---------------------------------------------------------------------------
app.use((error, _req, res, _next) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({ ok: false, error: error.message, field: error.field });
  }

  if (error instanceof SimplePayError) {
    console.error('[simplepay] %s | kodok: %j | raw: %s', error.message, error.errorCodes, error.raw);
    return res.status(502).json({
      ok: false,
      error: 'A fizetési szolgáltató most nem érhető el. Kérlek, próbáld újra.',
      errorCodes: error.errorCodes,
    });
  }

  console.error('[server] Varatlan hiba: %s', error.stack || error.message);
  return res.status(500).json({ ok: false, error: 'Váratlan hiba történt.' });
});

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log('---------------------------------------------------------');
  console.log(' Adomany backend elindult: http://localhost:%s', port);
  console.log(' Uzemmod   : %s', SANDBOX ? 'SANDBOX' : 'ELES');
  console.log(' Merchant  : %s', MERCHANT);
  console.log(' IPN URL   : %s', IPN_URL);
  console.log(' Vissza URL: %s', BACK_URL);
  console.log('---------------------------------------------------------');
  if (SANDBOX) {
    console.log(' Az IPN URL-t a SimplePay kereskedoi fiokban is be kell allitani.');
    console.log(' Localhost-ot a SimplePay nem er el -> hasznalj ngrok/cloudflared tunnelt.');
  }
});

export default app;
