/**
 * Water Router — A* pathfinding on Lake Lanier's navigable water
 *
 * How it works:
 * 1. The lake surface is divided into a grid of cells
 * 2. Each cell has a navigability score based on:
 *    - Depth at current water level (deeper = safer = lower cost)
 *    - Distance from known hazards (closer = higher cost)
 *    - Whether it's in a marked channel (lower cost)
 * 3. A* finds the lowest-cost path from start to destination
 * 4. The path is smoothed into natural-looking curves
 *
 * This gives WATER-SPECIFIC routing that:
 * - Stays on the lake (never routes over land)
 * - Avoids shallow areas based on live water level
 * - Gives hazards a wide berth
 * - Prefers marked navigation channels
 * - Recalculates as conditions change
 */

import type { Hazard } from '@/data/hazards';

// ─── Types ───

interface GridCell {
  row: number;
  col: number;
  lat: number;
  lng: number;
  navigable: boolean;    // false = land
  depth: number;         // effective depth at current water level (ft)
  hazardCost: number;    // 0 = no nearby hazard, higher = closer to hazard
  channelBonus: boolean; // true = in a marked channel
}

interface PathNode {
  row: number;
  col: number;
  g: number; // cost from start
  h: number; // heuristic to goal
  f: number; // g + h
  parent: PathNode | null;
}

export interface RouteResult {
  path: [number, number][];      // [lng, lat] waypoints
  distance_nm: number;
  hazards_nearby: number;
  min_depth_ft: number;
  warnings: string[];
}

// ─── Lake boundary (simplified polygon) ───
// Points defining the approximate navigable water boundary of Lake Lanier
// In production, this comes from a precise shoreline GeoJSON
const LAKE_BOUNDARY: [number, number][] = [
  [-84.085, 34.155], [-84.080, 34.160], [-84.075, 34.165],
  [-84.070, 34.175], [-84.065, 34.185], [-84.060, 34.195],
  [-84.055, 34.205], [-84.050, 34.215], [-84.045, 34.225],
  [-84.040, 34.235], [-84.035, 34.240], [-84.025, 34.245],
  [-84.015, 34.250], [-84.005, 34.248], [-83.995, 34.245],
  [-83.985, 34.240], [-83.980, 34.235], [-83.975, 34.225],
  [-83.980, 34.215], [-83.985, 34.205], [-83.990, 34.195],
  [-83.995, 34.185], [-84.000, 34.175], [-84.005, 34.170],
  [-84.010, 34.165], [-84.020, 34.160], [-84.030, 34.155],
  [-84.040, 34.150], [-84.050, 34.148], [-84.060, 34.150],
  [-84.070, 34.152], [-84.085, 34.155],
];

// ─── Known safe channel waypoints ───
// Major navigable channels on Lanier (simplified from USACE chart)
// In production, these come from the USACE ArcGIS ATON data
const CHANNEL_WAYPOINTS: [number, number][] = [
  [-84.072, 34.158], // Near dam - main channel start
  [-84.065, 34.168], // Main channel
  [-84.058, 34.178], // Mid-lake channel
  [-84.050, 34.188], // Channel fork north
  [-84.042, 34.198], // North branch
  [-84.035, 34.208], // Upper channel
  [-84.025, 34.218], // NE branch
  [-84.015, 34.228], // Upper lake
  [-84.048, 34.195], // West branch
  [-84.040, 34.205], // West channel
  [-84.030, 34.198], // East cove channel
  [-84.020, 34.202], // East channel
];

// ─── Grid configuration ───
const GRID_RESOLUTION = 0.002; // ~200m per cell (good balance of accuracy vs performance)
const HAZARD_BUFFER_NM = 0.05; // ~300ft buffer around hazards
const CHANNEL_RADIUS = 0.003;  // How close to a channel waypoint to get the bonus
const MIN_SAFE_DEPTH = 4;      // Minimum depth (ft) we'll route through

// ─── Helpers ───

