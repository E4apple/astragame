// ============================================================
// mapGenerator.js — Ported from Map_Generator.yymps (GML → JS)
// Verlet physics bubble simulation → roguelike node map
// Same algorithm as Slay the Spire's map generation
// ============================================================

import { useEffect, useRef } from 'react';

// ── VERLET PARTICLE ─────────────────────────────────────────
class Particle {
  constructor(x, y, radius) {
    this.x  = x;
    this.y  = y;
    this.px = x; // previous position
    this.py = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.mass   = radius * radius; // mass proportional to area
  }

  applyImpulse(fx, fy) {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
  }

  update() {
    // Verlet integration: new_pos = pos + (pos - prev_pos) + velocity
    const nx = this.x + (this.x - this.px) + this.vx;
    const ny = this.y + (this.y - this.py) + this.vy;
    this.px = this.x;
    this.py = this.y;
    this.x  = nx;
    this.y  = ny;
    this.vx *= 0.85; // damping
    this.vy *= 0.85;
  }

  constrainInBounds(x0, y0, x1, y1) {
    if (this.x - this.radius < x0) this.x = x0 + this.radius;
    if (this.x + this.radius > x1) this.x = x1 - this.radius;
    if (this.y - this.radius < y0) this.y = y0 + this.radius;
    if (this.y + this.radius > y1) this.y = y1 - this.radius;
  }
}

// ── COLLISION RESOLUTION ─────────────────────────────────────
function resolveCollisions(particles) {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      const dx   = b.x - a.x;
      const dy   = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const minD = a.radius + b.radius;

      if (dist < minD) {
        const overlap = (minD - dist) / 2;
        const nx = (dx / dist) * overlap;
        const ny = (dy / dist) * overlap;
        a.x -= nx; a.y -= ny;
        b.x += nx; b.y += ny;
      }
    }
  }
}

// ── RANDOM HELPERS ───────────────────────────────────────────
function rnd(min, max) { return Math.random() * (max - min) + min; }
function irnd(min, max) { return Math.floor(rnd(min, max + 1)); }
function pick(arr) { return arr[irnd(0, arr.length - 1)]; }

// ── CORE: CREATE MAP ─────────────────────────────────────────
/**
 * Generates a roguelike node map using Verlet bubble physics.
 * Direct port of create_map() + oMap Create event from the .yymps package.
 *
 * @param {object} options
 * @param {number} options.x          Left bound (default 0)
 * @param {number} options.y          Top bound (default 0)
 * @param {number} options.width      Right bound (default 800)
 * @param {number} options.height     Bottom bound (default 600)
 * @param {boolean} options.vertical  Rotate map 90° — horizontal layout (default false)
 * @param {number} options.numBubbles Number of rooms/nodes (default 75)
 * @param {number[]} options.sizes    Bubble size multipliers (default [0.4, 0.75, 1])
 * @param {number} options.baseRadius Base bubble radius in px (default 28)
 * @param {number} options.steps      Physics simulation steps (default 180)
 * @param {number} options.seed       Random seed — same seed = same map (optional)
 *
 * @returns {{ nodes: Array, map: number[] }}
 *   nodes[i] = { x, y, radius, neighbors: number[] }
 *   map      = ordered array of node indices forming the dungeon path
 */
