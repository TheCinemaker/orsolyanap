/**
 * Utility function to verify if an exhibitor is KTSZE (Kőszegi Turisztikai Szövetség / Kőszegi Turisztikai és Szépítő Egyesület)
 */
export function isKTSZEExhibitor(exhibitor) {
  if (!exhibitor) return false;
  
  // If passed an object or string ID/name
  const id = String(typeof exhibitor === 'object' ? (exhibitor.id || '') : exhibitor).toLowerCase();
  const name = String(typeof exhibitor === 'object' ? (exhibitor.name || '') : '').toLowerCase();
  
  return (
    id === 'ktsze' ||
    id === '3' ||
    name.includes('turisztikai') ||
    name.includes('ktsze') ||
    name.includes('szépítő')
  );
}
