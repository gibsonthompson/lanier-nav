import { NextResponse } from 'next/server';

// USGS Gauge 02334400 — Lake Sidney Lanier at Buford Dam
// Parameter 00062 = Lake/reservoir water surface elevation (ft above NGVD29)
// This is a FREE public API — no API key needed
// Data updates every 15 minutes from the USGS sensor

const USGS_SITE_ID = '02334400';
const PARAM_LAKE_ELEVATION = '00062'; // Reservoir elevation in ft

// USACE CWMS Data API (RADAR) — also free, no key needed
// Provides outflow, inflow, precipitation from Corps operations
const CWMS_BASE = 'https://cwms-data.usace.army.mil/cwms-data';

export async function GET() {
  try {
    // ── 1. Fetch current lake elevation from USGS ──
    // The USGS Instantaneous Values API returns the latest sensor reading
    // NOTE: USGS is migrating to api.waterdata.usgs.gov/ogcapi/ by 2027
    // For now, the legacy endpoint still works perfectly
    const usgsUrl = new URL('https://waterservices.usgs.gov/nwis/iv/');
    usgsUrl.searchParams.set('format', 'json');
    usgsUrl.searchParams.set('sites', USGS_SITE_ID);
    usgsUrl.searchParams.set('parameterCd', PARAM_LAKE_ELEVATION);
    usgsUrl.searchParams.set('siteStatus', 'all');

    const usgsRes = await fetch(usgsUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 900 }, // Cache for 15 min (matches USGS update interval)
    });

    if (!usgsRes.ok) {
      throw new Error(`USGS API returned ${usgsRes.status}`);
    }

    const usgsData = await usgsRes.json();

    // Parse the USGS response structure
    const timeSeries = usgsData?.value?.timeSeries?.[0];
    const latestValue = timeSeries?.values?.[0]?.value?.[0];

    const elevation = latestValue ? parseFloat(latestValue.value) : null;
    const timestamp = latestValue?.dateTime || null;
    const siteName = timeSeries?.sourceInfo?.siteName || 'Lake Sidney Lanier';

    // ── 2. Calculate derived values ──
    const FULL_POOL = 1071.0;
    const belowFullPool = elevation ? FULL_POOL - elevation : null;

    // Determine operational status
    let status: 'normal' | 'low' | 'very_low' | 'critical' = 'normal';
    if (belowFullPool !== null) {
      if (belowFullPool <= 2) status = 'normal';
      else if (belowFullPool <= 5) status = 'low';
      else if (belowFullPool <= 10) status = 'very_low';
      else status = 'critical';
    }

    // ── 3. Build response ──
    return NextResponse.json({
      success: true,
      data: {
        elevation_ft: elevation,
        full_pool_ft: FULL_POOL,
        below_full_pool_ft: belowFullPool ? parseFloat(belowFullPool.toFixed(2)) : null,
        status,
        timestamp,
        site_name: siteName,
        site_id: USGS_SITE_ID,
        source: 'USGS NWIS Instantaneous Values',
        source_url: `https://waterdata.usgs.gov/monitoring-location/USGS-${USGS_SITE_ID}/`,
      },
      // Info about available data sources for future integration
      available_sources: {
        usgs_nwis: {
          description: 'USGS National Water Information System',
          endpoint: 'https://waterservices.usgs.gov/nwis/iv/',
          site_id: USGS_SITE_ID,
          parameters: {
            '00062': 'Lake elevation (ft)',
          },
          update_interval: '15 minutes',
          cost: 'Free — no API key required',
          note: 'Migrating to api.waterdata.usgs.gov by 2027',
        },
        usgs_new_api: {
          description: 'USGS Water Data OGC API (new)',
          endpoint: `https://api.waterdata.usgs.gov/ogcapi/v0/`,
          note: 'New API replacing waterservices. Requires API key for heavy usage (100+ req/hr).',
          cost: 'Free with API key for rate limiting',
        },
        usace_cwms: {
          description: 'USACE Corps Water Management System (RADAR)',
          endpoint: CWMS_BASE,
          provides: ['outflow', 'inflow', 'precipitation', 'generation schedule'],
          cost: 'Free — no API key required',
          swagger: `${CWMS_BASE}/swagger-ui.html`,
        },
        usace_arcgis: {
          description: 'USACE Lake Lanier Navigation Map (ArcGIS)',
          url: 'https://www.arcgis.com/apps/webappviewer/index.html?id=b7ec0d32c7814763a8ac464d24419741',
          provides: [
            'Boat ramp locations with elevation data',
            'All Aids to Navigation (ATONs) / buoy locations',
            'Low water hazard markers',
            'Fish attractor locations',
            'Bridge and powerline clearances',
            'Park boundaries',
          ],
          note: 'Features with known elevation auto-update depth/clearance from USGS gauge hourly',
          cost: 'Free — public ArcGIS web app with REST feature services',
        },
        navionics_web_api: {
          description: 'Navionics/Garmin SonarChart HD Bathymetry',
          endpoint: 'https://webapiv2.navionics.com/',
          provides: ['HD depth contours', 'SonarChart bathymetry', 'Nautical chart overlay'],
          cost: 'Free tier available — request navKey from Garmin developer portal',
          apply_url: 'https://www.garmin.com/en-US/forms/navionics-web-api/',
        },
        noaa_weather: {
          description: 'NOAA Weather API',
          endpoint: 'https://api.weather.gov/',
          provides: ['Wind speed/direction', 'Storm alerts', 'Temperature', 'Precipitation forecast'],
          cost: 'Free — requires User-Agent header with contact info',
        },
        lakelanierwater: {
          description: 'LakeLanierWater.com (community aggregator)',
          url: 'https://lakelanierwater.com/',
          provides: ['Pre-processed elevation', 'Historical charts', 'Year-over-year comparison'],
          note: 'Built by Alexander King — aggregates USGS + USACE data. Good reference but scraping not recommended.',
        },
      },
    });
  } catch (error: any) {
    console.error('Water level fetch error:', error);

    // Return fallback data so the app still works
    return NextResponse.json({
      success: false,
      error: error.message,
      data: {
        elevation_ft: null,
        full_pool_ft: 1071.0,
        below_full_pool_ft: null,
        status: 'unknown',
        timestamp: null,
        site_name: 'Lake Sidney Lanier',
        site_id: USGS_SITE_ID,
        source: 'USGS NWIS (failed to fetch)',
      },
    });
  }
}