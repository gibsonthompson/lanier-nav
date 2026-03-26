/**
 * Water Router — A* pathfinding on Lake Lanier's real navigable water
 * 
 * Uses the actual lake boundary polygon (traced from 156 verified shoreline POIs)
 * to build a navigable grid. A* finds paths that stay on water and avoid land.
 */

import type { Hazard } from '@/data/hazards';
import { isOnWater } from '@/data/lake-boundary';

export interface RouteResult {
  path: [number, number][];
  distance_nm: number;
  hazards_nearby: number;
  min_depth_ft: number;
  warnings: string[];
}

// Grid resolution: ~150m per cell (0.0015 degrees) — good balance of accuracy vs speed
const GRID_RES = 0.0015;
const HAZARD_BUFFER = 0.003; // ~300m buffer around hazards

// Lake bounding box (from POI analysis)
const BOUNDS = {
  minLng: -84.120, maxLng: -83.765,
  minLat: 34.148, maxLat: 34.400,
};

function haversineNM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Build navigable grid with water/land classification
function buildGrid(hazards: Hazard[], waterLevel: number) {
  const cols = Math.ceil((BOUNDS.maxLng - BOUNDS.minLng) / GRID_RES);
  const rows = Math.ceil((BOUNDS.maxLat - BOUNDS.minLat) / GRID_RES);
  
  // Create flat array for speed (row-major)
  const navigable = new Uint8Array(rows * cols);
  const cost = new Float32Array(rows * cols);
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lng = BOUNDS.minLng + c * GRID_RES;
      const lat = BOUNDS.minLat + r * GRID_RES;
      const idx = r * cols + c;
      
      if (isOnWater(lng, lat)) {
        navigable[idx] = 1;
        cost[idx] = 1.0;
        
        // Add hazard cost
        for (const h of hazards) {
          const dlng = lng - h.lng;
          const dlat = lat - h.lat;
          const dist = Math.sqrt(dlng * dlng + dlat * dlat);
          if (dist < HAZARD_BUFFER) {
            const depth = waterLevel - h.elevation_ft;
            if (depth < 6) {
              cost[idx] += (1 - dist / HAZARD_BUFFER) * 20;
            }
          }
        }
      }
    }
  }
  
  return { navigable, cost, rows, cols };
}

// A* pathfinding with binary heap priority queue
function astar(
  navigable: Uint8Array, cost: Float32Array,
  rows: number, cols: number,
  sr: number, sc: number, er: number, ec: number
): number[] | null {
  const size = rows * cols;
  const g = new Float32Array(size).fill(Infinity);
  const parent = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);
  
  const key = (r: number, c: number) => r * cols + c;
  const startIdx = key(sr, sc);
  const endIdx = key(er, ec);
  
  if (!navigable[startIdx] || !navigable[endIdx]) return null;
  
  g[startIdx] = 0;
  
  // Simple priority queue (heap would be faster but this works for our grid size)
  const open: { idx: number; f: number }[] = [];
  const heuristic = (r1: number, c1: number) => 
    Math.sqrt((er - r1) ** 2 + (ec - c1) ** 2);
  
  open.push({ idx: startIdx, f: heuristic(sr, sc) });
  
  // 8-directional movement
  const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const diagCost = 1.414;
  
  let iterations = 0;
  const maxIter = Math.min(size, 50000); // Safety cap
  
  while (open.length > 0 && iterations++ < maxIter) {
    // Find best (lowest f) — for small open sets this is fast enough
    let bestI = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestI].f) bestI = i;
    }
    const cur = open[bestI];
    open[bestI] = open[open.length - 1];
    open.pop();
    
    if (cur.idx === endIdx) {
      // Reconstruct path
      const path: number[] = [];
      let node = endIdx;
      while (node !== -1) { path.push(node); node = parent[node]; }
      return path.reverse();
    }
    
    if (closed[cur.idx]) continue;
    closed[cur.idx] = 1;
    
    const cr = Math.floor(cur.idx / cols);
    const cc = cur.idx % cols;
    
    for (const [dr, dc] of dirs) {
      const nr = cr + dr, nc = cc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nIdx = key(nr, nc);
      if (closed[nIdx] || !navigable[nIdx]) continue;
      
      const moveCost = (dr !== 0 && dc !== 0) ? diagCost : 1.0;
      const newG = g[cur.idx] + moveCost * cost[nIdx];
      
      if (newG < g[nIdx]) {
        g[nIdx] = newG;
        parent[nIdx] = cur.idx;
        open.push({ idx: nIdx, f: newG + heuristic(nr, nc) });
      }
    }
  }
  
  return null; // No path found
}

