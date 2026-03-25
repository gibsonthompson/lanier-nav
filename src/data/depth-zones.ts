// ═══════════════════════════════════════════════════════════════
// DEPTH ZONES — placeholder until real bathymetric data is integrated
//
// PRODUCTION PLAN:
// 1. Apply for Navionics Web API key (free) from Garmin dev portal
// 2. Pull SonarChart HD bathymetry tile overlay for Lake Lanier
// 3. OR query USACE ArcGIS contour feature layers
// 4. Store as PostGIS polygons in Supabase
// 5. Compute effective_depth = current_USGS_level - bottom_elevation
// 6. Re-classify zones dynamically every 15 min with USGS update
//
// The fake sample polygons have been REMOVED because they were
// inaccurate and misleading. Better to show nothing than wrong data
// on a navigation app.
// ═══════════════════════════════════════════════════════════════

export interface DepthZone {
  id: string;
  label: string;
  depth_range: string;
  color: string;
  opacity: number;
}

export const DEPTH_ZONES: DepthZone[] = [
  { id: 'very-deep',    label: 'Very deep (60ft+)',    depth_range: '60+',  color: '#0c2461', opacity: 0.45 },
  { id: 'deep',         label: 'Deep (30-60ft)',       depth_range: '30-60', color: '#1a5276', opacity: 0.40 },
  { id: 'moderate',     label: 'Moderate (15-30ft)',    depth_range: '15-30', color: '#2e86c1', opacity: 0.35 },
  { id: 'shallow',      label: 'Shallow (5-15ft)',     depth_range: '5-15',  color: '#85c1e9', opacity: 0.30 },
  { id: 'very-shallow', label: 'Very shallow (<5ft)',  depth_range: '0-5',   color: '#f9e79f', opacity: 0.40 },
  { id: 'exposed',      label: 'Exposed at low pool',  depth_range: 'dry',   color: '#e74c3c', opacity: 0.35 },
];

// Empty feature collection — no fake polygons
// Depth overlay will show nothing until real data is connected
export const DEPTH_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};