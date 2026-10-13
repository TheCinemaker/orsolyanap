import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* Service worker regisztráció.
 *
 * Csak azért kell, hogy az Android/Chrome felajánlja a főképernyőre tevést:
 * telepítő ablakot csak service workerrel rendelkező oldalhoz ad. A miénk
 * SZÁNDÉKOSAN nem gyorsítótáraz semmit — egy gyorsítótárazó worker a vásár
 * alatt régi étlapot mutatna, amit a látogató telefonján nem tudnánk kijavítani.
 *
 * A hiba itt sosem akaszthatja meg az appot: ha nem sikerül, csak a telepítés
 * felajánlása marad el.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker nem regisztrálható:', err?.message || err);
    });
  });
}