// Douglas-Peucker path smoothing
function smooth(points: [number, number][], epsilon: number): [number, number][] {
  if (points.length <= 2) return points;
  let maxDist = 0, maxIdx = 0;
  const [sx, sy] = points[0], [ex, ey] = points[points.length - 1];
  const len = Math.sqrt((ex-sx)**2 + (ey-sy)**2);
  
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const dist = len === 0 
      ? Math.sqrt((px-sx)**2 + (py-sy)**2)
      : Math.abs((ey-sy)*px - (ex-sx)*py + ex*sy - ey*sx) / len;
    if (dist > maxDist) { maxDist = dist; maxIdx = i; }
  }
  
  if (maxDist > epsilon) {
    const left = smooth(points.slice(0, maxIdx + 1), epsilon);
    const right = smooth(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

// Find nearest navigable cell to a given position
function findNearest(navigable: Uint8Array, rows: number, cols: number, r: number, c: number): [number, number] {
  if (r >= 0 && r < rows && c >= 0 && c < cols && navigable[r * cols + c]) return [r, c];
  for (let radius = 1; radius < 30; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue; // Only check perimeter
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && navigable[nr * cols + nc]) {
          return [nr, nc];
        }
      }
    }
  }
  return [r, c];
}

export function findWaterRoute(
  startLng: number, startLat: number,
  endLng: number, endLat: number,
  hazards: Hazard[], currentWaterLevel: number
): RouteResult {
  const warnings: string[] = [];
  
  // Build navigable grid
  const { navigable, cost, rows, cols } = buildGrid(hazards, currentWaterLevel);
  
  // Convert coordinates to grid cells
  const toGrid = (lng: number, lat: number): [number, number] => [
    Math.round((lat - BOUNDS.minLat) / GRID_RES),
    Math.round((lng - BOUNDS.minLng) / GRID_RES),
  ];
  
  let [sr, sc] = toGrid(startLng, startLat);
  let [er, ec] = toGrid(endLng, endLat);
  
  // Clamp to grid
  sr = Math.max(0, Math.min(sr, rows - 1));
  sc = Math.max(0, Math.min(sc, cols - 1));
  er = Math.max(0, Math.min(er, rows - 1));
  ec = Math.max(0, Math.min(ec, cols - 1));
  
  // Find nearest navigable cells
  [sr, sc] = findNearest(navigable, rows, cols, sr, sc);
  [er, ec] = findNearest(navigable, rows, cols, er, ec);
  
  // Run A*
  const pathIndices = astar(navigable, cost, rows, cols, sr, sc, er, ec);
  
  if (!pathIndices) {
    // Fallback: direct line (better than nothing)
    warnings.push('No water route found — showing direct course');
    const dist = haversineNM(startLat, startLng, endLat, endLng);
    return {
      path: [[startLng, startLat], [endLng, endLat]],
      distance_nm: dist, hazards_nearby: 0, min_depth_ft: 0, warnings,
    };
  }
  
  // Convert grid path back to coordinates
  const rawPath: [number, number][] = pathIndices.map(idx => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    return [BOUNDS.minLng + c * GRID_RES, BOUNDS.minLat + r * GRID_RES] as [number, number];
  });
  
  // Smooth the path
  const smoothed = smooth(rawPath, GRID_RES * 0.6);
  
  // Pin start/end to exact coordinates
  smoothed[0] = [startLng, startLat];
  smoothed[smoothed.length - 1] = [endLng, endLat];
  
  // Calculate distance
  let totalDist = 0;
  for (let i = 1; i < smoothed.length; i++) {
    totalDist += haversineNM(smoothed[i-1][1], smoothed[i-1][0], smoothed[i][1], smoothed[i][0]);
  }
  
  // Count hazards near route
  let hazardsNear = 0;
  for (const h of hazards) {
    const depth = currentWaterLevel - h.elevation_ft;
    if (depth < 6) {
      for (const [lng, lat] of smoothed) {
        const d = Math.sqrt((lng - h.lng)**2 + (lat - h.lat)**2);
        if (d < HAZARD_BUFFER) { hazardsNear++; break; }
      }
    }
  }
  
  if (hazardsNear > 0) {
    warnings.push(`${hazardsNear} hazard${hazardsNear > 1 ? 's' : ''} near route — proceed with caution`);
  }
  
  return {
    path: smoothed,
    distance_nm: totalDist,
    hazards_nearby: hazardsNear,
    min_depth_ft: 0,
    warnings,
  };
}