# Lanier Nav — Lake Navigation Prototype

Real-time lake navigation for Lake Lanier with live USGS water levels, GPS tracking, water-based navigation, depth maps, hazard markers, and community POIs.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**No API keys needed** — uses CartoDB Dark Matter (free) + MapLibre GL JS (open source) + USGS public API (free).

## Features

### Live water level (USGS)
- Pulls real-time elevation from **USGS gauge 02334400** (Lake Sidney Lanier at Buford Dam)
- Updates every 15 minutes automatically
- Shows elevation, below-full-pool delta, and status indicator (green/amber/red)
- Falls back gracefully if API is unreachable

### GPS tracking
- Click 📡 to start continuous GPS tracking via browser Geolocation API
- Blue pulsing dot shows your live position on the map
- Heading indicator rotates with compass direction
- Speed display in knots, heading in degrees
- **Note**: Works on deployed/localhost with HTTPS or localhost. Desktop browsers will use approximate location.

### Water-based navigation
- Click "Navigate" on any POI to start navigation
- Shows real-time: distance (nautical miles or feet), bearing (degrees + compass), ETA (based on speed)
- Dashed teal route line drawn on map between GPS position and target
- Navigation HUD bar at top of screen
- Click ✕ to end navigation
- **On the water**: GPS provides real heading/speed for accurate ETA. Route is straight-line (direct course) — future: channel-aware routing that avoids hazards and shallow zones.

### Create new pins
- Click 📍 to add a POI (beach, ramp, rope swing, fishing spot, etc.)
- Click 🚨 to report a hazard (submerged tree, rock, shallow area, debris, etc.)
- Map enters crosshair mode → tap to place → fill in type, name, description
- Pins appear immediately on the map
- **Future**: Supabase persistence, photo uploads, moderation queue

### Depth contour overlays
- Color-coded depth zones: deep navy → medium blue → light blue → yellow (shallow) → red (exposed)
- Legend shows current depth ranges adjusted to live water level
- Toggle on/off with 🌊 button

### Hazard markers
- Pulse/highlight based on proximity to water surface at current level
- Click for: severity, elevation, calculated depth below surface, reporter info
- "Confirm" / "Cleared" verification buttons

## Data source reference

| Source | What it provides | Cost | API? |
|--------|-----------------|------|------|
| **USGS NWIS** (gauge 02334400) | Lake elevation every 15 min | Free, no key | Yes — `waterservices.usgs.gov/nwis/iv/` |
| **USGS New API** | Same data, modern OGC format | Free, key for >100 req/hr | Yes — `api.waterdata.usgs.gov/ogcapi/` |
| **USACE CWMS (RADAR)** | Outflow, inflow, precipitation, dam ops | Free, no key | Yes — `cwms-data.usace.army.mil/cwms-data/` |
| **USACE ArcGIS Nav Map** | Buoy/ATON locations, boat ramp elevations, hazard markers, fish attractors, bridge clearances | Free | ArcGIS REST feature services |
| **Navionics Web API** | HD bathymetry (SonarChart), nautical chart overlay | Free tier (request navKey from Garmin) | Yes — `webapiv2.navionics.com` |
| **NOAA Weather API** | Wind, storms, temperature, precipitation forecast | Free (User-Agent header required) | Yes — `api.weather.gov` |
| **LakeLanierWater.com** | Pre-processed elevation, historical data | Free (community site) | Scrape-only |

### How the water level works

The USGS has a sensor at Buford Dam (site 02334400) that records reservoir elevation every 15 minutes. The reading is feet above mean sea level (NGVD29). Full pool is 1,071 ft. The API endpoint is:

```
GET https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02334400&parameterCd=00062
```

Response contains `value.timeSeries[0].values[0].value[0].value` = current elevation. No API key, no auth, no rate limiting for reasonable usage. The app hits this via `/api/water-level` server route with 15-minute cache.

### How depth data will work (production)

The depth contours currently use simplified sample polygons. In production:

1. **Source**: Apply for Navionics Web API key (free) from Garmin developer portal. Their SonarChart HD data covers Lake Lanier with sub-meter bathymetry.
2. **Alternative**: The USACE ArcGIS nav map has contour data in its feature layers. These can be queried via ArcGIS REST API.
3. **Dynamic adjustment**: Store all depth data as absolute elevation (ft above sea level). When the live USGS reading comes in, compute `effective_depth = current_level - bottom_elevation` for every zone. Zones that become < 5ft get re-classified as shallow; zones that become < 0ft get flagged as exposed.

## Architecture

```
src/
├── app/
│   ├── api/water-level/route.ts   # USGS API proxy + data source docs
│   ├── globals.css                 # Dark nautical theme + GPS styles
│   ├── layout.tsx
│   └── page.tsx                    # Full map app (GPS, nav, pins, overlays)
├── data/
│   ├── pois.ts                     # POI types + sample data
│   ├── hazards.ts                  # Hazard types + sample data
│   └── depth-zones.ts              # Depth zone GeoJSON + colors
```

## Stack
- **Frontend**: Next.js 14, React 18, MapLibre GL JS
- **Map tiles**: CartoDB Dark Matter (free, no key)
- **Water data**: USGS NWIS API (free, no key)
- **Future**: Supabase (PostGIS), Navionics API, USACE CWMS API, NOAA Weather API