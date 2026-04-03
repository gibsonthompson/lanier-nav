#!/usr/bin/env node
/**
 * NaviLake — Navigation Grid Generator
 * Reads lake-lanier-raw.json (already fetched from Overpass)
 * Generates nav-grid.json for A* water routing
 *
 * Run from repo root:
 *   node scripts/generate-nav-grid.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// ─── CONFIG ───
const GRID_RESOLUTION = 0.0005; // ~55m per cell
const SHORE_BUFFER_CELLS = 2;   // 2 cells (~110m) safety margin from shore

// ─── STEP 1: Load and parse the Overpass relation ───
function loadLakeData() {
  console.log('📂 Loading lake-lanier-raw.json...');
  const raw = JSON.parse(readFileSync('src/data/lake-lanier-raw.json', 'utf-8'));
  const relation = raw.elements[0];

  const outerWays = relation.members.filter(m => m.role === 'outer');
  const innerWays = relation.members.filter(m => m.role === 'inner');

  console.log(`   ${outerWays.length} outer segments, ${innerWays.length} inner segments (islands)`);

  // Each member has a .geometry array of {lat, lon} points
  // Multiple outer ways form connected rings — we need to join them
  const outerRings = assembleRings(outerWays);
  const innerRings = assembleRings(innerWays);

  console.log(`   Assembled ${outerRings.length} outer rings, ${innerRings.length} inner rings`);

  return { outerRings, innerRings };
}

// ─── Join way segments into closed rings ───
function assembleRings(ways) {
  // Each way is a sequence of points. Ways sharing endpoints should be joined.
  // Extract each way as an array of [lng, lat]
  const segments = ways.map(w => {
    if (!w.geometry || w.geometry.length === 0) return null;
    return w.geometry.map(p => [p.lon, p.lat]);
  }).filter(Boolean);

  const rings = [];
  const used = new Set();

  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue;

    let ring = [...segments[i]];
    used.add(i);

    // Check if already closed
    const isClosed = (
      Math.abs(ring[0][0] - ring[ring.length - 1][0]) < 0.00001 &&
      Math.abs(ring[0][1] - ring[ring.length - 1][1]) < 0.00001
    );

    if (isClosed) {
      rings.push(ring);
      continue;
    }

    // Try to extend the ring by finding connecting segments
    let changed = true;
    while (changed) {
      changed = false;
      const ringStart = ring[0];
      const ringEnd = ring[ring.length - 1];

      for (let j = 0; j < segments.length; j++) {
        if (used.has(j)) continue;
        const seg = segments[j];
        const segStart = seg[0];
        const segEnd = seg[seg.length - 1];

        const threshold = 0.0001; // ~10m tolerance for joining

        // Check if seg start connects to ring end
        if (Math.abs(segStart[0] - ringEnd[0]) < threshold && Math.abs(segStart[1] - ringEnd[1]) < threshold) {
          ring = ring.concat(seg.slice(1));
          used.add(j);
          changed = true;
        }
        // Check if seg end connects to ring end (reverse the segment)
        else if (Math.abs(segEnd[0] - ringEnd[0]) < threshold && Math.abs(segEnd[1] - ringEnd[1]) < threshold) {
          ring = ring.concat(seg.reverse().slice(1));
          used.add(j);
          changed = true;
        }
        // Check if seg end connects to ring start
        else if (Math.abs(segEnd[0] - ringStart[0]) < threshold && Math.abs(segEnd[1] - ringStart[1]) < threshold) {
          ring = seg.concat(ring.slice(1));
          used.add(j);
          changed = true;
        }
        // Check if seg start connects to ring start (reverse the segment)
        else if (Math.abs(segStart[0] - ringStart[0]) < threshold && Math.abs(segStart[1] - ringStart[1]) < threshold) {
          ring = seg.reverse().concat(ring.slice(1));
          used.add(j);
          changed = true;
        }

        if (changed) break; // restart search from the new ring endpoints
      }
    }

    // Close the ring if endpoints are close
    const start = ring[0];
    const end = ring[ring.length - 1];
    if (Math.abs(start[0] - end[0]) < 0.001 && Math.abs(start[1] - end[1]) < 0.001) {
      ring.push([...start]); // force close
    }

    rings.push(ring);
  }

  return rings;
}

// ─── Point-in-polygon (ray casting) ───
function pointInRing(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]; // lng, lat
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ─── STEP 2: Generate navigation grid ───
function generateNavGrid(outerRings, innerRings) {
  // Compute bounds from actual data
  let south = 90, north = -90, west = 180, east = -180;
  for (const ring of outerRings) {
    for (const [lng, lat] of ring) {
      if (lat < south) south = lat;
      if (lat > north) north = lat;
      if (lng < west) west = lng;
      if (lng > east) east = lng;
    }
  }

  // Add small padding
  south -= 0.002; north += 0.002;
  west -= 0.002; east += 0.002;

  const cols = Math.ceil((east - west) / GRID_RESOLUTION);
  const rows = Math.ceil((north - south) / GRID_RESOLUTION);

  console.log(`\n🗺️  Generating navigation grid...`);
  console.log(`   Bounds: ${south.toFixed(4)}–${north.toFixed(4)} lat, ${west.toFixed(4)}–${east.toFixed(4)} lng`);
  console.log(`   Grid: ${cols} x ${rows} = ${(cols * rows).toLocaleString()} cells`);
  console.log(`   Resolution: ~${(GRID_RESOLUTION * 111000).toFixed(0)}m per cell`);

  // 0 = land, 1 = open water, 2 = near-shore water
  const grid = new Uint8Array(rows * cols);
  let waterCells = 0;

  const startTime = Date.now();

  for (let row = 0; row < rows; row++) {
    const lat = south + (row + 0.5) * GRID_RESOLUTION;

    for (let col = 0; col < cols; col++) {
      const lng = west + (col + 0.5) * GRID_RESOLUTION;

      // Check if inside ANY outer ring (= water)
      let inWater = false;
      for (const ring of outerRings) {
        if (pointInRing(lat, lng, ring)) {
          inWater = true;
          break;
        }
      }

      if (!inWater) continue; // land — stays 0

      // Check if inside ANY inner ring (= island, so it's land)
      let onIsland = false;
      for (const ring of innerRings) {
        if (pointInRing(lat, lng, ring)) {
          onIsland = true;
          break;
        }
      }

      if (onIsland) continue; // island — stays 0

      grid[row * cols + col] = 1;
      waterCells++;
    }

    // Progress
    if (row % 20 === 0) {
      const pct = ((row / rows) * 100).toFixed(0);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      process.stdout.write(`\r   Processing: ${pct}% (${elapsed}s)`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\r   Processing: 100% (${totalTime}s)`);
  console.log(`   Water cells: ${waterCells.toLocaleString()} / ${(rows * cols).toLocaleString()} (${((waterCells / (rows * cols)) * 100).toFixed(1)}%)`);

  // ─── Apply shore buffer ───
  console.log(`   Applying ${SHORE_BUFFER_CELLS}-cell shore buffer...`);
  const buffered = new Uint8Array(grid);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row * cols + col] !== 1) continue;

      let nearLand = false;
      outer:
      for (let dr = -SHORE_BUFFER_CELLS; dr <= SHORE_BUFFER_CELLS; dr++) {
        for (let dc = -SHORE_BUFFER_CELLS; dc <= SHORE_BUFFER_CELLS; dc++) {
          const nr = row + dr, nc = col + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr * cols + nc] === 0) {
            nearLand = true;
            break outer;
          }
        }
      }

      if (nearLand) {
        buffered[row * cols + col] = 2; // navigable but near shore — higher A* cost
      }
    }
  }

  // ─── RLE compress ───
  const rle = [];
  let val = buffered[0], count = 1;
  for (let i = 1; i < buffered.length; i++) {
    if (buffered[i] === val) { count++; }
    else { rle.push(val, count); val = buffered[i]; count = 1; }
  }
  rle.push(val, count);

  const jsonSize = JSON.stringify(rle).length;
  console.log(`   RLE: ${rle.length / 2} runs (${(jsonSize / 1024).toFixed(0)} KB)`);

  return {
    bounds: { south, north, west, east },
    resolution: GRID_RESOLUTION,
    rows,
    cols,
    shore_buffer_cells: SHORE_BUFFER_CELLS,
    water_cells: waterCells,
    grid_rle: rle,
  };
}

// ─── MAIN ───
function main() {
  const { outerRings, innerRings } = loadLakeData();

  // Quick stats on rings
  const outerPoints = outerRings.reduce((s, r) => s + r.length, 0);
  const innerPoints = innerRings.reduce((s, r) => s + r.length, 0);
  console.log(`   Outer rings: ${outerRings.length} (${outerPoints.toLocaleString()} points)`);
  console.log(`   Inner rings: ${innerRings.length} (${innerPoints.toLocaleString()} points)`);

  // Warn about unclosed rings
  const unclosed = outerRings.filter(r => {
    const s = r[0], e = r[r.length - 1];
    return Math.abs(s[0] - e[0]) > 0.001 || Math.abs(s[1] - e[1]) > 0.001;
  });
  if (unclosed.length > 0) {
    console.log(`   ⚠️  ${unclosed.length} outer rings are not closed — may cause gaps`);
  }

  const navGrid = generateNavGrid(outerRings, innerRings);

  mkdirSync('src/data', { recursive: true });
  writeFileSync('src/data/nav-grid.json', JSON.stringify(navGrid));
  const fileSize = (JSON.stringify(navGrid).length / 1024).toFixed(0);
  console.log(`\n✅ Saved src/data/nav-grid.json (${fileSize} KB)`);
  console.log(`   Grid: ${navGrid.cols}x${navGrid.rows}, ${navGrid.water_cells.toLocaleString()} navigable cells`);
  console.log('\n   Next: paste me the output and I\'ll build the A* water-router.');
}

main();
