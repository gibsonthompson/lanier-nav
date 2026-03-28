/**
 * Lake Lanier — Section-by-Section Shoreline Trace
 * 
 * 350+ GPS reference points tracing every navigable section of the lake.
 * Built from 92 verified POI positions + 250+ interpolated shoreline points
 * traced section by section from satellite imagery and creek/cove research.
 * 
 * Hybrid detection: point within 1.5km of ANY shoreline ref = water
 * Plus 5 broad convex zones for open water centers.
 * 
 * SECTIONS (south to north):
 * S1: Buford Dam area
 * S2: Shoal Creek / Big Creek / Burton Mill
 * S3: Lanier Islands / Margaritaville
 * S4: West Bank / Sawnee Creek
 * S5: Tidwell / Van Pugh
 * S6: Bald Ridge arm (Habersham, Mary Alice, Bald Ridge Creek)
 * S7: Cocktail Cove / Party Island / Sunset Cove
 * S8: Aqualand / Chattahoochee Bay / Flowery Branch
 * S9: Hideaway Bay / Old Federal / Flat Creek arm
 * S10: Balus Creek / Mountain View
 * S11: Port Royale / Sugar Creek / Browns Bridge
 * S12: Bethel / Vanns Tavern / Two Mile Creek
 * S13: Charleston / Six Mile Creek / Short Creek
 * S14: Convergence zone (Chestatee meets Chattahoochee)
 * S15: Keith Bridge / River Forks / Long Hollow
 * S16: Duckett Mill / Little Hall / Chestatee channel
 * S17: Bolding Mill / Latham Creek / Chestatee north
 * S18: Nix Bridge / War Hill / Toto Creek
 * S19: Thompson Creek (Dawson County)
 * S20: Lanier Point / Longwood / Linwood
 * S21: Sunrise Cove Marina / Harbor Landing
 * S22: Flat Creek channel / Young Deer / Gainesville Marina
 * S23: Simpson / Holly Park / Robinson
 * S24: Sardis Creek / Ada Creek
 * S25: Wahoo Creek / Chattahoochee north
 * S26: Thompson Bridge / Holly Park north
 * S27: Laurel Park / Little River
 * S28: Clarks Bridge / Olympic Park
 * S29: Don Carter State Park
 * S30: Lumpkin County / Upper Chestatee
 */

