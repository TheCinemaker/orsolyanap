import React, { useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, Music2, Utensils, Trophy, ShoppingBasket } from 'lucide-react';
import { useOrsolya } from '../context/OrsolyaContext';

const DAY_LABELS = {
  '2026-10-17': 'Október 17. • Szombat',
  '2026-10-18': 'Október 18. • Vasárnap'
};

const LOCATION_ORDER = ['Fő tér', 'Jurisics vár', 'Civil Ízek Utcája – Diáksétány', 'KÖSZHÁZ – Jurisics vár külső udvar'];

function iconFor(category) {
  if (category === 'gasztro program') return Utensils;
  if (category === 'verseny') return Trophy;
  if (category === 'rendezvény') return ShoppingBasket;
  return Music2;
}

export default function EventProgramBook() {
  const { events, isLoadingData } = useOrsolya();
  const [selectedDay, setSelectedDay] = useState('2026-10-17');

  const dayEvents = useMemo(
    () =>
      events
        .filter((event) => event.event_date === selectedDay)
        .sort((a, b) => {
          const at = a.start_time || '99:99';
          const bt = b.start_time || '99:99';
          return at.localeCompare(bt) || (a.location || '').localeCompare(b.location || '', 'hu');
        }),
    [events, selectedDay]
  );

  const grouped = useMemo(() => {
    const map = new Map();
    LOCATION_ORDER.forEach((location) => map.set(location, []));
    dayEvents.forEach((event) => {
      const key = event.location || 'Egyéb helyszín';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return [...map.entries()].filter(([, items]) => items.length > 0);
  }, [dayEvents]);

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-stone-950 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,.35),transparent_45%)]" />
        <div className="relative px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex items-center gap-2 text-amber-300 text-[11px] font-black uppercase tracking-[0.18em]">
            <CalendarDays className="w-4 h-4" />
            Programfüzet
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">Orsolya-napi Vásár</h1>
          <p className="mt-1 text-sm text-stone-300">2026. október 17–18. • Kőszeg</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
            Ingyenesen látogatható rendezvény
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1.5 border border-stone-200">
        {Object.entries(DAY_LABELS).map(([date, label]) => (
          <button
            key={date}
            type="button"
            onClick={() => setSelectedDay(date)}
            className={`rounded-lg px-3 py-3 text-xs sm:text-sm font-black transition-colors ${selectedDay === date ? 'bg-amber-900 text-white shadow-sm' : 'text-stone-600 hover:bg-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-stone-200 bg-amber-50/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Utensils className="mt-0.5 w-5 h-5 text-amber-800 flex-shrink-0" />
          <div>
            <h2 className="font-black text-stone-900">Civil Ízek Utcája</h2>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-stone-600">
              Civil Főzőverseny és délidőben kóstoló a vár melletti Diáksétányon.
            </p>
          </div>
        </div>
      </div>

      {isLoadingData ? (
        <div className="py-10 text-center text-sm font-bold text-stone-500">Programok betöltése...</div>
      ) : grouped.length === 0 ? (
        <div className="py-10 text-center text-sm font-bold text-stone-500">Erre a napra nincs program.</div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([location, items]) => (
            <section key={location} className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-stone-900 text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-300" />
                <h2 className="font-black text-sm">{location}</h2>
              </div>
              <div className="divide-y divide-stone-100">
                {items.map((event) => {
                  const Icon = iconFor(event.category);
                  return (
                    <article key={event.id} className="px-4 py-4 sm:px-5 flex gap-3">
                      <div className="w-16 sm:w-20 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-amber-900 font-black text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          {event.start_time?.slice(0, 5) || '—'}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 mt-0.5 text-stone-500 flex-shrink-0" />
                          <h3 className="font-black text-stone-900 text-sm sm:text-base">{event.title}</h3>
                        </div>
                        {event.performer && event.performer !== event.title && (
                          <p className="mt-1 text-sm font-bold text-amber-900">{event.performer}</p>
                        )}
                        {event.description && event.description !== 'Zenei program' && (
                          <p className="mt-1 text-xs sm:text-sm text-stone-500 leading-relaxed">{event.description}</p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