export function createMap({
  x          = 0,
  y          = 0,
  width      = 800,
  height     = 600,
  vertical   = false,
  numBubbles = 75,
  sizes      = [0.4, 0.75, 1],
  baseRadius = 28,
  steps      = 180,
  seed,
} = {}) {

  // Optionally seed with a simple LCG if you need reproducibility
  // (JS Math.random can't be seeded natively — pass a seeded rng if needed)

  // ── 1. Spawn bubbles ────────────────────────────────────────
  const particles = [];
  for (let i = 0; i < numBubbles; i++) {
    const scale  = pick(sizes);
    const radius = baseRadius * scale;
    const px     = rnd(x + radius, width  - radius);
    const py     = rnd(y + radius, height - radius);
    const p      = new Particle(px, py, radius);

    // Random initial impulse (same as verlet_part_apply_impulse in GML)
    const dir = rnd(0, Math.PI * 2);
    const mag = rnd(30, 60);
    p.applyImpulse(Math.sin(dir) * mag, Math.cos(dir) * mag);
    particles.push(p);
  }

  // ── 2. Run physics simulation ───────────────────────────────
  for (let s = 0; s < steps; s++) {
    for (const p of particles) p.update();
    resolveCollisions(particles);
    for (const p of particles) p.constrainInBounds(x, y, width, height);
    // Extra collision passes for stability
    resolveCollisions(particles);
    resolveCollisions(particles);
  }

  // ── 3. Build node list from settled bubble positions ────────
  let nodes = particles.map((p, i) => ({
    x: p.x, y: p.y, radius: p.radius, neighbors: [],
  }));

  // Optionally swap x/y for vertical (horizontal) layout
  if (vertical) {
    nodes = nodes.map(n => ({ ...n, x: n.y, y: n.x }));
  }

  // ── 4. Connect neighbours (touching or near-touching) ───────
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx   = nodes[i].x - nodes[j].x;
      const dy   = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Connect if within 110% of combined radii (GML: < 1.1*(ri+rj))
      if (dist < 1.1 * (nodes[i].radius + nodes[j].radius)) {
        nodes[i].neighbors.push(j);
      }
    }
  }

  // ── 5. Path tracing (green/red vertical, blue horizontal) ───
  // Find 2 topmost nodes
  let best  = { idx: 0, y: Infinity };
  let best2 = { idx: 1, y: Infinity };
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].y < best.y) {
      best2 = { ...best };
      best  = { idx: i, y: nodes[i].y };
    } else if (nodes[i].y < best2.y) {
      best2 = { idx: i, y: nodes[i].y };
    }
  }

  // Trace a vertical path downward from startIdx
  function traceVertical(startIdx) {
    const path = [startIdx];
    let cur = startIdx;
    for (let guard = 0; guard < 1000; guard++) {
      const below = nodes[cur].neighbors.filter(n => nodes[n].y > nodes[cur].y);
      if (below.length === 0) break;
      cur = pick(below);
      path.push(cur);
    }
    return path;
  }

  // Trace a horizontal path from startIdx
  function traceHorizontal(startIdx, mapWidth) {
    const path = [startIdx];
    let cur  = startIdx;
    const goLeft = nodes[cur].x > mapWidth / 2; // head toward nearest wall
    for (let guard = 0; guard < 1000; guard++) {
      const sideways = nodes[cur].neighbors.filter(n =>
        goLeft ? nodes[n].x < nodes[cur].x : nodes[n].x > nodes[cur].x
      );
      if (sideways.length === 0) break;
      cur = pick(sideways);
      path.push(cur);
    }
    return path;
  }

  const green = traceVertical(best.idx);
  const red   = traceVertical(best2.idx);
  const blue1 = traceHorizontal(pick(green), width);
  const blue2 = traceHorizontal(pick(red),   width);

  // ── 6. Merge paths into final map (deduplicated) ────────────
  const seen = new Set();
  const map  = [];
  for (const path of [green, red, blue1, blue2]) {
    for (const idx of path) {
      if (!seen.has(idx)) { seen.add(idx); map.push(idx); }
    }
  }

  // ── 7. Trim neighbor lists to map-only nodes ─────────────────
  const mapSet = new Set(map);
  for (const idx of map) {
    nodes[idx].neighbors = nodes[idx].neighbors.filter(n => mapSet.has(n));
  }

  // Swap back x/y if vertical
  if (vertical) {
    for (const n of nodes) { const tmp = n.x; n.x = n.y; n.y = tmp; }
  }

  return { nodes, map };
}


// ── NODE SPRITE LOADER ───────────────────────────────────────
const NODE_SPRITES = {
  start:   'map_nodes/node_start.png',
  room:    'map_nodes/node_room.png',
  elite:   'map_nodes/node_elite.png',
  rest:    'map_nodes/node_rest.png',
  shop:    'map_nodes/node_shop.png',
  mystery: 'map_nodes/node_mystery.png',
  boss:    'map_nodes/node_boss.png',
};

const _imgCache = {};
function loadImg(src) {
  if (_imgCache[src]) return _imgCache[src];
  const img = new Image();
  img.src = `/assets/map_nodes/${src.replace('map_nodes/', '')}`;
  _imgCache[src] = img;
  return img;
}

// Preload all node sprites (call once at app start)
export function preloadMapSprites() {
  Object.values(NODE_SPRITES).forEach(loadImg);
}

// ── REACT COMPONENT: MapRenderer ─────────────────────────────
// Usage:
//   import { createMap, MapRenderer, preloadMapSprites } from './mapGenerator';
//   preloadMapSprites();  // call once in App.jsx
//   const mapData = createMap({ width: 400, height: 700, numBubbles: 60 });
//   <MapRenderer mapData={mapData} width={400} height={700} />

