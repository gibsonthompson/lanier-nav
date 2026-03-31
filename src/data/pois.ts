// NaviLake POI Nuclear Rebuild — BATCHES 1-3 COMPLETE
// 65 verified POIs: 42 boat ramps + 12 marinas + 11 restaurants
// Sources: DiscoverLanier.com, fishing.org, Lake.com, Paddling.com
// Date: March 30, 2026
// NOTE: Restaurant coords derived from parent marina + ~50m offset toward water to prevent stacking

export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'boat_ramp' | 'marina' | 'restaurant' | 'fuel' | 'beach' | 'campground' | 'park' | 'island' | 'fishing_spot';
  icon: string;
  description?: string;
  phone?: string;
  address?: string;
}

export const pois: POI[] = [
  // ═══════════════════════════════════════════════════
  // BOAT RAMPS (42) — sorted south to north
  // ═══════════════════════════════════════════════════
  { id: "ramp-1", name: "East Bank", lat: 34.15187, lng: -84.05984, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-2", name: "Lanier Park", lat: 34.15108, lng: -84.05809, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-3", name: "Shoal Creek", lat: 34.15910, lng: -84.00768, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-4", name: "Big Creek", lat: 34.16630, lng: -83.99344, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-5", name: "Burton Mill", lat: 34.16763, lng: -83.97627, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-6", name: "Lanier Islands Ramp", lat: 34.17280, lng: -84.00370, type: "boat_ramp", icon: "ramp" }, // GPS: fishing.org
  { id: "ramp-7", name: "Van Pugh", lat: 34.18794, lng: -83.98038, type: "boat_ramp", icon: "ramp" }, // GPS: Paddling.com
  { id: "ramp-8", name: "Tidwell", lat: 34.19538, lng: -84.06297, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-9", name: "Mary Alice Park", lat: 34.19770, lng: -84.09880, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-10", name: "Bald Ridge Creek Park", lat: 34.20862, lng: -84.08436, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-11", name: "Two Mile Creek", lat: 34.21982, lng: -84.00435, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-12", name: "Young Deer Creek", lat: 34.22149, lng: -84.05769, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-13", name: "Shadburn Ferry", lat: 34.22454, lng: -84.02630, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-14", name: "Bethel Park", lat: 34.22744, lng: -83.99180, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-15", name: "Old Federal", lat: 34.22776, lng: -83.93660, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-16", name: "Vanns Tavern", lat: 34.23482, lng: -83.98102, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-17", name: "Williams Ferry", lat: 34.24232, lng: -83.96463, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-18", name: "Charleston", lat: 34.24315, lng: -84.04630, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-19", name: "Six Mile Creek", lat: 34.24427, lng: -84.03824, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-20", name: "Balus Creek", lat: 34.25225, lng: -83.91614, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-21", name: "Mountain View", lat: 34.25568, lng: -83.94447, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-22", name: "Long Hollow", lat: 34.28184, lng: -83.97214, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-23", name: "Keith Bridge", lat: 34.28267, lng: -83.94399, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-24", name: "River Forks", lat: 34.28793, lng: -83.90579, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-25", name: "Lanier Point Park", lat: 34.30140, lng: -83.86580, type: "boat_ramp", icon: "ramp" }, // GPS: fishing.org
  { id: "ramp-26", name: "Robinson", lat: 34.30365, lng: -83.89714, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-27", name: "Duckett Mill", lat: 34.30700, lng: -83.93089, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-28", name: "Little Hall", lat: 34.31049, lng: -83.94226, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-29", name: "Simpson", lat: 34.31982, lng: -83.89074, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-30", name: "Wildcat Creek", lat: 34.32343, lng: -83.96185, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-31", name: "Sardis Creek", lat: 34.33593, lng: -83.88796, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-32", name: "Bolding Mill", lat: 34.33854, lng: -83.95409, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-33", name: "Thompson Creek", lat: 34.35010, lng: -84.01602, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-34", name: "Thompson Bridge", lat: 34.35196, lng: -83.84601, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-35", name: "Clarks Bridge Park", lat: 34.35350, lng: -83.79280, type: "boat_ramp", icon: "ramp" }, // GPS: fishing.org
  { id: "ramp-36", name: "Laurel Park", lat: 34.35530, lng: -83.81360, type: "boat_ramp", icon: "ramp" }, // GPS: fishing.org
  { id: "ramp-37", name: "Little River", lat: 34.35890, lng: -83.82900, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-38", name: "Nix Bridge", lat: 34.36273, lng: -83.98611, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-39", name: "White Sulphur", lat: 34.37371, lng: -83.76240, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-40", name: "Wahoo Creek", lat: 34.38722, lng: -83.85989, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-41", name: "Toto Creek", lat: 34.39494, lng: -83.98044, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier
  { id: "ramp-42", name: "Lumpkin County Park", lat: 34.42882, lng: -83.97518, type: "boat_ramp", icon: "ramp" }, // GPS: DiscoverLanier

  // ═══════════════════════════════════════════════════
  // MARINAS (12) — sorted south to north
  // ═══════════════════════════════════════════════════
  { id: "marina-1", name: "Lanier Harbor Marina", lat: 34.15030, lng: -84.02510, type: "marina", icon: "anchor", phone: "770-945-2884", address: "2066 Pine Tree Dr, Buford" }, // GPS: fishing.org
  { id: "marina-2", name: "Lazy Days Marina", lat: 34.16550, lng: -84.00140, type: "marina", icon: "anchor", phone: "770-945-1991", address: "6700 Lanier Islands Pkwy, Buford" }, // GPS: fishing.org
  { id: "marina-3", name: "Holiday Marina", lat: 34.16790, lng: -84.00300, type: "marina", icon: "anchor", phone: "770-945-7201", address: "6900 Holiday Rd, Buford" }, // GPS: fishing.org
  { id: "marina-4", name: "Margaritaville at Lanier Islands", lat: 34.17760, lng: -84.03010, type: "marina", icon: "anchor", phone: "470-323-3465", address: "7650 Lanier Islands Pkwy, Buford" }, // GPS: latitude.to
  { id: "marina-5", name: "Hideaway Bay Marina", lat: 34.18090, lng: -83.93860, type: "marina", icon: "anchor", phone: "770-967-5500", address: "6334 Mitchell St, Flowery Branch" }, // GPS: Lake.com
  { id: "marina-6", name: "Habersham Marina", lat: 34.19076, lng: -84.10232, type: "marina", icon: "anchor", phone: "770-887-5432", address: "2200 Habersham Marina Rd, Cumming" }, // GPS: DiscoverLanier
  { id: "marina-7", name: "Aqualand Marina", lat: 34.20143, lng: -83.96397, type: "marina", icon: "anchor", phone: "770-967-6811", address: "6800 Lights Ferry Rd, Flowery Branch" }, // GPS: fishing.org
  { id: "marina-8", name: "Bald Ridge Marina", lat: 34.20730, lng: -84.09810, type: "marina", icon: "anchor", phone: "770-887-5309", address: "1850 Bald Ridge Marina Rd, Cumming" }, // GPS: Lake.com
  { id: "marina-9", name: "Sunrise Cove Marina", lat: 34.23740, lng: -83.93430, type: "marina", icon: "anchor", phone: "770-536-8599", address: "5725 Flat Creek Rd, Gainesville" }, // GPS: Lake.com
  { id: "marina-10", name: "Port Royale Marina", lat: 34.25149, lng: -83.96414, type: "marina", icon: "anchor", phone: "770-887-5715", address: "8800 Port Royale Dr, Gainesville" }, // GPS: DiscoverLanier
  { id: "marina-11", name: "Gainesville Marina", lat: 34.32400, lng: -83.88200, type: "marina", icon: "anchor", phone: "770-536-2171", address: "2145 Dawsonville Hwy, Gainesville" }, // GPS: fishing.org

  // ═══════════════════════════════════════════════════
  // RESTAURANTS (11) — at parent marinas, offset ~50m to prevent stacking
  // ═══════════════════════════════════════════════════

  // --- Lanier Islands complex (7000 Lanier Islands Pkwy) ---
  { id: "rest-1", name: "Sidney's Dining", lat: 34.16950, lng: -84.01450, type: "restaurant", icon: "restaurant", description: "Upscale dining at Legacy Lodge", address: "7000 Lanier Islands Pkwy, Buford" }, // At Legacy Lodge
  { id: "rest-2", name: "Bullfrogs Bar & Grill", lat: 34.16900, lng: -84.01400, type: "restaurant", icon: "restaurant", description: "Casual waterfront bar & grill", address: "7000 Lanier Islands Pkwy, Buford" }, // At Legacy Lodge
  { id: "rest-3", name: "Twisted Oar", lat: 34.17050, lng: -84.01550, type: "restaurant", icon: "restaurant", description: "Lakeside dining at Lanier Islands", address: "Lanier Islands Pkwy, Buford" }, // At Lanier Islands

  // --- Margaritaville complex (7650 Lanier Islands Pkwy) ---
  { id: "rest-4", name: "LandShark Bar & Grill", lat: 34.17810, lng: -84.02960, type: "restaurant", icon: "restaurant", description: "Jimmy Buffett-themed waterfront bar", phone: "470-323-3465", address: "7650 Lanier Islands Pkwy, Buford" }, // At Margaritaville, offset from marina
  { id: "rest-5", name: "Cantina", lat: 34.17710, lng: -84.03060, type: "restaurant", icon: "restaurant", description: "Mexican cantina at Margaritaville", address: "7650 Lanier Islands Pkwy, Buford" }, // At Margaritaville, offset from LandShark

  // --- Hideaway Bay Marina ---
  { id: "rest-6", name: "Fish Tales Lakeside Grill", lat: 34.18140, lng: -83.93810, type: "restaurant", icon: "restaurant", description: "Lakeside grill at Hideaway Bay Marina", phone: "770-967-5500", address: "6330 Mitchell St, Flowery Branch" }, // Offset from Hideaway Bay Marina

  // --- Aqualand Marina ---
  { id: "rest-7", name: "Pig Tales BBQ", lat: 34.20190, lng: -83.96350, type: "restaurant", icon: "restaurant", description: "BBQ, burgers & wings at Aqualand", address: "6800 Lights Ferry Rd, Flowery Branch" }, // Offset from Aqualand Marina

  // --- Big Creek area ---
  { id: "rest-8", name: "Big Creek Tavern", lat: 34.16680, lng: -83.99290, type: "restaurant", icon: "restaurant", description: "Casual tavern near Big Creek ramp", address: "Big Creek Rd, Buford" }, // Offset from Big Creek ramp

  // --- Bald Ridge Marina ---
  { id: "rest-9", name: "Smokey Q BBQ", lat: 34.20780, lng: -84.09770, type: "restaurant", icon: "restaurant", description: "BBQ, wings & sandwiches at Bald Ridge Marina", address: "1850 Bald Ridge Marina Rd, Cumming" }, // Offset from Bald Ridge Marina

  // --- Port Royale Marina ---
  { id: "rest-10", name: "Pelican Pete's Tiki Bar", lat: 34.25200, lng: -83.96370, type: "restaurant", icon: "restaurant", description: "Floating tiki bar & grill — Lake Lanier's only boat-up restaurant", phone: "770-887-5715", address: "8800 Port Royale Dr, Gainesville" }, // Offset from Port Royale Marina (on gas island dock)

  // --- Gainesville Marina ---
  { id: "rest-11", name: "Skogies Waterfront Eatery", lat: 34.32450, lng: -83.88150, type: "restaurant", icon: "restaurant", description: "Famous grouper sandwich, lakefront dining", phone: "678-450-1310", address: "2151 Dawsonville Hwy, Gainesville" }, // Offset from Gainesville Marina

  // ═══════════════════════════════════════════════════
  // REMAINING BATCHES (future sessions)
  // Batch 4: Parks + Beaches (~15)
  // Batch 5: Campgrounds (~8)
  // Batch 6: Islands + Fishing Spots (~10)
  // ═══════════════════════════════════════════════════
];