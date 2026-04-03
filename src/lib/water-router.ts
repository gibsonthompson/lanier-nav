/**
 * NaviLake — A* Water Router
 * Routes exclusively through water using the pre-computed navigation grid.
 * Never routes through land.
 */

import navGridData from '@/data/nav-grid.json';

// ─── Types ───
export interface RouteResult {
  path: [number, number][]; // [lng, lat] pairs for MapLibre
  distance_nm: number;
  warnings: string[];
}

interface GridCell {
  row: number;
  col: number;
}

// ─── Decode RLE grid on module load ───
const { bounds, resolution, rows, cols, grid_rle } = navGridData as {
  bounds: { south: number; north: number; west: number; east: number };
  resolution: number;
  rows: number;
  cols: number;
  shore_buffer_cells: number;
  water_cells: number;
  grid_rle: number[];
};

// Decode RLE into flat Uint8Array: 0=land, 1=open water, 2=near-shore
const grid = new Uint8Array(rows * cols);
let idx = 0;
for (let i = 0; i < grid_rle.length; i += 2) {
  const val = grid_rle[i];
  const count = grid_rle[i + 1];
  for (let j = 0; j < count; j++) {
    grid[idx++] = val;
  }
}

// ─── Coordinate conversion ───
function latLngToGrid(lat: number, lng: number): GridCell {
  const row = Math.floor((lat - bounds.south) / resolution);
  const col = Math.floor((lng - bounds.west) / resolution);
  return {
    row: Math.max(0, Math.min(rows - 1, row)),
    col: Math.max(0, Math.min(cols - 1, col)),
  };
}

function gridToLatLng(row: number, col: number): [number, number] {
  const lat = bounds.south + (row + 0.5) * resolution;
  const lng = bounds.west + (col + 0.5) * resolution;
  return [lng, lat]; // [lng, lat] for MapLibre
}

function isNavigable(row: number, col: number): boolean {
  if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
  return grid[row * cols + col] > 0; // 1 or 2 = water
}

function getCellCost(row: number, col: number): number {
  const val = grid[row * cols + col];
  if (val === 0) return Infinity; // land
  if (val === 2) return 3;        // near-shore — penalize to keep routes in open water
  return 1;                        // open water
}

// ─── Find nearest navigable cell (spiral search) ───
function findNearestWater(row: number, col: number): GridCell | null {
  if (isNavigable(row, col)) return { row, col };

  for (let radius = 1; radius < 50; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue; // only check perimeter
        const nr = row + dr, nc = col + dc;
        if (isNavigable(nr, nc)) return { row: nr, col: nc };
      }
    }
  }
  return null;
}

// ─── A* Pathfinding ───
// 8-directional movement
const DIRS: [number, number, number][] = [
  [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],           // cardinal
  [-1, -1, 1.414], [-1, 1, 1.414], [1, -1, 1.414], [1, 1, 1.414], // diagonal
];

function heuristic(r1: number, c1: number, r2: number, c2: number): number {
  // Octile distance (consistent heuristic for 8-dir movement)
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return Math.max(dr, dc) + 0.414 * Math.min(dr, dc);
}

function astar(start: GridCell, end: GridCell): GridCell[] | null {
  const key = (r: number, c: number) => r * cols + c;

  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();

  const startKey = key(start.row, start.col);
  const endKey = key(end.row, end.col);

  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(start.row, start.col, end.row, end.col));

  // Simple binary heap priority queue
  const openSet: { key: number; row: number; col: number; f: number }[] = [
    { key: startKey, row: start.row, col: start.col, f: fScore.get(startKey)! },
  ];
  const inOpen = new Set<number>([startKey]);
  const closed = new Set<number>();

  let iterations = 0;
  const MAX_ITERATIONS = 500000; // safety limit

  while (openSet.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;

    // Find node with lowest f-score (simple linear scan — fast enough for ~60k water cells)
    let bestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[bestIdx].f) bestIdx = i;
    }
    const current = openSet[bestIdx];
    openSet.splice(bestIdx, 1);
    inOpen.delete(current.key);

    if (current.key === endKey) {
      // Reconstruct path
      const path: GridCell[] = [];
      let k = endKey;
      while (k !== undefined) {
        const r = Math.floor(k / cols);
        const c = k % cols;
        path.unshift({ row: r, col: c });
        k = cameFrom.get(k)!;
        if (k === startKey) {
          path.unshift(start);
          break;
        }
      }
      return path;
    }

    closed.add(current.key);

    for (const [dr, dc, baseDist] of DIRS) {
      const nr = current.row + dr;
      const nc = current.col + dc;

      if (!isNavigable(nr, nc)) continue;

      const nKey = key(nr, nc);
      if (closed.has(nKey)) continue;

      const moveCost = baseDist * getCellCost(nr, nc);
      const tentG = (gScore.get(current.key) ?? Infinity) + moveCost;

      if (tentG < (gScore.get(nKey) ?? Infinity)) {
        cameFrom.set(nKey, current.key);
        gScore.set(nKey, tentG);
        const f = tentG + heuristic(nr, nc, end.row, end.col);
        fScore.set(nKey, f);

        if (!inOpen.has(nKey)) {
          openSet.push({ key: nKey, row: nr, col: nc, f });
          inOpen.add(nKey);
        }
      }
    }
  }

  return null; // no path found
}

