/**
 * A becsült térkép-pinek újrarendezése egyenletes, 3 méteres osztással.
 *
 *   node scripts/becsult-elhelyezes.mjs --proba
 *   node scripts/becsult-elhelyezes.mjs
 *
 * A standok egyenként kerültek fel, mindegyik a soron következő szabad helyre,
 * így a becsült pinek sorrendje a FELVÉTEL sorrendje lett — nem a sétányé. Ez
 * a szkript az egészet újrarendezi név szerint, a sétány két oldalán,
 * egyenletes 3 méteres osztással.
 *
 * A BEMÉRT PONTOKAT NEM BÁNTJA. Azokat a helyszínen mérték, abból nem szabad
 * egyenletes rácsot csinálni; a becsült helyek viszont kitérnek előlük, hogy
 * két pin ne csússzon egymásra.
 *
 * Mindez ideiglenes: a pénteki körön a bemért pontok ezeket felváltják.
 */
import { env, api, isRealGps, metres } from './lib.mjs';

const dryRun = process.argv.includes('--proba');

/** A sétány két oldala, ahol a sátrak állnak. */
const SAVOK = [16.53893, 16.53951];
const ESZAKI_VEG = 47.39002;
/** 3 méter szélességi fokban: 1 fok ~ 111 320 m. */
const LEPES = 3 / 111320;
/* A kerekites 6 tizedesjegyre megy, nem tobbre: az isRealGps a 6 FOLOTTI
   tizedesjegyet veszi bemert GPS-nek. Het tizedesjeggyel a 31 becsult pin
   bemertnek latszott, es kiesett volna a penteken ellenorizendok kozul --
   eppen abbol a listabol, amiert az egesz megkulonboztetes letezik.
   Hat tizedesjegy 11 centimeteres felbontas, egy 3 meteres osztashoz boven eleg. */

/** Bemért ponttól ennyire ne menjünk közel. */
const KERULES = 2.5;

const db = api(env());
const ex = await db.select('exhibitors', 'select=id,name,coordinates&order=name');

const bemert = ex.filter((x) => isRealGps(x.coordinates));
const becsult = ex.filter((x) => !isRealGps(x.coordinates));

// Felváltva nem, hanem oldalonként egy tömbben: aki végigmegy a sétány egyik
// oldalán, az folyamatos számsort lát, nem minden másodikat.
const elsoSav = Math.ceil(becsult.length / 2);

const foglalt = bemert.map((x) => x.coordinates);
const terv = [];
let n = 0;

for (let savIdx = 0; savIdx < SAVOK.length; savIdx++) {
  const lon = SAVOK[savIdx];
  const mennyi = savIdx === 0 ? elsoSav : becsult.length - elsoSav;
  let lat = ESZAKI_VEG;

  for (let i = 0; i < mennyi; i++) {
    // Bemért pin elől kitérünk, nem ütközünk vele.
    let hely = [Number(lat.toFixed(6)), lon];
    let vedelem = 0;
    while (foglalt.some((c) => metres(hely, c) < KERULES) && vedelem < 60) {
      lat -= LEPES;
      hely = [Number(lat.toFixed(6)), lon];
      vedelem++;
    }
    terv.push({ ex: becsult[n], coords: hely });
    foglalt.push(hely);
    lat -= LEPES;
    n++;
  }
}

console.log('');
console.log(`  ${ex.length} stand: ${bemert.length} bemért (nem nyúlok hozzá), ${becsult.length} becsült`);
console.log(`  Osztás: 3,0 m — ${elsoSav} pin az egyik oldalon, ${becsult.length - elsoSav} a másikon`);
console.log('');

let legkisebb = Infinity;
for (const t of terv) {
  const tav = t.ex.coordinates ? metres(t.coords, t.ex.coordinates) : null;
  console.log(
    `    ${t.ex.name.slice(0, 46).padEnd(48)} ${t.coords[0].toFixed(6)}, ${t.coords[1]}` +
      (tav !== null ? `   (${tav.toFixed(0)} m-t mozdul)` : '')
  );
}

// Ellenorzes: semmi ne csuszzon egymasra
const mind = [...bemert.map((x) => x.coordinates), ...terv.map((t) => t.coords)];
for (let i = 0; i < mind.length; i++) {
  for (let j = i + 1; j < mind.length; j++) {
    const d = metres(mind[i], mind[j]);
    if (d < legkisebb) legkisebb = d;
  }
}
console.log('');
console.log(`  Legközelebbi két pin: ${legkisebb.toFixed(2)} m`);

if (dryRun) {
  console.log('');
  console.log('  Próba volt, semmit nem írtam be.');
  console.log('');
} else {
  for (const t of terv) {
    await db.patch('exhibitors', t.ex.id, { coordinates: t.coords });
  }
  console.log('');
  console.log(`  Beírva: ${terv.length} becsült pin.`);
  console.log('  Következő: node scripts/ellenorzes.mjs');
  console.log('');
}