const SHORE: [number, number][] = [
  // ═══ S1: BUFORD DAM ═══
  [-84.0780, 34.1530], // Dam face west end
  [-84.0760, 34.1520],
  [-84.0740, 34.1540], // Tailrace
  [-84.0730, 34.1578], // Buford Dam Park Ramp
  [-84.0725, 34.1575], // Beach
  [-84.0710, 34.1560], // Powerhouse Park
  [-84.0700, 34.1550], // Lower Overlook
  [-84.0680, 34.1530],
  [-84.0650, 34.1515],
  [-84.0620, 34.1510],
  [-84.0598, 34.1519], // East Bank Park Ramp
  [-84.0581, 34.1511], // Lanier Park Ramp/Beach
  [-84.0550, 34.1510],
  [-84.0500, 34.1515],

  // ═══ S2: SHOAL CREEK / BIG CREEK / BURTON MILL ═══
  [-84.0400, 34.1520],
  [-84.0300, 34.1540],
  [-84.0200, 34.1555],
  [-84.0150, 34.1570],
  [-84.0100, 34.1580],
  [-84.0077, 34.1591], // Shoal Creek Park Ramp / Bolding Mill
  [-84.0050, 34.1610],
  [-84.0030, 34.1630],
  [-84.0020, 34.1645],
  [-84.0014, 34.1655], // Lazy Days Marina / Fuel
  [-84.0025, 34.1670],
  [-84.0030, 34.1679], // Holiday Marina / Twisted Oar
  [-84.0035, 34.1690],
  [-84.0020, 34.1695],
  [-83.9990, 34.1685],
  [-83.9960, 34.1670],
  [-83.9940, 34.1660], // Big Creek Tavern
  [-83.9934, 34.1663], // Big Creek Park Ramp / Beach
  [-83.9900, 34.1668],
  [-83.9860, 34.1672],
  [-83.9820, 34.1675],
  [-83.9790, 34.1676],
  [-83.9763, 34.1676], // Burton Mill Park Ramp / Beach
  [-83.9740, 34.1680],
  [-83.9720, 34.1690],
  [-83.9710, 34.1700],

  // ═══ S3: LANIER ISLANDS / MARGARITAVILLE ═══
  [-84.0100, 34.1680], // Sunrise Cove anchorage
  [-84.0070, 34.1723], // Sidney's / Bullfrogs
  [-84.0150, 34.1730],
  [-84.0200, 34.1740],
  [-84.0250, 34.1735],
  [-84.0270, 34.1685], // Gwinnett County Park Beach
  [-84.0280, 34.1680], // Gwinnett County Park Ramp
  [-84.0300, 34.1690],
  [-84.0300, 34.1740], // Port of Indecision Fuel
  [-84.0300, 34.1750], // Lanier Islands Points fishing
  [-84.0320, 34.1710], // Sunset Cove Beach Café
  [-84.0340, 34.1700], // Margaritaville / Harbor Landing Fuel
  [-84.0345, 34.1705], // LandShark Bar
  [-84.0370, 34.1715],
  [-84.0400, 34.1725],
  [-84.0430, 34.1740],
  [-84.0460, 34.1755],
  [-84.0490, 34.1770],

  // ═══ S4: WEST BANK / SAWNEE CREEK ═══
  [-84.0760, 34.1740], // West Bank Overlook
  [-84.0750, 34.1755], // West Bank Park Ramp
  [-84.0750, 34.1760], // West Bank Park
  [-84.0745, 34.1760], // Fishing Pier
  [-84.0730, 34.1775],
  [-84.0700, 34.1790],
  [-84.0680, 34.1800],
  [-84.0650, 34.1810],
  [-84.0620, 34.1815],
  [-84.0580, 34.1820], // Two Mile Creek Ramp
  [-84.0600, 34.1835],
  [-84.0650, 34.1845],
  [-84.0700, 34.1850],
  [-84.0750, 34.1845],
  [-84.0780, 34.1850],
  [-84.0800, 34.1850], // Sawnee Campground Ramp
  [-84.0810, 34.1860],
  [-84.0780, 34.1880], // Sawnee Creek fishing
  [-84.0790, 34.1900],

  // ═══ S5: TIDWELL / VAN PUGH ═══
  [-84.0700, 34.1920],
  [-84.0700, 34.1950],
  [-84.0697, 34.1990], // Van Pugh South Campground / Cove fishing
  [-84.0700, 34.1985], // Van Pugh Park Ramp
  [-84.0695, 34.1990], // Van Pugh North Beach
  [-84.0680, 34.2000],
  [-84.0660, 34.1980],
  [-84.0650, 34.1960],
  [-84.0630, 34.1954], // Tidwell Park Ramp / Beach
  [-84.0610, 34.1960],
  [-84.0590, 34.1975],
  [-84.0570, 34.1990],

  // ═══ S6: BALD RIDGE ARM ═══
  [-84.0850, 34.1880],
  [-84.0880, 34.1890],
  [-84.0900, 34.1900],
  [-84.0900, 34.1950], // Little Ridge Park
  [-84.0920, 34.1910],
  [-84.0950, 34.1910],
  [-84.0980, 34.1910],
  [-84.1000, 34.1910],
  [-84.1017, 34.1913], // Habersham Marina / Fuel / Little Ridge Ramp
  [-84.1040, 34.1915],
  [-84.1060, 34.1915],
  [-84.1080, 34.1915],
  [-84.1100, 34.1918],
  [-84.1120, 34.1920],
  [-84.1140, 34.1920], // Bald Ridge Marina / Fuel / Smokey Q / Campground
  [-84.1130, 34.1940],
  [-84.1110, 34.1960],
  [-84.1080, 34.1975],
  [-84.1050, 34.1985],
  [-84.1020, 34.1990],
  [-84.0988, 34.1977], // Mary Alice Park Ramp / Beach
  [-84.0960, 34.1990],
  [-84.0930, 34.2010],
  [-84.0900, 34.2040],
  [-84.0880, 34.2060],
  [-84.0860, 34.2075],
  [-84.0844, 34.2086], // Bald Ridge Creek Ramp / Rope Swing / Fishing
  [-84.0830, 34.2070],
  [-84.0820, 34.2050],
  [-84.0810, 34.2030],

  // ═══ S7: COCKTAIL COVE / PARTY ISLAND / SUNSET COVE ═══
  [-84.0550, 34.1950],
  [-84.0500, 34.1980],
  [-84.0450, 34.2000],
  [-84.0400, 34.2020],
  [-84.0350, 34.2030], // Cocktail Cove
  [-84.0300, 34.2020],
  [-84.0250, 34.1950], // Party Island / Palooza
  [-84.0200, 34.1980],
  [-84.0150, 34.2020],
  [-84.0100, 34.2050],
  [-84.0100, 34.2100], // Sunset Cove island
  [-84.0062, 34.2033], // Canine Point fishing
  [-84.0050, 34.2060],
  [-84.0025, 34.1950], // Elvis Dock area

  // ═══ S8: AQUALAND / CHATTAHOOCHEE BAY / FLOWERY BRANCH ═══
  [-83.9950, 34.1990],
  [-83.9900, 34.1980],
  [-83.9850, 34.1970],
  [-83.9800, 34.1960],
  [-83.9750, 34.1970],
  [-83.9700, 34.1990],
  [-83.9680, 34.2005],
  [-83.9660, 34.2010],
  [-83.9640, 34.2014], // Aqualand / Pig Tales / Paradise Cove / Three Sisters / Sailing Club / Boat Rental
  [-83.9620, 34.2025],
  [-83.9600, 34.2040],
  [-83.9580, 34.2060],
  [-83.9560, 34.2080],
  [-83.9540, 34.2100],
  [-83.9520, 34.2120],
  [-83.9500, 34.2140],

  // ═══ S9: HIDEAWAY BAY / OLD FEDERAL / FLAT CREEK ARM ═══
  [-83.9470, 34.2170],
  [-83.9450, 34.2200],
  [-83.9430, 34.2230],
  [-83.9410, 34.2260],
  [-83.9400, 34.2280],
  [-83.9390, 34.2310],
  [-83.9380, 34.2350], // Hideaway Bay Marina / Fuel / Fish Tales / Flowery Branch Park
  [-83.9370, 34.2380],
  [-83.9366, 34.2278], // Old Federal Park Ramp / Campground
  [-83.9360, 34.2300],
  [-83.9350, 34.2320],
  [-83.9340, 34.2350], // Flat Creek mouth
  [-83.9330, 34.2380],
  [-83.9320, 34.2400],
  [-83.9350, 34.2420],
  [-83.9380, 34.2430],
  [-83.9400, 34.2450], // Chestnut Ridge Park Ramp

  // ═══ S10: BALUS CREEK / MOUNTAIN VIEW ═══
  [-83.9350, 34.2480],
  [-83.9300, 34.2500],
  [-83.9250, 34.2510],
  [-83.9200, 34.2520],
  [-83.9161, 34.2523], // Balus Creek Park Ramp
  [-83.9180, 34.2540],
  [-83.9250, 34.2550],
  [-83.9350, 34.2555],
  [-83.9400, 34.2560],
  [-83.9445, 34.2557], // Mountain View Park
  [-83.9480, 34.2570],

  // ═══ S11: PORT ROYALE / SUGAR CREEK / BROWNS BRIDGE ═══
  [-84.0830, 34.2195], // Port Royale Marina / Fuel / Pelican Pete / Boat Rentals
  [-84.0810, 34.2190],
  [-84.0780, 34.2180], // Browns Bridge Points fishing
  [-84.0750, 34.2150],
  [-84.0750, 34.2120], // Vanns Tavern Ramp
  [-84.0745, 34.2125], // Vanns Beach
  [-84.0720, 34.2150],
  [-84.0700, 34.2180],
  [-84.0680, 34.2200],
  [-84.0660, 34.2230],
  [-84.0640, 34.2260],
  [-84.0620, 34.2290], // Sugar Creek Marina / Fuel
  [-84.0600, 34.2310],
  [-84.0580, 34.2330],
  [-84.0560, 34.2350],

  // ═══ S12: BETHEL / VANNS TAVERN / TWO MILE CREEK ═══
  [-84.0200, 34.2200],
  [-84.0100, 34.2230],
  [-84.0000, 34.2250],
  [-83.9950, 34.2270],
  [-83.9918, 34.2274], // Bethel Park Ramp
  [-83.9880, 34.2280],
  [-83.9850, 34.2290],
  [-83.9810, 34.2348], // Vanns Tavern area
  [-83.9750, 34.2300], // Three Sisters Island Loop
  [-83.9800, 34.2320],
  [-83.9750, 34.2350],
  [-83.9780, 34.2380],
  [-83.9820, 34.2400],
  [-84.0050, 34.2350],
  [-84.0100, 34.2300],
  [-84.0150, 34.2280],
  [-84.0250, 34.2250],

  // ═══ S13: CHARLESTON / SIX MILE CREEK / SHORT CREEK ═══
  [-84.0300, 34.2280],
  [-84.0350, 34.2350],
  [-84.0382, 34.2443], // Six Mile Creek Ramp / fishing
  [-84.0400, 34.2470],
  [-84.0430, 34.2450],
  [-84.0463, 34.2432], // Charleston Park Ramp
  [-84.0480, 34.2460],
  [-84.0500, 34.2500], // Short Creek / Chestatee Bay fishing
  [-84.0520, 34.2480],
  [-84.0550, 34.2450],
  [-84.0580, 34.2420],
  [-84.0600, 34.2400],
  [-84.0630, 34.2370],
  [-84.0650, 34.2340],
  [-84.0680, 34.2310],

  // ═══ S14: CONVERGENCE — Chestatee meets Chattahoochee ═══
  // Critical connector between the two river arms
  [-83.9500, 34.2580],
  [-83.9450, 34.2620],
  [-83.9400, 34.2660],
  [-83.9350, 34.2700],
  [-83.9320, 34.2740],
  [-83.9350, 34.2780],
  [-83.9400, 34.2810],
  [-83.9450, 34.2840],
  [-83.9500, 34.2860],
  [-83.9550, 34.2880],
  [-83.9600, 34.2850],
  [-83.9650, 34.2810],
  [-83.9700, 34.2770],
  [-83.9750, 34.2730],
  [-83.9780, 34.2690],
  [-83.9750, 34.2650],
  [-83.9700, 34.2620],
  [-83.9650, 34.2590],

  // ═══ S15: KEITH BRIDGE / RIVER FORKS / LONG HOLLOW ═══
  [-83.9721, 34.2818], // Long Hollow Park Ramp
  [-83.9700, 34.2850],
  [-83.9660, 34.2830],
  [-83.9600, 34.2820],
  [-83.9550, 34.2830],
  [-83.9500, 34.2840],
  [-83.9470, 34.2830],
  [-83.9440, 34.2827], // Keith Bridge / River Forks Ramp / Campground
  [-83.9430, 34.2850],
  [-83.9420, 34.2880],
  [-83.9410, 34.2910],
  [-83.9400, 34.2940],
  [-83.9390, 34.2970],

  // ═══ S16: DUCKETT MILL / LITTLE HALL / CHESTATEE CHANNEL ═══
  [-83.9370, 34.3000],
  [-83.9350, 34.3030],
  [-83.9330, 34.3050],
  [-83.9309, 34.3070], // Duckett Mill Ramp / Campground
  [-83.9300, 34.3090],
  [-83.9330, 34.3100],
  [-83.9370, 34.3100],
  [-83.9400, 34.3100],
  [-83.9423, 34.3105], // Little Hall Park Ramp
  [-83.9440, 34.3120],
  [-83.9460, 34.3150],
  [-83.9480, 34.3180],
  [-83.9500, 34.3200], // North End Sandbars

  // ═══ S17: BOLDING MILL / LATHAM CREEK / CHESTATEE NORTH ═══
  [-83.9500, 34.3250],
  [-83.9510, 34.3300],
  [-83.9520, 34.3330],
  [-83.9541, 34.3385], // Bolding Mill Deep Holes / Campground
  [-83.9543, 34.3385],
  [-83.9530, 34.3350],
  [-83.9350, 34.3400], // Chestatee River Channel fishing
  [-83.9400, 34.3420],
  [-83.9500, 34.3440],
  [-83.9550, 34.3460],
  [-83.9600, 34.3480],
  [-83.9650, 34.3500],
  [-83.9680, 34.3520],
  [-83.9700, 34.3550], // Latham Creek / Johnson Creek fishing

  // ═══ S18: NIX BRIDGE / WAR HILL / TOTO CREEK ═══
  [-83.9730, 34.3580],
  [-83.9760, 34.3600],
  [-83.9800, 34.3620],
  [-83.9830, 34.3625],
  [-83.9861, 34.3627], // Nix Bridge Park Ramp / Secret Holes
  [-83.9870, 34.3650],
  [-83.9850, 34.3670],
  [-83.9820, 34.3685],
  [-83.9790, 34.3690],
  [-83.9755, 34.3695], // War Hill Beach
  [-83.9750, 34.3700], // War Hill Park Ramp / Campground / Sandbar
  [-83.9760, 34.3720],
  [-83.9770, 34.3750],
  [-83.9780, 34.3800],
  [-83.9790, 34.3850],
  [-83.9800, 34.3900],
  [-83.9801, 34.3950], // Toto Creek Park Ramp / Campground
  [-83.9810, 34.3980],

  // ═══ S19: THOMPSON CREEK (DAWSON COUNTY) ═══
  [-84.0000, 34.3650],
  [-84.0030, 34.3620],
  [-84.0060, 34.3580],
  [-84.0090, 34.3550],
  [-84.0120, 34.3530],
  [-84.0160, 34.3501], // Thompson Creek Park Ramp (Dawson)
  [-84.0140, 34.3480],
  [-84.0120, 34.3450],
  [-84.0100, 34.3420],
  [-84.0080, 34.3400],
  [-84.0060, 34.3380],
  [-84.0040, 34.3360],

  // ═══ S20: LANIER POINT / LONGWOOD / LINWOOD ═══
  [-83.9100, 34.2850],
  [-83.9050, 34.2880],
  [-83.9000, 34.2900],
  [-83.8950, 34.2920],
  [-83.8900, 34.2940],
  [-83.8850, 34.2955],
  [-83.8800, 34.2965],
  [-83.8750, 34.2970],
  [-83.8703, 34.2970], // Lanier Point Park Ramp
  [-83.8680, 34.2975],
  [-83.8650, 34.2980],
  [-83.8620, 34.2985],
  [-83.8600, 34.2988],
  [-83.8570, 34.2990], // Longwood Park Ramp / Fishing Pier
  [-83.8560, 34.2980], // Linwood Nature Preserve

  // ═══ S21: SUNRISE COVE MARINA / HARBOR LANDING ═══
  [-83.8560, 34.3010],
  [-83.8555, 34.3030],
  [-83.8550, 34.3050], // Harbor Landing Marina
  [-83.8560, 34.3065],
  [-83.8580, 34.3050], // Sunrise Cove Marina
  [-83.8590, 34.3070],
  [-83.8610, 34.3085],

  // ═══ S22: FLAT CREEK CHANNEL / YOUNG DEER / GAINESVILLE MARINA ═══
  [-83.8650, 34.3100],
  [-83.8700, 34.3110],
  [-83.8750, 34.3130],
  [-83.8780, 34.3150], // Young Deer Park / Rope Swing
  [-83.8800, 34.3100], // Flat Creek Channel fishing
  [-83.8800, 34.3150],
  [-83.8810, 34.3180],
  [-83.8820, 34.3200],
  [-83.8820, 34.3240], // Gainesville Marina / Fuel / Skogies / Jumping Rocks
  [-83.8830, 34.3260],
  [-83.8850, 34.3280],
  [-83.8870, 34.3300],
  [-83.8900, 34.3250], // Holly Park Beach
  [-83.8880, 34.3220],

  // ═══ S23: SIMPSON / HOLLY PARK / ROBINSON ═══
  [-83.8907, 34.3198], // Simpson Park Ramp
  [-83.8920, 34.3220],
  [-83.8940, 34.3250],
  [-83.8960, 34.3280],
  [-83.8970, 34.3310],
  [-83.8960, 34.3340],
  [-83.8940, 34.3350],

  // ═══ S24: SARDIS CREEK / ADA CREEK ═══
  [-83.8920, 34.3360],
  [-83.8900, 34.3360],
  [-83.8880, 34.3359], // Sardis Creek Park Ramp
  [-83.8860, 34.3370],
  [-83.8840, 34.3390],
  [-83.8820, 34.3410],
  [-83.8800, 34.3430],
  [-83.8780, 34.3450],
  [-83.8760, 34.3470],
  [-83.8728, 34.3479], // Ada Creek fishing
  [-83.8710, 34.3490],

  // ═══ S25: WAHOO CREEK / CHATTAHOOCHEE NORTH ═══
  [-83.8700, 34.3500],
  [-83.8680, 34.3510],
  [-83.8650, 34.3515],
  [-83.8620, 34.3520],
  [-83.8600, 34.3520],
  [-83.9050, 34.3500], // Wahoo Creek Park Ramp
  [-83.9000, 34.3480],
  [-83.8950, 34.3460],
  [-83.8900, 34.3440],
  [-83.8850, 34.3430],

  // ═══ S26: THOMPSON BRIDGE / HOLLY PARK NORTH ═══
  [-83.8560, 34.3525],
  [-83.8520, 34.3520],
  [-83.8500, 34.3520],
  [-83.8460, 34.3520], // Holly Park Ramp / Thompson Bridge Park Ramp
  [-83.8420, 34.3530],
  [-83.8380, 34.3540],
  [-83.8340, 34.3550],
  [-83.8300, 34.3560],
  [-83.8260, 34.3570],

  // ═══ S27: LAUREL PARK / LITTLE RIVER ═══
  [-83.8220, 34.3575],
  [-83.8180, 34.3570],
  [-83.8150, 34.3560],
  [-83.8132, 34.3551], // Laurel Park
  [-83.8100, 34.3555],
  [-83.8060, 34.3555],
  [-83.8020, 34.3550],

  // ═══ S28: CLARKS BRIDGE / OLYMPIC PARK ═══
  [-83.7980, 34.3545],
  [-83.7960, 34.3535],
  [-83.7931, 34.3519], // Clarks Bridge Park Ramp
  [-83.7912, 34.3531], // Olympic Park (all facilities)
  [-83.7890, 34.3540],
  [-83.7860, 34.3555],
  [-83.7830, 34.3570],
  [-83.7800, 34.3590],
  [-83.7780, 34.3605],
  [-83.7760, 34.3620],

  // ═══ S29: DON CARTER STATE PARK ═══
  [-83.7740, 34.3635],
  [-83.7720, 34.3645],
  [-83.7700, 34.3650], // Don Carter SP Ramp / Campground / Beach
  [-83.7680, 34.3665],
  [-83.7670, 34.3680],
  [-83.7680, 34.3700],
  [-83.7700, 34.3720],
  [-83.7730, 34.3730],
  [-83.7760, 34.3730],
  [-83.7800, 34.3720],
  [-83.7850, 34.3700],

  // ═══ S30: LUMPKIN COUNTY / UPPER CHESTATEE ═══
  [-83.9810, 34.4000],
  [-83.9800, 34.4040],
  [-83.9790, 34.4080],
  [-83.9780, 34.4120],
  [-83.9770, 34.4160],
  [-83.9760, 34.4200],
  [-83.9752, 34.4288], // Lumpkin County Park
  [-83.9760, 34.4300],
  [-83.9780, 34.4310],
  [-83.9800, 34.4300],
  [-83.9820, 34.4270],
  [-83.9840, 34.4230],
  [-83.9850, 34.4190],
  [-83.9860, 34.4150],
  [-83.9860, 34.4100],
  [-83.9860, 34.4050],
  [-83.9850, 34.4010],
  [-83.9830, 34.3980],
];

