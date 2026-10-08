import React from 'react';

import DonationForm from './components/DonationForm';
import DonationResult from './components/DonationResult';

/**
 * A pultnál kihelyezett QR-kód célpontja.
 *
 * Ez SZÁNDÉKOSAN önálló belépési pont, nem az App.jsx egyik nézete: így a
 * `/adomany` útvonal betöltésekor a böngészőnek nem kell letöltenie a teljes
 * fesztivál-alkalmazást (Leaflet térkép, QR-szkenner, kiállítói katalógus,
 * animációk) ahhoz, hogy valaki beírjon egy összeget és fizessen.
 *
 * A main.jsx már az App importja ELŐTT eldönti, hogy melyik ágra van szükség,
 * ezért a nehéz kód ide be sem kerül.
 *
 * Ez a komponens nem használja az OrsolyaContext-et -- nincs is rá szüksége,
 * a fizetés a saját backendünkkel beszél.
 */
export default function DonationPage() {
  const isResult = window.location.pathname.startsWith('/adomany/visszajelzes');

  if (isResult) {
    return (
      <main className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
        <DonationResult onClose={() => window.location.assign('/')} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-start justify-center p-4 py-8">
      <DonationForm />
    </main>
  );
}
