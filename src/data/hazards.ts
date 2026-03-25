export type HazardType = 'submerged_tree' | 'rock' | 'shallow' | 'stump_field' | 'debris' | 'no_wake';

export interface Hazard {
  id: string; type: HazardType; lat: number; lng: number;
  description: string; elevation_ft: number; severity: 'low' | 'medium' | 'high';
  reported_by?: string; reported_at?: string;
}

export const HAZARD_CONFIG: Record<HazardType, { label: string; color: string }> = {
  submerged_tree: { label: 'Submerged tree', color: '#ef4444' },
  rock: { label: 'Rock formation', color: '#f97316' },
  shallow: { label: 'Shallow water', color: '#eab308' },
  stump_field: { label: 'Stump field', color: '#dc2626' },
  debris: { label: 'Floating debris', color: '#f59e0b' },
  no_wake: { label: 'No-wake zone', color: '#6366f1' },
};

// NOTE: In production these come from:
// 1. USACE ArcGIS Nav Map (ATONs, low-water hazard markers, obstruction markers)
// 2. Community reports (moderated)
// 3. USACE buoy/marker maintenance reports
// All elevations in ft MSL. Hazard is exposed when lake level <= elevation_ft.

export const SAMPLE_HAZARDS: Hazard[] = [
  // ─── SUBMERGED TREES (Lanier was flooded valley — trees everywhere) ───
  { id: 'h-tree-01', type: 'submerged_tree', lat: 34.1980, lng: -84.0350, description: 'Large submerged hardwood. Top branches at ~1065ft. Visible at low pool. Stay 200ft clear.', elevation_ft: 1065, severity: 'high', reported_by: 'USACE ATON', reported_at: '2026-03-01' },
  { id: 'h-tree-02', type: 'submerged_tree', lat: 34.2280, lng: -84.0380, description: 'Old pine tree top near channel marker. Dangerous at 8ft below full pool.', elevation_ft: 1063, severity: 'medium', reported_by: 'USACE ATON', reported_at: '2026-02-15' },
  { id: 'h-tree-03', type: 'submerged_tree', lat: 34.2120, lng: -84.0550, description: 'Cluster of submerged trees in the cove. Marked seasonally. Extremely dangerous below 1065ft.', elevation_ft: 1064, severity: 'high', reported_by: 'USACE ATON', reported_at: '2026-01-20' },
  { id: 'h-tree-04', type: 'submerged_tree', lat: 34.1870, lng: -84.0600, description: 'Single large tree near the point. Hit by boats multiple times. Needs permanent marker.', elevation_ft: 1066, severity: 'high', reported_by: 'Community', reported_at: '2026-03-10' },
  { id: 'h-tree-05', type: 'submerged_tree', lat: 34.2400, lng: -84.0300, description: 'Submerged tree visible at low water. In the middle of a cove — easy to miss.', elevation_ft: 1062, severity: 'medium', reported_by: 'Community', reported_at: '2026-02-28' },

  // ─── STUMP FIELDS (old roads/foundations from pre-flood) ───
  { id: 'h-stump-01', type: 'stump_field', lat: 34.2150, lng: -84.0200, description: 'Dense stump field from old forest. ~200ft wide across the cove. VERY dangerous at low water. Follow channel markers carefully.', elevation_ft: 1062, severity: 'high', reported_by: 'USACE ATON', reported_at: '2026-01-15' },
  { id: 'h-stump-02', type: 'stump_field', lat: 34.2350, lng: -84.0100, description: 'Old road bed with stumps on both sides. Stay in marked channel. Stumps extend ~100ft each side.', elevation_ft: 1060, severity: 'medium', reported_by: 'USACE ATON', reported_at: '2026-01-15' },
  { id: 'h-stump-03', type: 'stump_field', lat: 34.2500, lng: -83.9600, description: 'Remnant foundation stumps from old homestead. Scattered across 300ft area.', elevation_ft: 1058, severity: 'medium', reported_by: 'USACE ATON', reported_at: '2026-02-01' },

  // ─── ROCKS ───
  { id: 'h-rock-01', type: 'rock', lat: 34.1850, lng: -84.0450, description: 'Granite outcrop just below surface at full pool. Seasonally marked with buoy. Hit by 3+ boats this year.', elevation_ft: 1069, severity: 'high', reported_by: 'USACE ATON', reported_at: '2026-03-15' },
  { id: 'h-rock-02', type: 'rock', lat: 34.2200, lng: -83.9950, description: 'Submerged boulder. Near-surface at current levels. Needs permanent marker.', elevation_ft: 1067, severity: 'high', reported_by: 'Community', reported_at: '2026-03-08' },
  { id: 'h-rock-03', type: 'rock', lat: 34.2060, lng: -84.0800, description: 'Rocky shoal extending from the west bank. Shallow for ~150ft from shore.', elevation_ft: 1066, severity: 'medium', reported_by: 'USACE ATON', reported_at: '2026-02-20' },

  // ─── SHALLOW AREAS ───
  { id: 'h-shallow-01', type: 'shallow', lat: 34.2050, lng: -84.0150, description: 'Sandbar extending from the point. Trim up approaching from south. 3ft at low pool.', elevation_ft: 1068, severity: 'medium', reported_by: 'USACE ATON', reported_at: '2026-03-01' },
  { id: 'h-shallow-02', type: 'shallow', lat: 34.1700, lng: -84.0500, description: 'Shoal area near dam. Drops to 3ft at low pool. Stay in marked channel.', elevation_ft: 1068, severity: 'high', reported_by: 'USACE ATON', reported_at: '2026-01-01' },
  { id: 'h-shallow-03', type: 'shallow', lat: 34.1940, lng: -84.0280, description: 'Shallow approach to Party Island. Under 4ft at current level. Trim up and go slow.', elevation_ft: 1067, severity: 'medium', reported_by: 'Community', reported_at: '2026-03-20' },
  { id: 'h-shallow-04', type: 'shallow', lat: 34.2700, lng: -83.9200, description: 'Upper lake narrows — shallow flats on both sides of channel. Stay centered.', elevation_ft: 1065, severity: 'medium', reported_by: 'USACE ATON', reported_at: '2026-02-01' },

  // ─── NO-WAKE ZONES ───
  { id: 'h-nw-01', type: 'no_wake', lat: 34.1650, lng: -84.0520, description: 'No-wake zone — Holiday Marina entrance. Enforced by GA DNR.', elevation_ft: 1071, severity: 'low', reported_by: 'USACE', reported_at: '2026-01-01' },
  { id: 'h-nw-02', type: 'no_wake', lat: 34.2410, lng: -83.9470, description: 'No-wake zone — Aqualand Marina entrance. Enforced by GA DNR.', elevation_ft: 1071, severity: 'low', reported_by: 'USACE', reported_at: '2026-01-01' },
  { id: 'h-nw-03', type: 'no_wake', lat: 34.1920, lng: -84.1150, description: 'No-wake zone — Bald Ridge Marina entrance. Enforced by GA DNR.', elevation_ft: 1071, severity: 'low', reported_by: 'USACE', reported_at: '2026-01-01' },
  { id: 'h-nw-04', type: 'no_wake', lat: 34.1710, lng: -84.0430, description: 'No-wake zone — Lazy Days Marina entrance. Enforced by GA DNR.', elevation_ft: 1071, severity: 'low', reported_by: 'USACE', reported_at: '2026-01-01' },
  { id: 'h-nw-05', type: 'no_wake', lat: 34.1578, lng: -84.0730, description: 'No-wake zone — Buford Dam restricted area. Federal enforcement.', elevation_ft: 1071, severity: 'low', reported_by: 'USACE', reported_at: '2026-01-01' },
];