// ─── Path smoothing (line-of-sight) ───
function hasLineOfSight(r1: number, c1: number, r2: number, c2: number): boolean {
  // Bresenham-style line walk checking every cell is navigable
  const dr = Math.abs(r2 - r1);
  const dc = Math.abs(c2 - c1);
  const sr = r1 < r2 ? 1 : -1;
  const sc = c1 < c2 ? 1 : -1;
  let err = dr - dc;
  let r = r1, c = c1;

  while (true) {
    if (!isNavigable(r, c)) return false;
    if (r === r2 && c === c2) break;
    const e2 = 2 * err;
    if (e2 > -dc) { err -= dc; r += sr; }
    if (e2 < dr) { err += dr; c += sc; }
  }
  return true;
}

function smoothPath(path: GridCell[]): GridCell[] {
  if (path.length <= 2) return path;

  const smoothed: GridCell[] = [path[0]];
  let current = 0;

  while (current < path.length - 1) {
    // Try to skip ahead as far as possible with line-of-sight
    let farthest = current + 1;
    for (let i = path.length - 1; i > current + 1; i--) {
      if (hasLineOfSight(path[current].row, path[current].col, path[i].row, path[i].col)) {
        farthest = i;
        break;
      }
    }
    smoothed.push(path[farthest]);
    current = farthest;
  }

  return smoothed;
}

// ─── Haversine distance ───
function haversineNM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Main routing function ───
export function findWaterRoute(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  hazards?: any[],
  currentLevel?: number,
): RouteResult {
  const warnings: string[] = [];

  // Convert to grid coordinates
  const startGrid = latLngToGrid(startLat, startLng);
  const endGrid = latLngToGrid(endLat, endLng);

  // Snap to nearest navigable cell if starting/ending on land
  const startWater = findNearestWater(startGrid.row, startGrid.col);
  const endWater = findNearestWater(endGrid.row, endGrid.col);

  if (!startWater) {
    warnings.push('Start location is too far from water');
    return { path: [[startLng, startLat], [endLng, endLat]], distance_nm: 0, warnings };
  }
  if (!endWater) {
    warnings.push('Destination is too far from water');
    return { path: [[startLng, startLat], [endLng, endLat]], distance_nm: 0, warnings };
  }

  if (startWater.row !== startGrid.row || startWater.col !== startGrid.col) {
    warnings.push('Snapped start to nearest water');
  }
  if (endWater.row !== endGrid.row || endWater.col !== endGrid.col) {
    warnings.push('Snapped destination to nearest water');
  }

  // Run A*
  const rawPath = astar(startWater, endWater);

  if (!rawPath) {
    warnings.push('No water route found — areas may not be connected');
    // Fallback: direct line
    return {
      path: [[startLng, startLat], [endLng, endLat]],
      distance_nm: haversineNM(startLat, startLng, endLat, endLng),
      warnings,
    };
  }

  // Smooth the path
  const smoothed = smoothPath(rawPath);

  // Convert to [lng, lat] coordinates
  const path: [number, number][] = [
    [startLng, startLat], // actual start position
    ...smoothed.map(c => gridToLatLng(c.row, c.col)),
    [endLng, endLat], // actual end position
  ];

  // Calculate total distance
  let totalNM = 0;
  for (let i = 1; i < path.length; i++) {
    totalNM += haversineNM(path[i - 1][1], path[i - 1][0], path[i][1], path[i][0]);
  }

  return { path, distance_nm: totalNM, warnings };
}