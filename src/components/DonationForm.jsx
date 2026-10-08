import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  CreditCard,
  Heart,
  Loader2,
  Mail,
  QrCode,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { startDonation } from '../lib/donationApi';
import { useDonationStatus } from '../hooks/useDonationStatus';

/** Gyorsválasztó összegek. A felhasználó ettől eltérőt is beírhat. */
const PRESET_AMOUNTS = [1000, 2000, 5000, 10000];

/** Kliensoldali korlátok. A szerver ugyanezt újra ellenőrzi -- ez csak UX. */
const MIN_AMOUNT = 500;
const MAX_AMOUNT = 1_000_000;

const formatHuf = (value) =>
  new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(value);

/** A beírt szövegből csak a számjegyeket tartjuk meg. */
const digitsOnly = (value) => value.replace(/\D/g, '');

/**
 * Adománygyűjtő űrlap SimplePay v2 (bankkártya) és Qvik (azonnali átutalás)
 * fizetéssel.
 *
 * @param {object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {(result: { orderRef: string, amount: number, method: string }) => void} [props.onSuccess]
 */
export default function DonationForm({
  title = 'Támogasd a KTSZE egyesületet',
  description = 'Adományod a rendezvények szervezését és a hagyományok megőrzését segíti.',
  initialAmount = 2000,
  onSuccess,
}) {
  // --- Űrlap állapot ---------------------------------------------------------
  const [amountText, setAmountText] = useState(String(initialAmount || 2000));
  const [method, setMethod] = useState('card');
  const [email, setEmail] = useState('');
  const [wantsReceipt, setWantsReceipt] = useState(false);
  const [consent, setConsent] = useState(false);

  // --- Folyamat állapot ------------------------------------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [qvikSession, setQvikSession] = useState(null);
  const [copied, setCopied] = useState(false);

  const errorRef = useRef(null);
  const qvikRef = useRef(null);

  const amount = useMemo(() => Number(digitsOnly(amountText) || 0), [amountText]);

  const amountError = useMemo(() => {
    if (!amountText.trim()) return 'Add meg a támogatás összegét.';
    if (amount < MIN_AMOUNT) return `A legkisebb összeg ${formatHuf(MIN_AMOUNT)} Ft.`;
    if (amount > MAX_AMOUNT) return `A legnagyobb online összeg ${formatHuf(MAX_AMOUNT)} Ft.`;
    return null;
  }, [amountText, amount]);

  // Az e-mail nem feltétel: üresen az egyesület címe megy ki a SimplePay felé.
  const canSubmit = !isSubmitting && !amountError && consent;

  // --- Qvik: fizetés figyelése ----------------------------------------------

  const handleFinalStatus = useCallback(
    (status) => {
      if (status !== 'SUCCESS') return;
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch {
        // A konfetti csak díszítés -- ha nem megy, a folyamat attól még kész.
      }
      onSuccess?.({ orderRef: qvikSession?.orderRef, amount: qvikSession?.amount, method: 'qvik' });
    },
    [onSuccess, qvikSession]
  );

  const {
    status: qvikStatus,
    isFinal: qvikIsFinal,
    isPolling,
    error: pollError,
  } = useDonationStatus(qvikSession?.orderRef ?? null, { onFinal: handleFinalStatus });

  // A Qvik blokk megjelenésekor odagördítünk és fókuszt adunk -- képernyőolvasóval
  // is követhető legyen, hogy új tartalom jelent meg.
  useEffect(() => {
    if (qvikSession && qvikRef.current) {
      qvikRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      qvikRef.current.focus({ preventScroll: true });
    }
  }, [qvikSession]);

  useEffect(() => {
    if (formError && errorRef.current) errorRef.current.focus();
  }, [formError]);

  // --- Beküldés --------------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setFormError(null);
    setQvikSession(null);

    try {
      const result = await startDonation({
        amount,
        method,
        email: email.trim(), // üres -> a backend az egyesület címét használja
      });

      if (result.method === 'card') {
        // KÁRTYA: teljes oldalas átirányítás a SimplePay fizetőoldalára.
        // Nem iframe/popup: a 3D Secure folyamat és a bankok oldalai
        // beágyazva jellemzően nem működnek megbízhatóan.
        window.location.href = result.paymentUrl;
        return; // A submitting állapot marad, amíg az oldal elnavigál.
      }

      // QVIK: nincs átirányítás -- helyben mutatjuk a QR-kódot / deep linket.
      setQvikSession(result);
    } catch (error) {
      setFormError(error.message || 'Nem sikerült elindítani a fizetést.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyQr = async () => {
    if (!qvikSession?.paymentUrl) return;
    try {
      await navigator.clipboard.writeText(qvikSession.paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFormError('A vágólapra másolás nem sikerült.');
    }
  };

  const handleReset = () => {
    setQvikSession(null);
    setFormError(null);
  };

  // ---------------------------------------------------------------------------

  const inputClass =
    'w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 ' +
    'rounded-md text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500';

  const labelClass =
    'flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 ' +
    'uppercase tracking-wider mb-1.5';

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-6 w-full max-w-lg shadow-sm">
      <header className="mb-6 space-y-1.5">
        <span className="inline-block text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          Támogatás
        </span>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-amber-600" aria-hidden="true" />
          {title}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* ------------------------------------------------------------------ */}
        {/* Összeg                                                              */}
        {/* ------------------------------------------------------------------ */}
        <div>
          <label htmlFor="donation-amount" className={labelClass}>
            <span>Támogatás összege</span>
          </label>

          <div className="flex flex-wrap gap-2 mb-2.5">
            {PRESET_AMOUNTS.map((preset) => {
              const isActive = amount === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountText(String(preset))}
                  aria-pressed={isActive}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                    isActive
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-amber-400'
                  }`}
                >
                  {formatHuf(preset)} Ft
                </button>
              );
            })}
          </div>

          <div className="relative">
            <input
              id="donation-amount"
              // type="text" + inputMode="numeric": így tudunk ezres tagolást
              // mutatni (a number input nem engedné), mobilon mégis numerikus
              // billentyűzet jön fel.
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={amountText ? formatHuf(Number(digitsOnly(amountText) || 0)) : ''}
              onChange={(event) => setAmountText(digitsOnly(event.target.value))}
              placeholder="Egyéni összeg"
              aria-describedby="donation-amount-hint"
              aria-invalid={Boolean(amountError)}
              className={`${inputClass} pr-10 text-right font-bold text-base tabular-nums`}
            />
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400 pointer-events-none"
              aria-hidden="true"
            >
              Ft
            </span>
          </div>

          <p id="donation-amount-hint" className="mt-1.5 text-[11px] text-zinc-500">
            {amountError ? (
              <span className="text-red-600 dark:text-red-400 font-medium">{amountError}</span>
            ) : (
              `${formatHuf(MIN_AMOUNT)} Ft és ${formatHuf(MAX_AMOUNT)} Ft között.`
            )}
          </p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Fizetési mód                                                        */}
        {/* ------------------------------------------------------------------ */}
        <fieldset>
          <legend className={labelClass}>Fizetési mód</legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                value: 'card',
                label: 'Bankkártya',
                hint: 'Visa, Mastercard, Maestro',
                Icon: CreditCard,
              },
              {
                value: 'qvik',
                label: 'Qvik',
                hint: 'Azonnali utalás, QR-kóddal',
                Icon: QrCode,
              },
            ].map(({ value, label, hint, Icon }) => {
              const isActive = method === value;
              return (
                <label
                  key={value}
                  className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    isActive
                      ? 'border-amber-500 bg-amber-500/5'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-amber-400'
                  }`}
                >
                  {/* Valódi radio input, csak vizuálisan elrejtve: a billentyűzetes
                      navigáció és a képernyőolvasók így natívan működnek. */}
                  <input
                    type="radio"
                    name="payment-method"
                    value={value}
                    checked={isActive}
                    onChange={() => {
                      setMethod(value);
                      setQvikSession(null);
                    }}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                      isActive ? 'border-amber-500' : 'border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {isActive && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-white">
                      <Icon className="w-4 h-4 text-amber-600" aria-hidden="true" />
                      {label}
                    </span>
                    <span className="block text-[11px] text-zinc-500 mt-0.5">{hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* ------------------------------------------------------------------ */}
        {/* Visszaigazolás -- szándékosan elrejtve                              */}
        {/*                                                                     */}
        {/* A SimplePay kötelezően kér e-mail címet, a támogatótól viszont nem  */}
        {/* kérjük el: a pultnál minden begépelt karakter időbe kerül, és a     */}
        {/* backend az egyesület saját címét küldi helyette. Aki mégis          */}
        {/* visszaigazolást akar, egy koppintással előhozza a mezőt.            */}
        {/* ------------------------------------------------------------------ */}
        {!wantsReceipt ? (
          <button
            type="button"
            onClick={() => setWantsReceipt(true)}
            className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-amber-600 underline underline-offset-2"
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            Kérek e-mailes visszaigazolást
          </button>
        ) : (
          <div>
            <label htmlFor="donation-email" className={labelClass}>
              <span>E-mail cím a visszaigazoláshoz</span>
            </label>
            <input
              id="donation-email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="pelda@email.hu"
              className={inputClass}
            />
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Hozzájárulás -- a SimplePay adattovábbítási nyilatkozat kötelező     */}
        {/* ------------------------------------------------------------------ */}
        <label className="flex items-start gap-2.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 w-4 h-4 shrink-0 accent-amber-500"
            required
          />
          <span>
            Tudomásul veszem, hogy a megadott adataimat az adatkezelő továbbítja az{' '}
            <strong>OTP Mobil Kft.</strong> (SimplePay) mint adatfeldolgozó részére. A továbbított
            adatok köre: név, e-mail cím, összeg. Az adatfeldolgozó adatkezelési tájékoztatója a{' '}
            <a
              href="https://simplepay.hu/adatkezelesi-tajekoztatok/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-500 underline underline-offset-2"
            >
              simplepay.hu
            </a>{' '}
            oldalon érhető el.
          </span>
        </label>

        {/* ------------------------------------------------------------------ */}
        {/* Hibaüzenet                                                          */}
        {/* ------------------------------------------------------------------ */}
        {formError && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-xs text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Beküldés                                                            */}
        {/* ------------------------------------------------------------------ */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Fizetés előkészítése...
            </>
          ) : (
            <>
              <Heart className="w-4 h-4" aria-hidden="true" />
              {amountError ? 'Támogatom' : `Támogatom ${formatHuf(amount)} Ft-tal`}
            </>
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          A fizetés a SimplePay biztonságos felületén történik.
        </p>
      </form>

      {/* -------------------------------------------------------------------- */}
      {/* QVIK BLOKK -- csak Qvik esetén, átirányítás nélkül                     */}
      {/* -------------------------------------------------------------------- */}
      {qvikSession && (
        <div
          ref={qvikRef}
          tabIndex={-1}
          className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 focus:outline-none"
        >
          {qvikIsFinal && qvikStatus === 'SUCCESS' ? (
            // --- Sikeres fizetés ---
            <div className="text-center py-4">
              <CheckCircle2
                className="w-12 h-12 text-green-500 mx-auto mb-3"
                aria-hidden="true"
              />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Köszönjük a támogatást!
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {formatHuf(qvikSession.amount)} Ft adományod megérkezett. A visszaigazolást
                e-mailben küldjük.
              </p>
              <p className="text-[10px] text-zinc-400 mt-2">
                Azonosító: <span className="font-mono">{qvikSession.orderRef}</span>
              </p>
            </div>
          ) : qvikIsFinal ? (
            // --- Végállapot, de nem siker ---
            <div className="text-center py-4">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" aria-hidden="true" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                A fizetés nem fejeződött be
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {qvikStatus === 'CANCEL'
                  ? 'A fizetést megszakítottad.'
                  : qvikStatus === 'TIMEOUT'
                    ? 'Lejárt a fizetési idő.'
                    : 'A bank elutasította a tranzakciót.'}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
              >
                Új próbálkozás
              </button>
            </div>
          ) : (
            // --- Várakozás a fizetésre ---
            <>
              <div className="text-center mb-5">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Fizess a banki alkalmazásoddal
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Összeg: <strong>{formatHuf(qvikSession.amount)} Ft</strong>
                </p>
              </div>

              {/* DESKTOP: QR-kód beolvasásra.
                  A `hidden sm:flex` miatt CSS dönt, nem user-agent szimatolás --
                  így az átméretezés is helyesen viselkedik. */}
              <div className="hidden sm:flex flex-col items-center gap-3">
                <div className="p-4 bg-white rounded-md border border-zinc-200 shadow-sm">
                  <QRCodeSVG
                    value={qvikSession.paymentUrl}
                    size={200}
                    level="M"
                    marginSize={2}
                    title={`Qvik fizetési QR-kód, ${formatHuf(qvikSession.amount)} forint`}
                  />
                </div>
                <p className="text-xs text-zinc-500 text-center max-w-xs">
                  Olvasd be a telefonoddal, és a SimplePay oldalán válaszd a
                  <strong> Qvik fizetést</strong> — a bankod alkalmazása nyílik meg.
                </p>
                <button
                  type="button"
                  onClick={handleCopyQr}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-amber-600"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  {copied ? 'Másolva!' : 'Fizetési link másolása'}
                </button>
              </div>

              {/* MOBIL: deep link gomb -- a QR beolvasása ugyanazon az eszközön
                  nem működne, ezért itt közvetlenül a banki appot nyitjuk. */}
              <div className="sm:hidden space-y-3">
                <a
                  href={qvikSession.paymentUrl}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold"
                >
                  <Smartphone className="w-4 h-4" aria-hidden="true" />
                  Tovább a Qvik fizetéshez
                </a>
                <p className="text-[11px] text-zinc-500 text-center">
                  A SimplePay oldalára visz, ahonnan a banki alkalmazásod nyílik meg.
                  Az összeg és a közlemény már ki lesz töltve.
                </p>
              </div>

              {/* Állapotjelző -- aria-live, hogy a képernyőolvasó is jelezze a váltást. */}
              <div
                aria-live="polite"
                className="mt-5 flex items-center justify-center gap-2 text-[11px] text-zinc-500"
              >
                {isPolling && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" aria-hidden="true" />
                )}
                <span>
                  {isPolling
                    ? 'Várunk a fizetés visszaigazolására...'
                    : pollError || 'Az ellenőrzés szünetel.'}
                </span>
              </div>

            </>
          )}
        </div>
      )}
    </section>
  );
}
