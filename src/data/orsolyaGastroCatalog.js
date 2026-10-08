// Orsolya-napi Vásár 2026 – strukturált gasztro forrásanyag.
// A kapott flyerek tartalmából készült. A flyerek maguk nem kerülnek az appba.
// Árak és allergén jelölések csak külön, ellenőrzött adat alapján kerüljenek be.

export const ORSOLYA_GASTRO_CATALOG = [
  {
    exhibitorKey: 'koszegfalvi-ovoda',
    exhibitorName: 'Kőszegfalvi Óvoda és Kőszegfalvi Gyermekekért Egyesület',
    items: [
      { name: 'Vadas zsemlegombóccal', category: 'meleg_etel', availableDay: 'saturday', tags: ['vadas', 'magyaros', 'házias'] },
      { name: 'Bolognai spagetti', category: 'meleg_etel', availableDay: 'saturday', tags: ['tészta', 'házias'] },
      { name: 'Tejszínes gombás spagetti', category: 'meleg_etel', availableDay: 'saturday', tags: ['tészta', 'gombás'] },
      { name: 'Házi sütemények', category: 'sutemeny', availableDay: 'saturday', tags: ['édes', 'házi'] }
    ]
  },
  {
    exhibitorKey: 'kozponti-ovoda',
    exhibitorName: 'Központi Óvoda',
    items: [
      { name: 'Babgulyás', category: 'meleg_etel', availableDay: 'saturday', tags: ['leves', 'magyaros'] },
      { name: 'Csülkös-babos káposzta', category: 'meleg_etel', availableDay: 'saturday', tags: ['magyaros', 'házias'] },
      { name: 'Vörösboros marhapörkölt káposztasalátával', category: 'meleg_etel', availableDay: 'sunday', tags: ['pörkölt', 'marha', 'magyaros'] },
      { name: 'Édes és sós sütemények', category: 'sutemeny', availableDay: 'both', tags: ['édes', 'sós', 'házi'] },
      { name: 'Palacsinta', category: 'sutemeny', availableDay: 'both', tags: ['édes', 'házi'] },
      { name: 'Limonádé', category: 'italok', availableDay: 'both', tags: ['frissítő'] },
      { name: 'Tea', category: 'italok', availableDay: 'both', tags: ['forró ital'] }
    ]
  },
  {
    exhibitorKey: 'beszedgyogyitas-alapitvany',
    exhibitorName: 'Beszédgyógyítás Alapítvány',
    location: 'Diáksétány',
    items: [
      { name: 'Töltött káposzta', category: 'meleg_etel', availableDay: 'saturday', tags: ['káposzta', 'magyaros', 'házias'] },
      { name: 'Pizza a’la Beszédjavító', category: 'street_food', availableDay: 'saturday', tags: ['pizza'] },
      { name: 'Házi sütemények', category: 'sutemeny', availableDay: 'both', tags: ['édes', 'házi'] },
      { name: 'Hentesmester káposztája', category: 'meleg_etel', availableDay: 'sunday', tags: ['káposzta', 'házias'] },
      { name: 'Lángos', category: 'street_food', availableDay: 'sunday', tags: ['street food', 'magyaros'] }
    ]
  },
  {
    exhibitorKey: 'koszegi-ifjusagi-tuzoltok',
    exhibitorName: 'Kőszegi Ifjúsági Tűzoltók',
    items: [
      { name: 'Cicege', category: 'street_food', availableDay: 'both', tags: ['magyaros'] },
      { name: 'Velős pirítós', category: 'street_food', availableDay: 'both', tags: ['húsos', 'magyaros'] },
      { name: 'Slambuc', category: 'meleg_etel', availableDay: 'both', tags: ['magyaros', 'házias'] },
      { name: 'Töltött káposzta', category: 'meleg_etel', availableDay: 'both', tags: ['káposzta', 'magyaros', 'házias'] },
      { name: 'Spirál burgonya', category: 'street_food', availableDay: 'both', tags: ['burgonya', 'street food'] },
      { name: 'Házi sütemények', category: 'sutemeny', availableDay: 'both', tags: ['édes', 'házi'] },
      { name: 'Alkoholmentes puncs', category: 'italok', availableDay: 'both', tags: ['forró ital', 'alkoholmentes'] }
    ]
  },
  {
    exhibitorKey: 'balog-iskola',
    exhibitorName: 'Balog Iskola',
    items: [
      { name: 'Jókai bableves házi csipetkével', category: 'meleg_etel', availableDay: 'saturday', tags: ['leves', 'bab', 'magyaros'] },
      { name: 'Vargányás betyárgombóc házi galuskával', category: 'meleg_etel', availableDay: 'saturday', tags: ['vargánya', 'gombás', 'magyaros'] },
      { name: 'Pulled pork szendvics coleslaw salátával', category: 'street_food', availableDay: 'both', tags: ['pulled pork', 'szendvics'] },
      { name: 'Nápolyi pizza', category: 'street_food', availableDay: 'saturday', tags: ['pizza', 'nápolyi'] },
      { name: 'Vörösboros marhapörkölt házi galuskával', category: 'meleg_etel', availableDay: 'sunday', tags: ['pörkölt', 'marha', 'magyaros'] },
      { name: 'Gesztenyés somlói galuska tejszínhabbal', category: 'sutemeny', availableDay: 'both', tags: ['gesztenye', 'desszert'] },
      { name: 'Gesztenyepüré tejszínhabbal', category: 'sutemeny', availableDay: 'both', tags: ['gesztenye', 'desszert'] },
      { name: 'Gesztenyés túrógombóc fahéjas almaszósszal', category: 'sutemeny', availableDay: 'both', tags: ['gesztenye', 'túrógombóc', 'desszert'] },
      { name: 'Kávé', category: 'italok', availableDay: 'both', tags: ['forró ital'] },
      { name: 'Tea', category: 'italok', availableDay: 'both', tags: ['forró ital'] },
      { name: 'Házi szörpök', category: 'italok', availableDay: 'both', tags: ['házi', 'frissítő'] },
      { name: 'Házi sütemények', category: 'sutemeny', availableDay: 'both', tags: ['édes', 'házi'] }
    ]
  }
];
