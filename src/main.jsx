import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

/**
 * Az útvonalat MÉG az importok előtt döntjük el.
 *
 * Mindkét ág `lazy()`, ezért a böngésző csak azt a kódot tölti le, amire
 * tényleg szüksége van. A pultnál beolvasott QR (`/adomany`) így nem húzza
 * magával a teljes alkalmazást -- ott minden lebegő kilobyte másodpercekben
 * jelentkezik a rendezvény túlterhelt mobilhálózatán.
 */
const isDonationRoute = window.location.pathname.startsWith('/adomany')

const App = lazy(() => import('./App.jsx'))
const DonationPage = lazy(() => import('./DonationPage.jsx'))

/** Váz a chunk letöltése alatt -- így nem villan fehér képernyő. */
function Splash() {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<Splash />}>
      {isDonationRoute ? <DonationPage /> : <App />}
    </Suspense>
  </StrictMode>,
)