export function MapRenderer({
  mapData,
  width          = 400,
  height         = 700,
  lineColor      = '#8a6a10',
  nodeSize       = 36,
  activeNode     = null,
  reachableNodes = [],
  visitedNodes   = [],
  onNodeClick    = null,
}) {
  const canvasRef = useRef(null);
  const reachSet  = new Set(reachableNodes);
  const visitSet  = new Set(visitedNodes);

  useEffect(() => {
    if (!mapData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const { nodes, map } = mapData;

    ctx.clearRect(0, 0, width, height);

    // Draw connecting lines
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    for (const idx of map) {
      const n = nodes[idx];
      for (const nIdx of n.neighbors) {
        const nb = nodes[nIdx];
        const bothVisited = visitSet.has(idx) && visitSet.has(nIdx);
        ctx.strokeStyle = bothVisited ? 'rgba(245,158,11,.55)' : 'rgba(255,255,255,.12)';
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Draw node icons
    const half = nodeSize / 2;
    for (const idx of map) {
      const n         = nodes[idx];
      const type      = n.type || 'room';
      const sprite    = NODE_SPRITES[type] || NODE_SPRITES.room;
      const img       = loadImg(sprite);
      const isActive  = idx === activeNode;
      const isReach   = reachSet.has(idx);
      const isVisited = visitSet.has(idx);

      const scale = isActive ? 1.3 : isReach ? 1.15 : 1.0;
      const sz    = nodeSize * scale;
      const sh    = sz / 2;
      const alpha = isVisited && !isActive ? 0.35 : 1.0;

      ctx.globalAlpha = alpha;

      // Active: gold glow ring
      if (isActive) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, sh + 7, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffe066';
        ctx.lineWidth   = 3;
        ctx.stroke();
      }
      // Reachable: white pulsing ring
      if (isReach) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, sh + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.7)';
        ctx.lineWidth   = 2;
        ctx.stroke();
      }

      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, n.x - sh, n.y - sh, sz, sz);
      } else {
        ctx.beginPath();
        ctx.arc(n.x, n.y, half, 0, Math.PI * 2);
        ctx.fillStyle = '#f5c842';
        ctx.fill();
        img.onload = () => {
          if (canvasRef.current) {
            const c2 = canvasRef.current.getContext('2d');
            c2.drawImage(img, n.x - sh, n.y - sh, sz, sz);
          }
        };
      }

      ctx.globalAlpha = 1.0;
    }
  }, [mapData, activeNode, reachableNodes, visitedNodes, width, height, lineColor, nodeSize]);

  // Click → find closest node within 36px
  function handleClick(e) {
    if (!onNodeClick || !mapData) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const { nodes, map } = mapData;

    let closest = null, closestDist = Infinity;
    for (const idx of map) {
      const dx   = nodes[idx].x - mx;
      const dy   = nodes[idx].y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist && dist < 36) { closest = idx; closestDist = dist; }
    }
    if (closest !== null) onNodeClick(closest);
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
    />
  );
}


// ── USAGE EXAMPLE ────────────────────────────────────────────
//
// import { useState, useEffect } from 'react';
// import { createMap, MapRenderer } from './mapGenerator';
//
// export default function FloorMap() {
//   const [mapData,     setMapData]     = useState(null);
//   const [activeNode,  setActiveNode]  = useState(null);
//
//   useEffect(() => {
//     setMapData(createMap({
//       x: 20, y: 20, width: 360, height: 660,  // fits in player's enemy zone
//       numBubbles: 60,
//       sizes: [0.5, 0.75, 1],
//       vertical: false,   // true = horizontal map layout
//     }));
//   }, []);
//
//   const handleRegenerate = () => {
//     setMapData(createMap({ x: 20, y: 20, width: 360, height: 660, numBubbles: 60 }));
//     setActiveNode(null);
//   };
//
//   return (
//     <div>
//       <MapRenderer
//         mapData={mapData}
//         width={400} height={700}
//         activeNode={activeNode}
//         onNodeClick={(idx) => {
//           setActiveNode(idx);
//           console.log('Player moved to node', idx, mapData.nodes[idx]);
//           // → spawn enemy, start combat, etc.
//         }}
//       />
//       <button onClick={handleRegenerate}>New Floor</button>
//     </div>
//   );
// }
