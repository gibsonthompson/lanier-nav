#!/usr/bin/env node
/**
 * NaviLake — Flood Fill Navigation Grid Generator
 * Draws shoreline segments as boundaries, flood fills from known water points.
 * No polygon assembly needed.
 *
 * Run from repo root:
 *   node scripts/build-grid-floodfill.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// ─── CONFIG ───
const GRID_RESOLUTION = 0.0005; // ~55m per cell
const SHORE_LINE_THICKNESS = 3; // pixels thick — closes small gaps
const SHORE_BUFFER_CELLS = 2;   // cells inward from shore for "near-shore" cost

// Known water points — places we're 100% certain are on the lake
const WATER_SEEDS = [
  { lat: 34.22, lng: -84.00 },   // mid-lake south (between Lanier Islands and Bald Ridge)
  { lat: 34.28, lng: -83.95 },   // mid-lake central
  { lat: 34.35, lng: -83.90 },   // mid-lake north (Chattahoochee arm)
  { lat: 34.35, lng: -83.82 },   // Chestatee arm
  { lat: 34.38, lng: -83.97 },   // Dawson County arm
  { lat: 34.18, lng: -83.97 },   // South lake near Lanier Islands
  { lat: 34.25, lng: -83.92 },   // East side
  { lat: 34.20, lng: -84.08 },   // West side near Bald Ridge
  { lat: 34.30, lng: -83.88 },   // Near Gainesville
  { lat: 34.16, lng: -84.03 },   // South near Buford Dam
];

// ─── STEP 1: Load shoreline data ───
function loadShorelineSegments() {
  console.log('📂 Loading lake-lanier-raw.json...');
  const raw = JSON.parse(readFileSync('src/data/lake-lanier-raw.json', 'utf-8'));
  const relation = raw.elements[0];

  const segments = [];
  for (const member of relation.members) {
    if (member.geometry && member.geometry.length >= 2) {
      const points = member.geometry.map(p => ({ lat: p.lat, lng: p.lon }));
      segments.push(points);
    }
  }

  const totalPts = segments.reduce((s, seg) => s + seg.length, 0);
  console.log(`   ${segments.length} segments, ${totalPts.toLocaleString()} total points`);
  return segments;
}

// ─── STEP 2: Compute bounds from data ───
function computeBounds(segments) {
  let south = 90, north = -90, west = 180, east = -180;
  for (const seg of segments) {
    for (const p of seg) {
      if (p.lat < south) south = p.lat;
      if (p.lat > north) north = p.lat;
      if (p.lng < west) west = p.lng;
      if (p.lng > east) east = p.lng;
    }
  }
  // Padding
  south -= 0.003; north += 0.003;
  west -= 0.003; east += 0.003;
  return { south, north, west, east };
}

// ─── STEP 3: Draw shoreline as boundary on grid ───
function drawShoreline(grid, rows, cols, bounds, segments) {
  console.log('🖊️  Drawing shoreline boundaries...');

  const BOUNDARY = 255; // marker value for shoreline

  function toCell(lat, lng) {
    const row = Math.floor((lat - bounds.south) / GRID_RESOLUTION);
    const col = Math.floor((lng - bounds.west) / GRID_RESOLUTION);
    return { row, col };
  }

  function markCell(row, col) {
    // Draw thick — mark this cell and neighbors within thickness
    const half = Math.floor(SHORE_LINE_THICKNESS / 2);
    for (let dr = -half; dr <= half; dr++) {
      for (let dc = -half; dc <= half; dc++) {
        const r = row + dr, c = col + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          grid[r * cols + c] = BOUNDARY;
        }
      }
    }
  }

  // Bresenham line drawing between consecutive points in each segment
  function drawLine(r0, c0, r1, c1) {
    const dr = Math.abs(r1 - r0);
    const dc = Math.abs(c1 - c0);
    const sr = r0 < r1 ? 1 : -1;
    const sc = c0 < c1 ? 1 : -1;
    let err = dr - dc;
    let r = r0, c = c0;

    while (true) {
      markCell(r, c);
      if (r === r1 && c === c1) break;
      const e2 = 2 * err;
      if (e2 > -dc) { err -= dc; r += sr; }
      if (e2 < dr) { err += dr; c += sc; }
    }
  }

  let lineCount = 0;
  for (const seg of segments) {
    for (let i = 0; i < seg.length - 1; i++) {
      const a = toCell(seg[i].lat, seg[i].lng);
      const b = toCell(seg[i + 1].lat, seg[i + 1].lng);
      drawLine(a.row, a.col, b.row, b.col);
      lineCount++;
    }
  }

  // Count boundary cells
  let boundaryCells = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === BOUNDARY) boundaryCells++;
  }

  console.log(`   Drew ${lineCount.toLocaleString()} line segments`);
  console.log(`   Boundary cells: ${boundaryCells.toLocaleString()}`);
}

// ─── STEP 4: Flood fill from known water points ───
function floodFill(grid, rows, cols, bounds) {
  console.log('🌊 Flood filling from known water points...');

  const BOUNDARY = 255;
  const WATER = 1;

  function toCell(lat, lng) {
    const row = Math.floor((lat - bounds.south) / GRID_RESOLUTION);
    const col = Math.floor((lng - bounds.west) / GRID_RESOLUTION);
    return { row, col };
  }

  let totalFilled = 0;

  for (const seed of WATER_SEEDS) {
    const { row, col } = toCell(seed.lat, seed.lng);

    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      console.log(`   ⚠️  Seed (${seed.lat}, ${seed.lng}) out of bounds — skipping`);
      continue;
    }

    if (grid[row * cols + col] === BOUNDARY) {
      console.log(`   ⚠️  Seed (${seed.lat}, ${seed.lng}) landed on boundary — skipping`);
      continue;
    }

    if (grid[row * cols + col] === WATER) {
      // Already filled by a previous seed
      continue;
    }

    // BFS flood fill
    const queue = [row * cols + col];
    grid[row * cols + col] = WATER;
    let filled = 0;

    while (queue.length > 0) {
      const idx = queue.pop(); // use as stack (DFS) for speed
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      filled++;

      // 4-directional neighbors
      const neighbors = [
        r > 0 ? (r - 1) * cols + c : -1,
        r < rows - 1 ? (r + 1) * cols + c : -1,
        c > 0 ? r * cols + (c - 1) : -1,
        c < cols - 1 ? r * cols + (c + 1) : -1,
      ];

      for (const ni of neighbors) {
        if (ni >= 0 && grid[ni] === 0) {
          grid[ni] = WATER;
          queue.push(ni);
        }
      }
    }

    totalFilled += filled;
    console.log(`   Seed (${seed.lat}, ${seed.lng}): filled ${filled.toLocaleString()} cells`);
  }

  console.log(`   Total water cells: ${totalFilled.toLocaleString()}`);

  // Sanity check — Lake Lanier is ~38,000 acres = ~154 km² = ~50,000 cells at 55m
  // Allow 30k-100k as reasonable range
  if (totalFilled < 20000) {
    console.log('   ⚠️  WARNING: Very few water cells — shoreline might have blocked fill');
  } else if (totalFilled > 150000) {
    console.log('   ⚠️  WARNING: Too many water cells — possible leak through gap in shoreline');
  } else {
    console.log('   ✅ Water cell count looks reasonable');
  }

  return totalFilled;
}

// ─── STEP 5: Convert boundary cells back to land, apply shore buffer ───
function postProcess(grid, rows, cols) {
  console.log('🔧 Post-processing...');

  const BOUNDARY = 255;
  const WATER = 1;
  const LAND = 0;
  const NEAR_SHORE = 2;

  // Convert boundary cells to land
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === BOUNDARY) grid[i] = LAND;
  }

  // Apply shore buffer — water cells near land get marked as near-shore
  const buffered = new Uint8Array(grid);
  let nearShoreCount = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row * cols + col] !== WATER) continue;

      let nearLand = false;
      outer:
      for (let dr = -SHORE_BUFFER_CELLS; dr <= SHORE_BUFFER_CELLS; dr++) {
        for (let dc = -SHORE_BUFFER_CELLS; dc <= SHORE_BUFFER_CELLS; dc++) {
          const nr = row + dr, nc = col + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr * cols + nc] === LAND) {
            nearLand = true;
            break outer;
          }
        }
      }

      if (nearLand) {
        buffered[row * cols + col] = NEAR_SHORE;
        nearShoreCount++;
      }
    }
  }

  // Copy buffered back
  for (let i = 0; i < grid.length; i++) grid[i] = buffered[i];

  console.log(`   Near-shore cells: ${nearShoreCount.toLocaleString()}`);

  // Final counts
  let land = 0, water = 0, shore = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === 0) land++;
    else if (grid[i] === 1) water++;
    else if (grid[i] === 2) shore++;
  }
  console.log(`   Final: ${land.toLocaleString()} land, ${water.toLocaleString()} open water, ${shore.toLocaleString()} near-shore`);
}

// ─── STEP 6: RLE compress and save ───
function saveGrid(grid, rows, cols, bounds, waterCells) {
  const rle = [];
  let val = grid[0], count = 1;
  for (let i = 1; i < grid.length; i++) {
    if (grid[i] === val) { count++; }
    else { rle.push(val, count); val = grid[i]; count = 1; }
  }
  rle.push(val, count);

  const output = {
    bounds,
    resolution: GRID_RESOLUTION,
    rows,
    cols,
    shore_buffer_cells: SHORE_BUFFER_CELLS,
    water_cells: waterCells,
    grid_rle: rle,
  };

  mkdirSync('src/data', { recursive: true });
  const json = JSON.stringify(output);
  writeFileSync('src/data/nav-grid.json', json);
  console.log(`\n✅ Saved src/data/nav-grid.json (${(json.length / 1024).toFixed(0)} KB)`);
  console.log(`   ${rle.length / 2} RLE runs`);
}

// ─── MAIN ───
function main() {
  const startTime = Date.now();

  // Load
  const segments = loadShorelineSegments();
  const bounds = computeBounds(segments);
  const cols = Math.ceil((bounds.east - bounds.west) / GRID_RESOLUTION);
  const rows = Math.ceil((bounds.north - bounds.south) / GRID_RESOLUTION);

  console.log(`\n🗺️  Grid: ${cols} × ${rows} = ${(cols * rows).toLocaleString()} cells`);
  console.log(`   Bounds: ${bounds.south.toFixed(4)}–${bounds.north.toFixed(4)} lat, ${bounds.west.toFixed(4)}–${bounds.east.toFixed(4)} lng`);

  // Initialize grid — all zeros (land)
  const grid = new Uint8Array(rows * cols);

  // Draw shoreline boundaries
  drawShoreline(grid, rows, cols, bounds, segments);

  // Flood fill water
  const waterCells = floodFill(grid, rows, cols, bounds);

  // Post-process
  postProcess(grid, rows, cols);

  // Save
  saveGrid(grid, rows, cols, bounds, waterCells);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   Total time: ${elapsed}s`);
}

main();
