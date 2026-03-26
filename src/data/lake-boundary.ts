/**
 * Lake Lanier Navigable Water Zones
 * 
 * Multiple overlapping convex zones that together cover ALL navigable water.
 * Each zone extends ~500m beyond known shoreline POIs for margin.
 * A point is "on water" if it falls inside ANY zone.
 * 
 * Built from 156 verified GPS shoreline positions.
 * Format: [lng, lat][]
 */

// Zone 1: MAIN BODY SOUTH — Dam to Lanier Islands / Holiday area  
const Z1: [number, number][] = [
  [-84.0800, 34.1480], // Dam west (extended)
  [-84.0450, 34.1470], // Dam center
  [-84.0200, 34.1500], // Dam east
  [-84.0000, 34.1550], // East Bank extended
  [-83.9900, 34.1600], // Shoal Creek
  [-83.9850, 34.1700], // Holiday approach
  [-83.9900, 34.1750], // Big Creek
  [-84.0080, 34.1780], // Legacy Lodge
  [-84.0400, 34.1780], // Margaritaville north
  [-84.0500, 34.1750], // North of islands
  [-84.0700, 34.1720], // Tidwell south  
  [-84.0800, 34.1600], // West shore
];

// Zone 2: MAIN BODY CENTRAL — Wide coverage from islands to Browns Bridge
const Z2: [number, number][] = [
  [-84.0900, 34.1750], // SW corner (overlap with Z1)
  [-84.0500, 34.1700], // South
  [-84.0000, 34.1750], // SE
  [-83.9500, 34.1900], // East (toward Aqualand)
  [-83.9350, 34.2050], // Aqualand area  
  [-83.9250, 34.2200], // Hideaway Bay
  [-83.9200, 34.2400], // Flat Creek
  [-83.9300, 34.2600], // North (Balus Creek)
  [-83.9600, 34.2600], // NE
  [-84.0000, 34.2550], // Bethel / Vanns Tavern
  [-84.0400, 34.2500], // Two Mile Creek
  [-84.0600, 34.2500], // Charleston / Six Mile
  [-84.0800, 34.2350], // Port Royale extended
  [-84.0900, 34.2200], // Sugar Creek
  [-84.0950, 34.2050], // Mary Alice approach
  [-84.0900, 34.1850], // West shore
];

// Zone 3: BALD RIDGE ARM — Southwest arm (wide)
const Z3: [number, number][] = [
  [-84.0800, 34.1800], // Entry (overlap with Z2)
  [-84.0900, 34.1830],
  [-84.1000, 34.1850],
  [-84.1100, 34.1880],
  [-84.1200, 34.1900], // Bald Ridge extended west
  [-84.1200, 34.1970], // Bald Ridge north
  [-84.1050, 34.2020], // Mary Alice
  [-84.0950, 34.2050],
  [-84.0850, 34.2120], // Bald Ridge Creek ramp  
  [-84.0800, 34.2000],
  [-84.0780, 34.1900],
];

// Zone 4: CHESTATEE ARM — Northwestern river arm (generous width)
const Z4: [number, number][] = [
  [-83.9550, 34.2550], // South entry (overlaps Z2)
  [-83.9400, 34.2700],
  [-83.9350, 34.2850], // Keith Bridge
  [-83.9250, 34.3050],
  [-83.9200, 34.3150], // Little Hall
  [-83.9250, 34.3300],
  [-83.9400, 34.3450], // Bolding Mill
  [-83.9600, 34.3550],
  [-83.9700, 34.3650], // Nix Bridge
  [-83.9700, 34.3750], // War Hill
  [-83.9750, 34.3850],
  [-83.9780, 34.4000], // Toto Creek extended  
  [-83.9950, 34.4000],
  [-84.0100, 34.3800],
  [-84.0200, 34.3600], // Thompson Creek
  [-84.0200, 34.3400],
  [-84.0150, 34.3200],
  [-84.0050, 34.3000],
  [-83.9900, 34.2800],
  [-83.9800, 34.2700], // Long Hollow
  [-83.9700, 34.2600],
];

// Zone 5: CHATTAHOOCHEE ARM — Northeastern river arm (wide)
const Z5: [number, number][] = [
  [-83.9350, 34.2500], // South entry (overlaps Z2)
  [-83.9150, 34.2650],
  [-83.9000, 34.2800],
  [-83.8800, 34.2950],
  [-83.8650, 34.3100], // Robinson area
  [-83.8500, 34.3250],
  [-83.8400, 34.3400],
  [-83.8300, 34.3550], // Thompson Bridge extended
  [-83.8100, 34.3600], // Little River
  [-83.7850, 34.3580], // Clarks Bridge / Olympic
  [-83.7650, 34.3600], // Don Carter approach
  [-83.7600, 34.3700], // Don Carter extended NE
  [-83.7750, 34.3750], // North shore
  [-83.8000, 34.3700],
  [-83.8200, 34.3660],
  [-83.8400, 34.3630],
  [-83.8700, 34.3550],
  [-83.9000, 34.3500],
  [-83.9200, 34.3400],
  [-83.9350, 34.3200],
  [-83.9450, 34.3000],
  [-83.9500, 34.2800],
  [-83.9450, 34.2600],
];

// Zone 6: CONVERGENCE — Where arms meet (generous overlap)
const Z6: [number, number][] = [
  [-84.0000, 34.2400],
  [-83.9600, 34.2450],
  [-83.9300, 34.2500],
  [-83.9100, 34.2650],
  [-83.9100, 34.2900],
  [-83.9300, 34.3000],
  [-83.9500, 34.2950],
  [-83.9700, 34.2850],
  [-83.9900, 34.2700],
  [-84.0050, 34.2550],
];

// Zone 7: GAINESVILLE BAY — Wide area near Gainesville
const Z7: [number, number][] = [
  [-83.9100, 34.2800],
  [-83.8800, 34.2900],
  [-83.8500, 34.3000],
  [-83.8400, 34.3150],
  [-83.8400, 34.3350],
  [-83.8600, 34.3500],
  [-83.9000, 34.3450],
  [-83.9200, 34.3300],
  [-83.9200, 34.3100],
  [-83.9150, 34.2900],
];

// Zone 8: LUMPKIN COUNTY — Far north past Toto Creek
const Z8: [number, number][] = [
  [-83.9850, 34.3850],
  [-83.9700, 34.3950],
  [-83.9650, 34.4100],
  [-83.9700, 34.4350], // Lumpkin County extended
  [-83.9850, 34.4350],
  [-83.9950, 34.4100],
  [-83.9950, 34.3900],
];

const ALL_ZONES = [Z1, Z2, Z3, Z4, Z5, Z6, Z7, Z8];

function pip(lng: number, lat: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

export function isOnWater(lng: number, lat: number): boolean {
  for (const zone of ALL_ZONES) {
    if (pip(lng, lat, zone)) return true;
  }
  return false;
}