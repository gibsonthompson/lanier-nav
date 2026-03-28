/**
 * Water Router — A* pathfinding on Lake Lanier's navigable water
 * 
 * Uses 8-zone lake boundary to classify water vs land.
 * Coarse grid (300m cells) for fast pathfinding with smoothed output.
 * Routes stay on water and go around peninsulas.
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

// Finer grid = more accurate routes (200m per cell, ~14K cells)
const GRID_RES = 0.002;
const HAZARD_BUFFER = 0.004;

const BOUNDS = {
  minLng: -84.125, maxLng: -83.760,
  minLat: 34.145, maxLat: 34.405,
};

function haversineNM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Cache the navigable grid (doesn't change between routes)
let cachedGrid: { nav: Uint8Array; rows: number; cols: number } | null = null;

function getGrid(hazards: Hazard[], waterLevel: number) {
  const cols = Math.ceil((BOUNDS.maxLng - BOUNDS.minLng) / GRID_RES);
  const rows = Math.ceil((BOUNDS.maxLat - BOUNDS.minLat) / GRID_RES);

  if (cachedGrid && cachedGrid.rows === rows && cachedGrid.cols === cols) {
    return cachedGrid;
  }

  const nav = new Uint8Array(rows * cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lng = BOUNDS.minLng + c * GRID_RES;
      const lat = BOUNDS.minLat + r * GRID_RES;
      // Check center + offsets for better coverage
      if (isOnWater(lng, lat) || 
          isOnWater(lng + GRID_RES * 0.3, lat) || 
          isOnWater(lng - GRID_RES * 0.3, lat) ||
          isOnWater(lng, lat + GRID_RES * 0.3) ||
          isOnWater(lng, lat - GRID_RES * 0.3)) {
        nav[r * cols + c] = 1;
      }
    }
  }

  cachedGrid = { nav, rows, cols };
  return cachedGrid;
}

// A* with proper binary heap
function astar(nav: Uint8Array, rows: number, cols: number,
  sr: number, sc: number, er: number, ec: number): number[] | null {

  const size = rows * cols;
  const g = new Float32Array(size).fill(Infinity);
  const parent = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);

  const idx = (r: number, c: number) => r * cols + c;
  const startI = idx(sr, sc);
  const endI = idx(er, ec);

  if (!nav[startI] || !nav[endI]) return null;

  g[startI] = 0;

  // Binary heap priority queue
  const heap: number[] = [startI];
  const fScore = new Float32Array(size).fill(Infinity);
  fScore[startI] = Math.sqrt((er - sr) ** 2 + (ec - sc) ** 2);

  function heapPush(i: number) {
    heap.push(i);
    let pos = heap.length - 1;
    while (pos > 0) {
      const parentPos = (pos - 1) >> 1;
      if (fScore[heap[pos]] < fScore[heap[parentPos]]) {
        [heap[pos], heap[parentPos]] = [heap[parentPos], heap[pos]];
        pos = parentPos;
      } else break;
    }
  }

  function heapPop(): number {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let pos = 0;
      while (true) {
        let smallest = pos;
        const left = 2 * pos + 1, right = 2 * pos + 2;
        if (left < heap.length && fScore[heap[left]] < fScore[heap[smallest]]) smallest = left;
        if (right < heap.length && fScore[heap[right]] < fScore[heap[smallest]]) smallest = right;
        if (smallest !== pos) {
          [heap[pos], heap[smallest]] = [heap[smallest], heap[pos]];
          pos = smallest;
        } else break;
      }
    }
    return top;
  }

  const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  let iterations = 0;
  while (heap.length > 0 && iterations++ < 200000) {
    const curI = heapPop();

    if (curI === endI) {
      // Reconstruct path
      const path: number[] = [];
      let node = endI;
      while (node !== -1) { path.push(node); node = parent[node]; }
      return path.reverse();
    }

    if (closed[curI]) continue;
    closed[curI] = 1;

    const cr = Math.floor(curI / cols);
    const cc = curI % cols;

    for (const [dr, dc] of dirs) {
      const nr = cr + dr, nc = cc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nI = idx(nr, nc);
      if (closed[nI] || !nav[nI]) continue;

      const moveCost = (dr !== 0 && dc !== 0) ? 1.414 : 1.0;
      const newG = g[curI] + moveCost;

      if (newG < g[nI]) {
        g[nI] = newG;
        parent[nI] = curI;
        const h = Math.sqrt((er - nr) ** 2 + (ec - nc) ** 2);
        fScore[nI] = newG + h;
        heapPush(nI);
      }
    }
  }

  return null;
}

// Douglas-Peucker smoothing
function smooth(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length <= 2) return pts;
  let maxD = 0, maxI = 0;
  const [sx, sy] = pts[0], [ex, ey] = pts[pts.length - 1];
  const len = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    const d = len === 0
      ? Math.sqrt((px - sx) ** 2 + (py - sy) ** 2)
      : Math.abs((ey - sy) * px - (ex - sx) * py + ex * sy - ey * sx) / len;
    if (d > maxD) { maxD = d; maxI = i; }
  }
  if (maxD > eps) {
    const left = smooth(pts.slice(0, maxI + 1), eps);
    const right = smooth(pts.slice(maxI), eps);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0], pts[pts.length - 1]];
}

function findNearest(nav: Uint8Array, rows: number, cols: number, r: number, c: number): [number, number] {
  const clampR = Math.max(0, Math.min(r, rows - 1));
  const clampC = Math.max(0, Math.min(c, cols - 1));
  if (nav[clampR * cols + clampC]) return [clampR, clampC];
  for (let radius = 1; radius < 50; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
        const nr = clampR + dr, nc = clampC + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && nav[nr * cols + nc]) return [nr, nc];
      }
    }
  }
  return [clampR, clampC];
}

export function findWaterRoute(
  startLng: number, startLat: number,
  endLng: number, endLat: number,
  hazards: Hazard[], currentWaterLevel: number
): RouteResult {
  const warnings: string[] = [];
  const { nav, rows, cols } = getGrid(hazards, currentWaterLevel);

  const toGrid = (lng: number, lat: number): [number, number] => [
    Math.round((lat - BOUNDS.minLat) / GRID_RES),
    Math.round((lng - BOUNDS.minLng) / GRID_RES),
  ];

  let [sr, sc] = findNearest(nav, rows, cols, ...toGrid(startLng, startLat));
  let [er, ec] = findNearest(nav, rows, cols, ...toGrid(endLng, endLat));

  const pathIndices = astar(nav, rows, cols, sr, sc, er, ec);

  if (!pathIndices) {
    warnings.push('No water route found — showing direct course');
    return {
      path: [[startLng, startLat], [endLng, endLat]],
      distance_nm: haversineNM(startLat, startLng, endLat, endLng),
      hazards_nearby: 0, min_depth_ft: 0, warnings,
    };
  }

  const rawPath: [number, number][] = pathIndices.map(i => [
    BOUNDS.minLng + (i % cols) * GRID_RES,
    BOUNDS.minLat + Math.floor(i / cols) * GRID_RES,
  ]);

  const smoothed = smooth(rawPath, GRID_RES * 0.5);
  smoothed[0] = [startLng, startLat];
  smoothed[smoothed.length - 1] = [endLng, endLat];

  let totalDist = 0;
  for (let i = 1; i < smoothed.length; i++) {
    totalDist += haversineNM(smoothed[i - 1][1], smoothed[i - 1][0], smoothed[i][1], smoothed[i][0]);
  }

  let hazardsNear = 0;
  for (const h of hazards) {
    if (currentWaterLevel - h.elevation_ft < 6) {
      for (const [lng, lat] of smoothed) {
        if (Math.sqrt((lng - h.lng) ** 2 + (lat - h.lat) ** 2) < HAZARD_BUFFER) { hazardsNear++; break; }
      }
    }
  }
  if (hazardsNear > 0) warnings.push(`${hazardsNear} hazard${hazardsNear > 1 ? 's' : ''} near route`);

  return { path: smoothed, distance_nm: totalDist, hazards_nearby: hazardsNear, min_depth_ft: 0, warnings };
}