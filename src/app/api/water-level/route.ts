/**
 * Water Router — Direct course navigation for Lake Lanier
 * 
 * Boats navigate in straight lines on open water (unlike cars on roads).
 * This provides direct course routing with hazard awareness.
 * 
 * Future: Use real shoreline GeoJSON for land avoidance and channel routing.
 */

import type { Hazard } from '@/data/hazards';

export interface RouteResult {
  path: [number, number][];
  distance_nm: number;
  hazards_nearby: number;
  min_depth_ft: number;
  warnings: string[];
}

function haversineNM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findWaterRoute(
  startLng: number, startLat: number,
  endLng: number, endLat: number,
  hazards: Hazard[], currentWaterLevel: number
): RouteResult {
  const warnings: string[] = [];
  const distance = haversineNM(startLat, startLng, endLat, endLng);

  // Direct course line with intermediate points for smooth rendering
  const steps = Math.max(2, Math.ceil(distance / 0.5)); // point every ~0.5nm
  const path: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    path.push([
      startLng + (endLng - startLng) * t,
      startLat + (endLat - startLat) * t,
    ]);
  }

  // Check hazards near route
  let hazardsNearby = 0;
  const BUFFER = 0.003; // ~300m buffer
  for (const h of hazards) {
    const effectiveDepth = currentWaterLevel - h.elevation_ft;
    if (effectiveDepth < 6) {
      // Check distance from hazard to route line
      for (let i = 0; i < path.length - 1; i++) {
        const dist = pointToSegmentDist(h.lng, h.lat, path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
        if (dist < BUFFER) {
          hazardsNearby++;
          break;
        }
      }
    }
  }

  if (hazardsNearby > 0) {
    warnings.push(`${hazardsNearby} hazard${hazardsNearby > 1 ? 's' : ''} near route — proceed with caution`);
  }

  return { path, distance_nm: distance, hazards_nearby: hazardsNearby, min_depth_ft: 0, warnings };
}

function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.sqrt((px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2);
}