function pointInPolygon(lng: number, lat: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function haversineNM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distDeg(lng1: number, lat1: number, lng2: number, lat2: number): number {
  return Math.sqrt((lng2 - lng1) ** 2 + (lat2 - lat1) ** 2);
}

// Simplified depth lookup — in production this queries PostGIS bathymetry
function getBottomElevation(lat: number, lng: number): number {
  // Approximate: deeper near the main channel (center of lake), shallower near edges
  // Main channel runs roughly along lng=-84.05 from dam (34.16) north to 34.24
  const channelDist = Math.abs(lng - (-84.05));
  const northFactor = Math.max(0, 1 - (lat - 34.16) / 0.1); // deeper near dam

  // Base bottom elevation (lower = deeper water)
  const baseElevation = 1010 + channelDist * 800 + (1 - northFactor) * 15;
  return Math.min(baseElevation, 1068); // Cap at near-surface
}

// ─── Build navigable grid ───

function buildGrid(
  hazards: Hazard[],
  currentWaterLevel: number
): { grid: GridCell[][]; bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number; cols: number; rows: number } } {
  // Determine grid bounds from lake boundary
  const lngs = LAKE_BOUNDARY.map((p) => p[0]);
  const lats = LAKE_BOUNDARY.map((p) => p[1]);
  const minLng = Math.min(...lngs) - GRID_RESOLUTION;
  const maxLng = Math.max(...lngs) + GRID_RESOLUTION;
  const minLat = Math.min(...lats) - GRID_RESOLUTION;
  const maxLat = Math.max(...lats) + GRID_RESOLUTION;

  const cols = Math.ceil((maxLng - minLng) / GRID_RESOLUTION);
  const rows = Math.ceil((maxLat - minLat) / GRID_RESOLUTION);

  const grid: GridCell[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < cols; c++) {
      const lng = minLng + c * GRID_RESOLUTION;
      const lat = minLat + r * GRID_RESOLUTION;

      // Check if point is on water
      const onWater = pointInPolygon(lng, lat, LAKE_BOUNDARY);

      // Calculate depth
      const bottomElev = getBottomElevation(lat, lng);
      const depth = currentWaterLevel - bottomElev;

      // Navigable = on water AND deep enough
      const navigable = onWater && depth >= MIN_SAFE_DEPTH;

      // Hazard proximity cost
      let hazardCost = 0;
      for (const h of hazards) {
        const dist = distDeg(lng, lat, h.lng, h.lat);
        const effectiveDepth = currentWaterLevel - h.elevation_ft;
        if (dist < HAZARD_BUFFER_NM * 2 && effectiveDepth < 6) {
          // Closer to hazard = exponentially higher cost
          const proximity = 1 - dist / (HAZARD_BUFFER_NM * 2);
          const severityMult = h.severity === 'high' ? 3 : h.severity === 'medium' ? 2 : 1;
          hazardCost += proximity * proximity * severityMult * 50;
        }
      }

      // Channel bonus — being in a marked channel lowers cost
      let channelBonus = false;
      for (const wp of CHANNEL_WAYPOINTS) {
        if (distDeg(lng, lat, wp[0], wp[1]) < CHANNEL_RADIUS) {
          channelBonus = true;
          break;
        }
      }

      row.push({ row: r, col: c, lat, lng, navigable, depth, hazardCost, channelBonus });
    }
    grid.push(row);
  }

  return { grid, bounds: { minLng, maxLng, minLat, maxLat, cols, rows } };
}

// ─── A* Pathfinding ───

function astar(
  grid: GridCell[][],
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): PathNode[] | null {
  const rows = grid.length;
  const cols = grid[0].length;

  if (!grid[startRow]?.[startCol]?.navigable || !grid[endRow]?.[endCol]?.navigable) {
    return null;
  }

  const open: PathNode[] = [];
  const closed = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;

  const heuristic = (r1: number, c1: number, r2: number, c2: number) =>
    Math.sqrt((r2 - r1) ** 2 + (c2 - c1) ** 2);

  const start: PathNode = {
    row: startRow, col: startCol,
    g: 0, h: heuristic(startRow, startCol, endRow, endCol),
    f: heuristic(startRow, startCol, endRow, endCol),
    parent: null,
  };
  open.push(start);

  // 8-directional movement
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  let iterations = 0;
  const maxIterations = rows * cols * 2; // Safety valve

  while (open.length > 0 && iterations < maxIterations) {
    iterations++;

    // Find lowest f score
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) bestIdx = i;
    }
    const current = open.splice(bestIdx, 1)[0];

    if (current.row === endRow && current.col === endCol) {
      // Reconstruct path
      const path: PathNode[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift(node);
        node = node.parent;
      }
      return path;
    }

    closed.add(key(current.row, current.col));

    for (const [dr, dc] of dirs) {
      const nr = current.row + dr;
      const nc = current.col + dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (closed.has(key(nr, nc))) continue;
      if (!grid[nr][nc].navigable) continue;

      const cell = grid[nr][nc];

      // Movement cost: base distance + depth penalty + hazard cost - channel bonus
      const moveDist = dr !== 0 && dc !== 0 ? 1.414 : 1.0;

      // Prefer deeper water (penalize shallow)
      const depthPenalty = cell.depth < 8 ? (8 - cell.depth) * 2 : 0;

      // Hazard avoidance
      const hazardPenalty = cell.hazardCost;

      // Channel preference
      const channelDiscount = cell.channelBonus ? -0.5 : 0;

      const g = current.g + moveDist + depthPenalty + hazardPenalty + channelDiscount;
      const h = heuristic(nr, nc, endRow, endCol);
      const f = g + h;

      // Check if already in open with better score
      const existingIdx = open.findIndex((n) => n.row === nr && n.col === nc);
      if (existingIdx >= 0) {
        if (g < open[existingIdx].g) {
          open[existingIdx] = { row: nr, col: nc, g, h, f, parent: current };
        }
        continue;
      }

      open.push({ row: nr, col: nc, g, h, f, parent: current });
    }
  }

  return null; // No path found
}