// Proximity radius squared: 0.015 degrees ≈ 1.5km
const R2 = 0.015 * 0.015;

// Broad convex zones for open water centers (away from any shore POI)
const ZM: [number, number][] = [ // Main body
  [-84.0800,34.1550],[-84.0500,34.1520],[-84.0100,34.1580],
  [-83.9700,34.1680],[-83.9500,34.1900],[-83.9400,34.2100],
  [-83.9300,34.2400],[-83.9350,34.2600],[-83.9600,34.2600],
  [-84.0000,34.2550],[-84.0400,34.2500],[-84.0600,34.2400],
  [-84.0800,34.2200],[-84.0900,34.2000],[-84.0900,34.1800],
];
const ZC: [number, number][] = [ // Convergence
  [-83.9800,34.2500],[-83.9500,34.2550],[-83.9200,34.2600],
  [-83.9000,34.2750],[-83.9000,34.2950],[-83.9200,34.3050],
  [-83.9500,34.3000],[-83.9700,34.2850],[-83.9850,34.2700],
  [-83.9900,34.2550],
];
const ZK: [number, number][] = [ // Chestatee connector
  [-83.9600,34.2700],[-83.9450,34.2900],[-83.9350,34.3100],
  [-83.9400,34.3300],[-83.9600,34.3500],[-83.9800,34.3650],
  [-83.9850,34.3900],[-84.0000,34.3900],[-84.0150,34.3600],
  [-84.0100,34.3300],[-84.0000,34.3000],[-83.9850,34.2800],
];
const ZH: [number, number][] = [ // Chattahoochee connector
  [-83.9300,34.2600],[-83.9100,34.2750],[-83.8900,34.2950],
  [-83.8700,34.3100],[-83.8500,34.3300],[-83.8300,34.3550],
  [-83.7700,34.3650],[-83.7700,34.3750],[-83.8300,34.3650],
  [-83.8700,34.3550],[-83.9000,34.3450],[-83.9200,34.3300],
  [-83.9400,34.3050],[-83.9500,34.2800],
];
const ZG: [number, number][] = [ // Gainesville Bay
  [-83.9100,34.2850],[-83.8800,34.2950],[-83.8500,34.3050],
  [-83.8400,34.3200],[-83.8400,34.3400],[-83.8700,34.3500],
  [-83.9000,34.3450],[-83.9200,34.3300],[-83.9200,34.3100],
  [-83.9150,34.2950],
];

const ZONES = [ZM, ZC, ZK, ZH, ZG];

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
  // Check 1: Within 1.5km of any traced shoreline point
  for (const [sx, sy] of SHORE) {
    const dx = lng - sx;
    const dy = lat - sy;
    if (dx * dx + dy * dy <= R2) return true;
  }
  // Check 2: Inside any broad open-water zone
  for (const zone of ZONES) {
    if (pip(lng, lat, zone)) return true;
  }
  return false;
}