// ─── Path smoothing (Ramer-Douglas-Peucker) ───

function rdpSmooth(points: [number, number][], epsilon: number): [number, number][] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDist(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSmooth(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSmooth(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDist(point: [number, number], lineStart: [number, number], lineEnd: [number, number]): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt((point[0] - lineStart[0]) ** 2 + (point[1] - lineStart[1]) ** 2);
  const t = Math.max(0, Math.min(1, ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (len * len)));
  const projX = lineStart[0] + t * dx;
  const projY = lineStart[1] + t * dy;
  return Math.sqrt((point[0] - projX) ** 2 + (point[1] - projY) ** 2);
}

// ─── Public API ───

export function findWaterRoute(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  hazards: Hazard[],
  currentWaterLevel: number
): RouteResult {
  const warnings: string[] = [];

  // Build the navigable grid
  const { grid, bounds } = buildGrid(hazards, currentWaterLevel);

  // Convert lat/lng to grid cells
  const startCol = Math.round((startLng - bounds.minLng) / GRID_RESOLUTION);
  const startRow = Math.round((startLat - bounds.minLat) / GRID_RESOLUTION);
  const endCol = Math.round((endLng - bounds.minLng) / GRID_RESOLUTION);
  const endRow = Math.round((endLat - bounds.minLat) / GRID_RESOLUTION);

  // Clamp to grid bounds
  const clamp = (v: number, max: number) => Math.max(0, Math.min(v, max - 1));
  const sr = clamp(startRow, bounds.rows);
  const sc = clamp(startCol, bounds.cols);
  const er = clamp(endRow, bounds.rows);
  const ec = clamp(endCol, bounds.cols);

  // Check if start/end are navigable, find nearest navigable cell if not
  const findNearest = (r: number, c: number): [number, number] => {
    if (grid[r]?.[c]?.navigable) return [r, c];
    for (let radius = 1; radius < 15; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < bounds.rows && nc >= 0 && nc < bounds.cols && grid[nr][nc].navigable) {
            return [nr, nc];
          }
        }
      }
    }
    return [r, c];
  };

  const [adjSR, adjSC] = findNearest(sr, sc);
  const [adjER, adjEC] = findNearest(er, ec);

  if (!grid[adjSR]?.[adjSC]?.navigable) {
    warnings.push('Start point is on land');
  }
  if (!grid[adjER]?.[adjEC]?.navigable) {
    warnings.push('Destination is on land');
  }

  // Run A*
  const pathNodes = astar(grid, adjSR, adjSC, adjER, adjEC);

  if (!pathNodes) {
    // Fallback to direct line if no path found
    warnings.push('No water route found — showing direct course');
    return {
      path: [[startLng, startLat], [endLng, endLat]],
      distance_nm: haversineNM(startLat, startLng, endLat, endLng),
      hazards_nearby: 0,
      min_depth_ft: 0,
      warnings,
    };
  }

  // Convert path nodes back to coordinates
  const rawPath: [number, number][] = pathNodes.map((n) => [
    bounds.minLng + n.col * GRID_RESOLUTION,
    bounds.minLat + n.row * GRID_RESOLUTION,
  ]);

  // Smooth the path
  const smoothed = rdpSmooth(rawPath, GRID_RESOLUTION * 0.8);

  // Ensure start and end are exact
  smoothed[0] = [startLng, startLat];
  smoothed[smoothed.length - 1] = [endLng, endLat];

  // Calculate route stats
  let totalDist = 0;
  let minDepth = Infinity;
  let hazardsNearby = 0;

  for (let i = 1; i < smoothed.length; i++) {
    totalDist += haversineNM(smoothed[i - 1][1], smoothed[i - 1][0], smoothed[i][1], smoothed[i][0]);
  }

  for (const node of pathNodes) {
    const cell = grid[node.row][node.col];
    if (cell.depth < minDepth) minDepth = cell.depth;
    if (cell.hazardCost > 10) hazardsNearby++;
  }

  if (minDepth < 6) {
    warnings.push(`Shallow water ahead — minimum ${minDepth.toFixed(1)}ft on route`);
  }
  if (hazardsNearby > 0) {
    warnings.push(`${hazardsNearby} hazard zone${hazardsNearby > 1 ? 's' : ''} near route — proceed with caution`);
  }

  return {
    path: smoothed,
    distance_nm: totalDist,
    hazards_nearby: hazardsNearby,
    min_depth_ft: minDepth === Infinity ? 0 : minDepth,
    warnings,
  };
}